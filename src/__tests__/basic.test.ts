import * as path from 'node:path'

import { beforeEach, describe, expect, it } from 'vitest'

import factory from '../index.js'
import { resolvedVirtualModuleId } from '../utils.js'
import { esm, type ThisScope } from './util.js'

describe('basic', () => {
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
        expect(resStore.dev.main.test).toStrictEqual('Dev dev dev!')
        expect(resStore.de.main.test).toStrictEqual('Das ist ein Test!')
        expect(resStore.en.main.test).toStrictEqual('This is a test!')
        expect(resStore.fr.main.test).toStrictEqual('Ceci est un test!')

      }

      it.concurrent('should generate the structure', async () => {
        const load = factory({ paths: [appLocalesDir] }).load
        const res = (load as any).call(thisScope, resolvedVirtualModuleId) as string
        const resStore = await import(esm(res))
        assertCommon(resStore)

        console.log(resStore)
        expect(resStore.langs.toSorted()).toEqual(["de","dev","en","fr"])
        expect(resStore.namespaces.toSorted()).toEqual([]) // no namespaces without namespaceResolution
      })

      it.concurrent('should process include', () => {
        const load = factory({ include: ['**/*.json'], paths: [appLocalesDir] }).load
        thisScope.addWatchFile = (path) => {
          expect(path).not.toMatch(/main\.nonjson/)
        }

        // invoke load purely for its addWatchFile side effect
        void (load as any).call(thisScope, resolvedVirtualModuleId)
      })

      it.concurrent('should not process files that are excluded', async () => {
        const load = factory({
          ignore: [`**/exclude.${type}`],
          include: [`**/*.${type}`],
          paths: [appLocalesDir],
        }).load
        thisScope.addWatchFile = (path) => {
          expect(path).not.toMatch(/exclude\.json/)
        }

        const res = (load as any).call(thisScope, resolvedVirtualModuleId) as string
        const resStore = await import(esm(res))
        expect(resStore.de.main.foo).toStrictEqual(undefined)
        assertCommon(resStore)

        console.log(resStore)
        //check that langs and namespaces are populated
        expect(resStore.langs.toSorted()).toEqual(["de","dev","en","fr"])
        expect(resStore.namespaces.toSorted()).toEqual([]) // no namespaces without namespaceResolution
      })
    })
  }
})
