import { beforeEach, describe, it } from 'vitest'

describe('pathOverride', () => {
  for (const type of ['yaml', 'json']) {
    describe(type, () => {
      beforeEach(function (done) {
        //mock webpack loader this scope
        const emptFn = () => {}
        thisScope = {
          addDependency: emptFn,
          addContextDependency: emptFn,
          cacheable: emptFn,
          resource: path.join(__dirname, `./data/override-app-${type}/locales/index.js`),
        }
        done()
      })

      it('should simply be the the app locales', () => {
        const res = loader.call(thisScope, resolvedVirtualModuleId)
        const resStore = eval(res)
        expect(resStore.en.foo.test).toStrictEqual('app foo.test en')
        expect(resStore.en.main.sub.subsub.slugslug).toStrictEqual('app sub.subsub.slugsub en')
        expect(resStore['zh-cn'].foo.test).toStrictEqual('app foo.test zh-cn')
        assert.strictEqual(
          resStore['zh-cn'].main.sub.subsub.slugslug,
          'app sub.subsub.slugsub zh-cn',
        )
      })

      it('should merge app over any libraries', () => {
        thisScope.query = '?{overrides: ["../node_modules/lib/locales"]}'
        const res = loader.call(thisScope, resolvedVirtualModuleId)
        const resStore = eval(res)
        expect(resStore.en.main.sub.test).toStrictEqual('lib sub.test en')
        expect(resStore.en.main.sub.subsub.test).toStrictEqual('lib sub.subsub.test en')
        expect(resStore.en.main.sub.slug).toStrictEqual('app sub.slug en')
        expect(resStore.en.main.sub.subsub.slugslug).toStrictEqual('app sub.subsub.slugsub en')

        expect(resStore['zh-cn'].main.sub.test).toStrictEqual('lib sub.test zh-cn')
        expect(resStore['zh-cn'].main.sub.subsub.test).toStrictEqual('lib sub.subsub.test zh-cn')
        expect(resStore['zh-cn'].main.sub.slug).toStrictEqual('app sub.slug zh-cn')
        assert.strictEqual(
          resStore['zh-cn'].main.sub.subsub.slugslug,
          'app sub.subsub.slugsub zh-cn',
        )
      })
    })
  }
})
