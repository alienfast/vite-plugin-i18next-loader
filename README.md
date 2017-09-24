# @alienfast/i18next-loader

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

### Sample i18next config/use

```javascript
// File: app.js
import i18n from 'i18next'
import resources from 'i18next-resource-store-loader!../locales/index.js'

i18n.init({
  resources
});

// Use the resources as documented on i18next.com
i18n.t('key')
```

And you're done! The `index.js` can be empty, it's just needed to point the loader to the root directory of the locales.

## Advanced Usage


### Filtering files
You can filter files in your file structure by specifying any glob supported by [`glob-all`](https://github.com/jpillora/node-glob-all).

By default, any `json|yaml|yml` will be loaded.

#### Only json
```javascript
import resources from "i18next-resource-store-loader?{include: ['**/*.json']}!../locales/index.js"
```

#### Json but exclude one file
```javascript
import resources from "i18next-resource-store-loader?{include: ['**/*.json', '!**/excludeThis.json']}!../locales/index.js"
```

### Inheritance/Override
Applications that reuse libraries, or need white label/branding capability can utilize one to many sets of locales that 
the app will override.  Read the query string as `app` overrides `[../node_modules/lib1, ../node_modules/lib2]`.  

```javascript
import resources from "i18next-resource-store-loader?{overrides: ['../node_modules/lib1/locales']}!../locales/index.js"
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