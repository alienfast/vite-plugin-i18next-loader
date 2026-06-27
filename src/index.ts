import path from 'node:path'

import { setProperty } from 'dot-prop'
import type { IgnoreLike } from 'glob'
import { marked } from 'marked'
import TerminalRenderer from 'marked-terminal'
import { merge } from 'ts-deepmerge'
import { createLogger, type LogLevel, type Plugin } from 'vite'

import {
  assertExistence,
  enumerateLangs,
  findAll,
  jsNormalizedLang,
  loadAndParse,
  resolvedVirtualModuleId,
  resolvePaths,
  virtualModuleId,
} from './utils.js'

marked.setOptions({
  renderer: new TerminalRenderer(),
})

// unfortunately not exported
export const LogLevels: Record<LogLevel, number> = {
  error: 1,
  info: 3,
  silent: 0,
  warn: 2,
}

export interface Options {
  /**
   * Set to 'info' for noisy information.
   *
   * Default: 'warn'
   */
  logLevel?: LogLevel

  /**
   * Glob patterns to match files
   *
   * Default: ['**\/*.json', '**\/*.yml', '**\/*.yaml']
   */
  include?: string[]

  /**
   * Glob patterns to exclude/ignore
   *
   * @see https://github.com/isaacs/node-glob
   */
  ignore?: string | string[] | IgnoreLike

  /**
   * Locale top level directory paths ordered from least specialized to most specialized
   *  e.g. lib locale -> app locale
   *
   * Locales loaded later will overwrite any duplicated key via a deep merge strategy.
   */
  paths: string[]

  /**
   * Default: none
   */
  namespaceResolution?: 'basename' | 'relativePath'
}

export interface ResBundle {
  [key: string]: string | object
}

// for fast match on hot reloading check?
let loadedFiles: string[] = []
let allLangs: Set<string> = new Set()

const factory = (options: Options) => {
  const log = createLogger(options.logLevel || 'warn', { prefix: '[i18next-loader]' })

  function loadLocales() {
    const localeDirs = resolvePaths(options.paths, process.cwd())
    assertExistence(localeDirs)
    const allNamespaces = new Set()

    //
    let appResBundle: ResBundle = {}
    loadedFiles = [] // reset
    log.info('Bundling locales (ordered least specific to most):', {
      timestamp: true,
    })
    localeDirs.forEach((nextLocaleDir) => {
      // all subdirectories match language codes
      const langs = enumerateLangs(nextLocaleDir)
      allLangs = new Set([...allLangs, ...langs])
      for (const lang of langs) {
        const resBundle: ResBundle = {}
        resBundle[lang] = {}

        const langDir = path.join(nextLocaleDir, lang) // top level lang dir
        const langFiles = findAll(
          options.include || ['**/*.json', '**/*.yml', '**/*.yaml'],
          langDir,
          options.ignore,
        ) // all lang files matching patterns in langDir

        for (const langFile of langFiles) {
          loadedFiles.push(langFile) // track for fast hot reload matching
          log.info(`\t${langFile}`, {
            timestamp: true,
          })

          const content = loadAndParse(langFile) ?? {}

          if (options.namespaceResolution) {
            let namespaceFilepath: string = langFile
            if (options.namespaceResolution === 'relativePath') {
              namespaceFilepath = path.relative(path.join(nextLocaleDir, lang), langFile)
            } else if (options.namespaceResolution === 'basename') {
              namespaceFilepath = path.basename(langFile)
            }
            const extname = path.extname(langFile)
            const namespaceParts = namespaceFilepath.replace(extname, '').split(path.sep)
            const namespace = [lang].concat(namespaceParts).join('.')
            setProperty(resBundle, namespace, content)
            allNamespaces.add(namespaceParts.join('.'))
          } else {
            resBundle[lang] = content
          }
          appResBundle = merge(appResBundle, resBundle)
        }
      }
    })

    // one bundle - works, no issues with dashes in names
    // const bundle = `export default ${JSON.stringify(appResBundle)}`

    // named exports, requires manipulation of names
    let namedBundle = ''
    for (const lang of allLangs) {
      namedBundle += `export const ${jsNormalizedLang(lang)} = ${JSON.stringify(
        appResBundle[lang],
      )}\n`
    }
    let defaultExport = 'const resources = { \n'
    for (const lang of allLangs) {
      defaultExport += `"${lang}": ${jsNormalizedLang(lang)},\n`
    }
    defaultExport += '}'
    defaultExport += '\nexport default resources\n'

    let langs = 'export const langs = [\n'
    for (const lang of allLangs) langs += `"${lang}",\n`
    langs += ']\n'

    let namespaces = 'export const namespaces = [\n'
    for (const ns of allNamespaces) namespaces += `"${ns}",\n`
    namespaces += ']\n'

    const bundle = namedBundle + langs + namespaces + defaultExport

    log.info(`Locales module '${resolvedVirtualModuleId}':`, {
      timestamp: true,
    })

    // emulate log.info for our marked terminal output
    if (LogLevels[options.logLevel || 'warn'] >= LogLevels.info) {
      console.log(
        marked(`
\`\`\`js
${bundle}
\`\`\`
`),
      )
    }
    return bundle
  }

  const plugin: Plugin = {
    /**
     * Watch translation message files and trigger an update.
     *
     * @see https://github.com/vitejs/vite/pull/10333 <- TODO this is the one that would be easiest and may not be a full reload
     */
    async handleHotUpdate({ file, server }) {
      const isLocaleFile =
        file.match(/\.(json|yml|yaml)$/) &&
        options.paths.some((p) =>
          file.startsWith(path.isAbsolute(p) ? p : path.join(process.cwd(), p)),
        )
      if (isLocaleFile) {
        log.info(`Changed locale file: ${file}`, {
          timestamp: true,
        })

        const { moduleGraph } = server

        const module = moduleGraph.getModuleById(resolvedVirtualModuleId)
        if (module) {
          await server.reloadModule(module)
        }
      }
    },
    load(id) {
      if (id !== resolvedVirtualModuleId) {
        return null
      }

      const bundle = loadLocales()
      for (const file of loadedFiles) {
        this.addWatchFile(file)
      }
      return bundle
    },
    name: 'vite-plugin-i18next-loader', // required, will show up in warnings and errors
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
      return null
    },
  }
  return plugin
}

export default factory
