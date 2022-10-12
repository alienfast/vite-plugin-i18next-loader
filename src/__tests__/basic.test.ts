/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-eval */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as path from 'node:path'

import { merge } from 'lodash-es'
import { beforeEach, describe, expect, it } from 'vitest'

import factory, { Options, resolvedVirtualModuleId } from '../index'
import { LoaderPlugin, ThisScope } from './types'

describe('basic', () => {
  for (const type of ['yaml', 'json']) {
    describe(type, () => {
      let thisScope: ThisScope
      function newPlugin(options: Partial<Options> = {}) {
        return factory(
          merge(
            {
              // eslint-disable-next-line unicorn/prefer-module
              paths: [path.join(__dirname, `./data/basic-app-${type}/locales`)],
            },
            options,
          ),
        ) as LoaderPlugin
      }

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

      it('should generate the structure', () => {
        const load = newPlugin().load
        const res = (load as any).call(thisScope, resolvedVirtualModuleId) as string
        const resStore = eval(res)
        assertCommon(resStore)
      })

      it('should process include', () => {
        const load = newPlugin({ include: ['**/*.json'] }).load
        thisScope.addWatchFile = function (path) {
          assert.notInclude(path, 'main.nonjson')
        }

        const res = (load as any).call(thisScope, resolvedVirtualModuleId)
      })

      it('should not process files that are excluded', () => {
        const load = newPlugin({ include: [`**/*.${type}`, `!**/exclude.${type}`] }).load
        thisScope.addWatchFile = function (path) {
          assert.notInclude(path, 'exclude.json')
        }

        const res = (load as any).call(thisScope, resolvedVirtualModuleId)
        const resStore = eval(res)
        expect(resStore.de.main.foo).toStrictEqual(undefined)
        assertCommon(resStore)
      })
    })
  }
})
