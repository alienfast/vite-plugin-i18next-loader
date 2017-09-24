# @alienfast/i18next-loader

[![CircleCI](https://circleci.com/gh/alienfast/i18next-loader/tree/develop.svg?style=svg&circle-token=9de60bf76b13f269bb560cd89ea253c9c04238ce)](https://circleci.com/gh/alienfast/i18next-loader/tree/develop)
[![npm version](https://badge.fury.io/js/%40alienfast%2Fi18next-loader.svg)](https://badge.fury.io/js/%40alienfast%2Fi18next-loader)

`yarn add @alienfast/i18next-loader`

This webpack loader generates the `resources` structure necessary for **i18next**.  The structure is webpacked wthith the
 client bundle, thus avoiding loading any language resources via extra HTTP requests. 
 
Given a locales directory, by default, the loader will find and parse any `json|yaml|yml` file and attribute the 
contents to the containing lang folder e.g. `en`.  There is no need to add lang such as `en` or `de` inside your 
`json` or `yaml` files.
 
See the `test/data` directory for structure and example data.

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
import resources from '../locales'

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
```json
{include: ['**/*.json']}
```

#### Json but exclude one file
```json
{include: ['**/*.json', '!**/excludeThis.json']}
```

### Inheritance/Override
Applications that reuse libraries, or need white label/branding capability can utilize one to many sets of locales that 
the app will override.  Read the query string as `app` overrides `[../node_modules/lib1, ../node_modules/lib2]`.  

```json
{overrides: ['../node_modules/lib1/locales']}
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

Everthing from `app/locales` will override anything specified in one to many libraries.

## Credit

This was forked from [i18next-resource-store-loader](https://github.com/atroo/i18next-resource-store-loader) because
we changed it in [breaking ways that are incompatible](https://github.com/atroo/i18next-resource-store-loader/issues/14#issuecomment-331726268).  
Thanks to the original authors and contributors.  