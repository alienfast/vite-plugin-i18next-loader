const path = require('node:path')
const chai = require('chai')

const assert = chai.assert
const loader = require('../index')

describe('namespaceResolverBasename', () => {
  ;['yaml', 'json'].forEach((type) => {
    context(type, () => {
      let thisScope
      beforeEach(function (done) {
        //mock webpack loader this scope
        const emptFn = () => {}
        thisScope = {
          addDependency: emptFn,
          addContextDependency: emptFn,
          cacheable: emptFn,
          resource: path.join(__dirname, `./data/basic-app-${type}/locales/index.js`),
          query: {
            basenameAsNamespace: true,
          },
        }
        done()
      })

      function assertCommon(resStore) {
        expect(resStore.dev.main.main.test).toStrictEqual('Dev dev dev!')
        expect(resStore.de.main.main.test).toStrictEqual('Das ist ein Test!')
        expect(resStore.en.main.main.test).toStrictEqual('This is a test!')
        expect(resStore.fr.main.main.test).toStrictEqual('Ceci est un test!')
      }

      it('should generate the structure', () => {
        const res = loader.call(thisScope, resolvedVirtualModuleId)
        const resStore = eval(res)
        assertCommon(resStore)
      })
    })
  })
})
