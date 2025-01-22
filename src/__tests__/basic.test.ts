/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as path from 'node:path'

import { beforeEach, describe, expect, it } from 'vitest'

import factory from '../index.js'
import { resolvedVirtualModuleId } from '../utils.js'
import { esm, ThisScope } from './util.js'

describe('basic', () => {
  for (const type of ['yaml', 'json']) {
    // eslint-disable-next-line unicorn/prefer-module
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
      })

      it.concurrent('should process include', () => {
        const load = factory({ paths: [appLocalesDir], include: ['**/*.json'] }).load
        thisScope.addWatchFile = function (path) {
          expect(path).not.toMatch(/main\.nonjson/)
        }

        const res = (load as any).call(thisScope, resolvedVirtualModuleId)
      })

      it.concurrent('should not process files that are excluded', async () => {
        const load = factory({
          paths: [appLocalesDir],
          include: [`**/*.${type}`],
          ignore: [`**/exclude.${type}`],
        }).load
        thisScope.addWatchFile = function (path) {
          expect(path).not.toMatch(/exclude\.json/)
        }

        const res = (load as any).call(thisScope, resolvedVirtualModuleId) as string
        const resStore = await import(esm(res))
        expect(resStore.de.main.foo).toStrictEqual(undefined)
        assertCommon(resStore)
      })
    })
  }
})
