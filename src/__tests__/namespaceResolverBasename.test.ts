import * as path from 'node:path'

import { beforeEach, describe, expect, it } from 'vitest'

import factory from '../index.js'
import { resolvedVirtualModuleId } from '../utils.js'
import { esm, type ThisScope } from './util.js'

describe('namespaceResolverBasename', () => {
  for (const type of ['yaml', 'json']) {
    const appLocalesDir = path.join(__dirname, `./data/basic-app-${type}/locales`)
    describe(type, () => {
      let thisScope: ThisScope

      beforeEach(() => {
        // mock vite-plugin `this` scope
        thisScope = {
          addWatchFile: () => {},
        }
      })

      function assertCommon(resStore: any) {
        expect(resStore.dev.main.main.test).toStrictEqual('Dev dev dev!')
        expect(resStore.de.main.main.test).toStrictEqual('Das ist ein Test!')
        expect(resStore.en.main.main.test).toStrictEqual('This is a test!')
        expect(resStore.fr.main.main.test).toStrictEqual('Ceci est un test!')
        //check that langs and namespaces are populated
        expect(resStore.langs.toSorted()).toEqual(["de","dev","en","fr"])
        expect(resStore.namespaces.toSorted()).toEqual(["exclude","main"])
      }

      it.concurrent('should generate the structure', async () => {
        const load = factory({ namespaceResolution: 'basename', paths: [appLocalesDir] }).load
        const res = (load as any).call(thisScope, resolvedVirtualModuleId)
        const resStore = await import(esm(res))
        assertCommon(resStore)
      })
    })
  }
})
