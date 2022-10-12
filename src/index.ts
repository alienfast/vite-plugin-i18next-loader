/* eslint-disable no-console */
import path from 'node:path'

import { merge, set } from 'lodash-es'
import { Plugin } from 'vite'

import { assertExistence, enumerateLangs, findAll, loadAndParse, resolvePaths } from './utils'

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

const virtualModuleId = 'virtual:i18next-loader'
export const resolvedVirtualModuleId = '\0' + virtualModuleId

const factory = (options: Options) => {
  function debug(...args: any[]) {
    if (options.debug) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      console.log(...args)
    }
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

      const localeDirs = resolvePaths(options.paths, process.cwd())
      assertExistence(localeDirs)

      //
      let appResBundle = {}
      loadedFiles = [] // reset
      debug('Bundling locales (ordered least specific to most):')
      localeDirs.forEach((nextLocaleDir) => {
        // all subdirectories match language codes
        const langs = enumerateLangs(nextLocaleDir)
        for (const lang of langs) {
          const resBundle = {}
          resBundle[lang] = {}

          const langDir = path.join(nextLocaleDir, lang) // top level lang dir
          const langFiles = findAll(
            options.include || ['**/*.json', '**/*.yml', '**/*.yaml'],
            langDir,
          ) // all lang files matching patterns in langDir

          for (const langFile of langFiles) {
            this.addWatchFile(langFile)
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
      const bundle = `export default ${JSON.stringify(appResBundle)}`
      debug('Final locales bundle: \n' + bundle)
      return bundle
    },

    //
    // Watch translation message files,
    // and emit a custom event with the updated messages
    //
    // handleHotUpdate({ file, server }) {
    // if (!file.includes(path) || file.split('.').pop() !== 'json') return
    // const matched = file.match(/(.+\/)*(.+)\.(.+)\.json/i)
    // if (matched && matched.length > 1) {
    //   files = getFiles(path, 'json')
    //   messages = files.reduce(getMessages, {})
    //   server.ws.send({
    //     type: 'custom',
    //     event: 'locales-update',
    //     data: messages,
    //   })
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
    // },
  }
  return plugin
}

export default factory
