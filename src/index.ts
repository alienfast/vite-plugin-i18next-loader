/* eslint-disable no-console */
import path from 'node:path'

import { merge, set } from 'lodash-es'
import { Plugin } from 'vite'

import {
  assertExistence,
  enumerateLangs,
  findAll,
  jsNormalizedLang,
  loadAndParse,
  resolvedVirtualModuleId,
  resolvePaths,
  virtualModuleId,
} from './utils'

export interface Options {
  /**
   * Log debug information
   */
  debug?: boolean

  /**
   * Glob patterns to match files
   *
   * Default: ['**\/*.json', '**\/*.yml', '**\/*.yaml']
   */
  include?: string[]

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

// for fast match on hot reloading check?
let loadedFiles: string[] = []
let allLangs: Set<string> = new Set()

const factory = (options: Options) => {
  function debug(...args: any[]) {
    if (options.debug) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      console.log(...args)
    }
  }

  function loadLocales() {
    const localeDirs = resolvePaths(options.paths, process.cwd())
    assertExistence(localeDirs)

    //
    let appResBundle = {}
    loadedFiles = [] // reset
    debug('Bundling locales (ordered least specific to most):')
    localeDirs.forEach((nextLocaleDir) => {
      // all subdirectories match language codes
      const langs = enumerateLangs(nextLocaleDir)
      allLangs = new Set([...allLangs, ...langs])
      for (const lang of langs) {
        const resBundle = {}
        resBundle[lang] = {}

        const langDir = path.join(nextLocaleDir, lang) // top level lang dir
        const langFiles = findAll(
          options.include || ['**/*.json', '**/*.yml', '**/*.yaml'],
          langDir,
        ) // all lang files matching patterns in langDir

        for (const langFile of langFiles) {
          loadedFiles.push(langFile) // track for fast hot reload matching
          debug('\t' + langFile)

          const content = loadAndParse(langFile)

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
            set(resBundle, namespace, content)
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

    const bundle = namedBundle + defaultExport

    // finally, print out the results
    debug('Final locales bundle: \n' + bundle)
    debug('loadedFiles', loadedFiles)
    return bundle
  }

  const plugin: Plugin = {
    name: 'vite-plugin-i18next-loader', // required, will show up in warnings and errors
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
      return null
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

    //
    // Watch translation message files,
    // and emit a custom event with the updated messages
    //
    // @see https://github.com/vitejs/vite/issues/6871
    // @see https://github.com/vitejs/vite/pull/10333 <- this is the one that would be easiest
    //
    handleHotUpdate({ file, server }) {
      debug('hot update', file)
      if (loadedFiles.includes(file)) {
        console.log('Triggering full reload based on changed file: ', file)

        const bundle = loadLocales()

        // the simplest of hot updates - a full reload, problem is it doesn't update i18n cache, or does it?
        server.ws.send({
          type: 'full-reload',
          path: '*',
        })

        // send custom event for custom listener to update the i18n resources and expire the cache.
        // server.ws.send({
        //   type: 'custom',
        //   event: 'i18next-update',
        //   data: bundle,
        // })
      }
      /* client side code
        // Only if you want hot module replacement when translation message file change
        if (import.meta.hot) {
          import.meta.hot.on("locales-update", (data) => {
            Object.keys(data).forEach((lang) => {
              i18n.global.setLocaleMessage(lang, data[lang]);
            });
          });
        }
      */
    },
  }
  return plugin
}

export default factory
