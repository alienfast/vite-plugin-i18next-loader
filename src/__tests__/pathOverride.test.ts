/* eslint-disable unicorn/prefer-module */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as path from 'node:path'

import { beforeEach, describe, expect, it } from 'vitest'

import factory from '..'
import { resolvedVirtualModuleId } from '../utils'
import { esm, ThisScope } from './util'

describe('pathOverride', () => {
  for (const type of ['yaml', 'json']) {
    const appLocalesDir = path.join(__dirname, `./data/override-app-${type}/locales`)
    describe(type, () => {
      let thisScope: ThisScope

      beforeEach(() => {
        // mock vite-plugin `this` scope
        thisScope = {
          addWatchFile: () => {},
        }
      })

      it.concurrent('should load the app locales', async () => {
        const load = factory({ paths: [appLocalesDir] }).load
        const res = (load as any).call(thisScope, resolvedVirtualModuleId) as string
        const resStore = (await import(esm(res))) as any
        expect(resStore.en.foo.test).toStrictEqual('app foo.test en')
        expect(resStore.en.main.sub.subsub.slugslug).toStrictEqual('app sub.subsub.slugsub en')
        expect(resStore['zh-cn'].foo.test).toStrictEqual('app foo.test zh-cn')
        expect(resStore['zh-cn'].main.sub.subsub.slugslug).toStrictEqual(
          'app sub.subsub.slugsub zh-cn',
        )
      })

      it.concurrent('should merge appLocales over any libraries', async () => {
        const load = factory({
          paths: [path.join(appLocalesDir, '../node_modules/lib/locales'), appLocalesDir],
        }).load
        const res = (load as any).call(thisScope, resolvedVirtualModuleId) as string
        const resStore = await import(esm(res))
        expect(resStore.en.main.sub.test).toStrictEqual('lib sub.test en')
        expect(resStore.en.main.sub.subsub.test).toStrictEqual('lib sub.subsub.test en')
        expect(resStore.en.main.sub.slug).toStrictEqual('app sub.slug en')
        expect(resStore.en.main.sub.subsub.slugslug).toStrictEqual('app sub.subsub.slugsub en')

        expect(resStore['zh-cn'].main.sub.test).toStrictEqual('lib sub.test zh-cn')
        expect(resStore['zh-cn'].main.sub.subsub.test).toStrictEqual('lib sub.subsub.test zh-cn')
        expect(resStore['zh-cn'].main.sub.slug).toStrictEqual('app sub.slug zh-cn')
        expect(resStore['zh-cn'].main.sub.subsub.slugslug).toStrictEqual(
          'app sub.subsub.slugsub zh-cn',
        )
      })
    })
  }
})
