const path = require('path')
const chai = require('chai')
const assert = chai.assert
const loader = require('../index')

describe('relativepath', function () {
  [ 'yaml', 'json' ].forEach((type) => {
    context(type, () => {
      let thisScope;
      beforeEach(function (done) {
        //mock webpack loader this scope
        const emptFn = function () {}
        thisScope = {
          addDependency: emptFn,
          addContextDependency: emptFn,
          cacheable: emptFn,
          resource: path.join(__dirname, `./data/relativePathAsNamespace-${type}/locales/index.js`),
          query: {
            relativePathAsNamespace: true
          }
        }
        done()
      })

      function assertCommon (resStore) {
        assert.strictEqual(resStore.dev.main.main.main.test, 'Dev dev dev!')
        assert.strictEqual(resStore.de.main.main.main.test, 'Das ist ein Test!')
        assert.strictEqual(resStore.en.main.main.main.test, 'This is a test!')
        assert.strictEqual(resStore.fr.main.main.main.test, 'Ceci est un test!')
      }

      it('should generate the structure', function () {
        const res = loader.call(thisScope, 'index.js')
        const resStore = eval(res)
        assertCommon(resStore)
      })
    })
  })
})