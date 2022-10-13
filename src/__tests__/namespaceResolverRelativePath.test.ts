/* eslint-disable unicorn/prefer-module */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as path from 'node:path'

import { beforeEach, describe, expect, it } from 'vitest'

import factory from '..'
import { resolvedVirtualModuleId } from '../utils'
import { esm, ThisScope } from './util'

describe('namespaceResolverRelativePath', () => {
  for (const type of ['yaml', 'json']) {
    const appLocalesDir = path.join(__dirname, `./data/relativePathAsNamespace-${type}/locales`)
    describe(type, () => {
      let thisScope: ThisScope

      beforeEach(() => {
        // mock vite-plugin `this` scope
        thisScope = {
          addWatchFile: () => {},
        }
      })

      function assertCommon(resStore: any) {
        expect(resStore.dev.main.main.main.test).toStrictEqual('Dev dev dev!')
        expect(resStore.de.main.main.main.test).toStrictEqual('Das ist ein Test!')
        expect(resStore.en.main.main.main.test).toStrictEqual('This is a test!')
        expect(resStore.fr.main.main.main.test).toStrictEqual('Ceci est un test!')
      }

      it('should generate the structure', async () => {
        const load = factory({ paths: [appLocalesDir], namespaceResolution: 'relativePath' }).load
        const res = (load as any).call(thisScope, resolvedVirtualModuleId) as string
        const resStore = await import(esm(res))
        assertCommon(resStore)
      })
    })
  }
})
