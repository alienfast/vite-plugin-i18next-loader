# @alienfast/i18next-loader

[![CircleCI](https://circleci.com/gh/alienfast/i18next-loader/tree/develop.svg?style=svg&circle-token=9de60bf76b13f269bb560cd89ea253c9c04238ce)](https://circleci.com/gh/alienfast/i18next-loader/tree/develop)
[![npm version](https://badge.fury.io/js/%40alienfast%2Fi18next-loader.svg)](https://badge.fury.io/js/%40alienfast%2Fi18next-loader)

`yarn add -D @alienfast/i18next-loader`

This webpack loader generates the `resources` structure necessary for [i18next](https://github.com/i18next/i18next).  The structure is webpacked with the client bundle at build time, thus avoiding loading any language resources via extra HTTP requests.

## Features

- [x] glob based file filtering
- [x] one to many overrides supporting reuse cases (white labeling)
- [x] yaml and json support 
- [ ] locale chunking (help wanted - see [#6](https://github.com/alienfast/i18next-loader/issues/6))
 
Given a locales directory, by default, the loader will find and parse any `json|yaml|yml` file and attribute the 
contents to the containing lang folder e.g. `en`.  There is no need to add lang such as `en` or `de` inside your 
`json` or `yaml` files.
 
See the [`test/data` directory](https://github.com/alienfast/i18next-loader/tree/develop/test/data) for structure and example data.

## Usage

### Sample app structure

```
└── app
    └── src
    │  └── app.js
    └── locales
       ├── index.js
       ├── de
       │   ├── foo.json
       │   └── bar.yaml
       └── en
           ├── foo.json
           └── bar.yaml
```

### Option 1: use with webpack.config.js (recommended)

```javascript
module.exports = {
  // ... snip
  module: {
    rules: [
      {
        test: /locales/,
        loader: '@alienfast/i18next-loader',
        // options here
        //query: { overrides: [ '../node_modules/lib/locales' ] }
      }
    ]
  }
  // ... snip
}
```

```javascript
// File: app.js
import i18n from 'i18next'
import resources from '../locales'  // typescript: import * as resources from '../locales'

i18n.init({
  resources
});

// Use the resources as documented on i18next.com
i18n.t('key')
```

### Option 2: use with import syntax

```javascript
// File: app.js
import i18n from 'i18next'
import resources from '@alienfast/i18next-loader!../locales/index.js'

i18n.init({
  resources
});

// Use the resources as documented on i18next.com
i18n.t('key')
```

And you're done! The `index.js` can be empty, it's just needed to point the loader to the root directory of the locales.

## Advanced Usage

Options are set via the loader `query`. See webpack documentation for more details regarding how this mechanism works.
The following examples assume you understand these values are used as the `query` value.  

### Filtering files
You can filter files in your file structure by specifying any glob supported by [`glob-all`](https://github.com/jpillora/node-glob-all).

By default, any `json|yaml|yml` will be loaded.

#### Only json
```javascript
{include: ['**/*.json']}
```

#### All json except one file
```javascript
{include: ['**/*.json', '!**/excludeThis.json']}
```

### Overriding/White labeling
Applications that reuse libraries e.g. white labeling, can utilize one to many sets of locale directories that 
the app will override.  

```javascript
{overrides: ['../node_modules/lib1/locales']} // relative or absolute paths
```
This configures the loader to work on a file structure like the following:

```
└── app
    ├── src
    │  └── app.js
    ├── locales
    │  ├── index.js
    │  └── en
    │      ├── foo.json
    │      └── bar.yaml
    └── node_modules
        └── lib1
            └── locales
               ├── index.js
               └── en
                   ├── foo.json
                   └── bar.yaml
```

Everything from `app/locales` will override anything specified in one to many libraries.

#### Use file basename as the i18next namespace
```javascript
{basenameAsNamespace: true}
```

The following file structure would result in resources loaded as below:
```
└── app
    ├── src
    │  └── app.js
    └── locales
       ├── index.js
       └── en
           ├── foo.json
           └── bar.yaml
```
foo.json
```
{
  "header": {
    "title": "TITLE"
  }
}
```
bar.yaml
```
footer:
  aboutUs: About us
```
Results in this object loaded:
```
"en": {
  "foo": {
    "header": {
      "title":"TITLE"
    }
  },
  "bar": {
    "footer":{ 
      "aboutUs":"About us"
    }
  }
}
```

#### Use relative path as the i18next namespace
```javascript
{relativePathAsNamespace: true}
```

The following file structure would result in resources loaded as below:
```
└── app
    └── locales
       ├── index.js
       └── en
           ├── green.yaml
           ├── blue
           ├──── foo.yaml
```
green.yaml
```
tree:
  species: Oak
```
blue/foo.yaml
```
water:
  ocean: Quite large
```
Results in this object loaded:
```
"en": {
  "green": {
    "tree": {
      "species":"Oak"
    }
  },
  "blue": {
    "foo":{ 
      "water": {
        "ocean": "Quite large"
      }
    }
  }
}
```
**NOTE:** If you have a file and a folder with the same name, you MIGHT overwrite one with the other. For example:
```
└── app
    └── locales
       ├── index.js
       └── en
           ├── blue.yaml
           ├── blue
           ├──── foo.yaml
```
blue.yaml
```
foo: Welcome
```
blue/foo.yaml
```
eggs: delicious
```
Results in this object loaded:
```
"en": {
  "blue": {
    "foo": {
      "eggs": "delicious"
    }
  }
}
```
But it's just overwriting based on the return value of `glob-all`, so you shouldn't depend on it.


## Credit

This was forked from [i18next-resource-store-loader](https://github.com/atroo/i18next-resource-store-loader) because
we changed it in [breaking ways that are incompatible](https://github.com/atroo/i18next-resource-store-loader/issues/14#issuecomment-331726268).  
Thanks to the original authors and contributors.  
