const path = require('path')
const fs = require('fs')
const merge = require('lodash/merge')
const globAll = require('glob-all')
const loaderUtils = require('loader-utils')
const yaml = require('js-yaml')

function enumerateLangs (dir) {
  return fs.readdirSync(dir).filter(function (file) {
    return fs.statSync(path.join(dir, file)).isDirectory()
  })
}

//https://github.com/jpillora/node-glob-all#usage
function findAll (globs, cwd) {
  const globArray = (Array.isArray(globs) ? globs : [ globs ])
  return globAll.sync(globArray, { cwd, realpath: true })
}

module.exports = function () {
  this.cacheable && this.cacheable()
  const options = loaderUtils.getOptions(this) || {}

  if (!options.include) {
    options.include = [ '**/*.json', '**/*.yml', '**/*.yaml' ]
  }

  if(!options.overrides) options.overrides = []
  const appLocalesDir = path.dirname(this.resource) // this is the absolute path to the index.js in the top level locales dir
  let appResBundle = {}

  // needs to be ordered in least specialized to most e.g. lib locale -> app locale
  const moduleLocalesDirs = options.overrides.map(override => path.join(appLocalesDir, override))
  moduleLocalesDirs.push(appLocalesDir)
  moduleLocalesDirs.forEach((localesDir) => {
    // all subdirectories match language codes
    const langs = enumerateLangs(localesDir)
    for (let i = 0; i < langs.length; i++) {
      const lang = langs[ i ]
      const resBundle = {}
      resBundle[ lang ] = {}

      const fullLangPath = path.join(localesDir, lang)
      this.addContextDependency(fullLangPath)

      const langFiles = findAll(options.include, fullLangPath)
      for (let j = 0; j < langFiles.length; j++) {
        const fullPath = langFiles[ j ]
        this.addDependency(fullPath)

        const fileContent = fs.readFileSync(fullPath)
        const extname = path.extname(fullPath)
        let nameSpaceName = path.basename(fullPath, extname);
        let parsedContent;
        if (extname === ".yaml" || extname === ".yml") {
          parsedContent = yaml.safeLoad(fileContent);
        } else {
          parsedContent = JSON.parse(fileContent);
        }
        if (options.basenameAsNamespace) {
          const ns = resBundle[lang] || {};
          ns[nameSpaceName] = parsedContent;
          resBundle[lang] = ns;
        } else {
          resBundle[lang] = parsedContent;
        }
        appResBundle = merge(appResBundle, resBundle)
      }
    }
  })
  return 'module.exports = ' + JSON.stringify(appResBundle)
}
