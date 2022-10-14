# vite-plugin-i18next-loader

[![npm version](https://badge.fury.io/js/vite-plugin-i18next-loader.svg)](https://badge.fury.io/js/vite-plugin-i18next-loader)

`yarn add -D vite-plugin-i18next-loader`

Vite plugin to client bundle i18next locales composited from one to many json/yaml files _from_ one to many libraries.

This vite-plugin i18next loader generates the `resources` structure necessary for [i18next](https://github.com/i18next/i18next). The structure is made available as a [virtual module](https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention) to the client bundle at build time, thus avoiding loading any language resources via extra HTTP requests.

## Features

- [x] glob based file filtering
- [x] one to many overrides supporting reuse cases (white labeling)
- [x] yaml and json support
- [x] hot module reloading (Basic with full reload works, HMR may be improved with vite 3.2 api - see #5)

Given a locales directory, by default, the loader will find and parse any `json|yaml|yml` file and attribute the
contents to the containing lang folder e.g. `en`. There is no need to add lang such as `en` or `de` inside your
`json` or `yaml` files.

See the [`test/data` directory](https://github.com/alienfast/vite-plugin-i18next-loader/tree/develop/test/data) for structure and example data.

## Usage

### Sample app structure

```
└── app
    └── src
    │  └── index.js
    └── locales
       ├── de
       │   ├── foo.json
       │   └── bar.yaml
       └── en
           ├── foo.json
           └── bar.yaml
```

### vite.config.ts

```ts
import { defineConfig } from 'vite'
import i18nextLoader from 'vite-plugin-i18next-loader'

export default defineConfig({
  plugins: [i18nextLoader({ paths: ['./node_modules/foo/locales', './locales'] })],
})
```

### app.ts

```typescript
// File: app.ts
import i18n from 'i18next'
import resources from 'virtual:i18next-loader'

i18n.init({
  resources,
})

// Use the resources as documented on i18next.com
i18n.t('key')
```

## Options

```ts
export interface Options {
  /**
   * Set to 'info' for noisy information.
   *
   * Default: 'warn'
   */
  logLevel?: LogLevel

  /**
   * Glob patterns to match files
   *
   * Default: ['**\/*.json', '**\/*.yml', '**\/*.yaml']
   */
  include?: string[]

  /**
   * Locale top level directory paths ordered from least specialized to most specialized
   *  e.g. lib locale -> app locale
   *
   * Locales loaded later will overwrite any duplicated key via a deep merge strategy.
   */
  paths: string[]

  /**
   * Default: none
   */
  namespaceResolution?: 'basename' | 'relativePath'
}
```

### `include` to filtering files read

You can filter files in your file structure by specifying any glob supported by [`glob-all`](https://github.com/jpillora/node-glob-all). By default, any `json|yaml|yml` in the `paths` directories will be loaded.

#### Only json

```ts
{
  include: ['**/*.json']
}
```

#### All json except one file

```ts
{
  include: ['**/*.json', '!**/excludeThis.json']
}
```

### `paths` for overriding/white labeling

Applications that reuse libraries e.g. white labeling, can utilize one to many sets of locale directories that
the app will override.

```ts
{
  paths: ['../node_modules/lib1/locales', './locales'] // from least to most specialized
}
```

This configures the loader to work on a file structure like the following:

```
└── app
    ├── src
    │  └── app.js
    ├── locales
    │  └── en
    │      ├── foo.json
    │      └── bar.yaml
    └── node_modules
        └── lib1
            └── locales
               └── en
                   ├── foo.json
                   └── bar.yaml
```

Everything from `./locales` will override anything specified in one to many libraries.

### `namespaceResolution`

Namespace resolution will impact the structure of the bundle. If you want the files' `basename` or relative path to be injected, look at the following options.

#### `namespaceResolution: 'basename'`

```ts
{
  namespaceResolution: 'basename'
}
```

The following file structure would result in resources loaded as below:

```
└── app
    ├── src
    │  └── index.js
    └── locales
       └── en
           ├── foo.json
           └── bar.yaml
```

foo.json

```json
{
  "header": {
    "title": "TITLE"
  }
}
```

bar.yaml

```yml
footer:
  aboutUs: About us
```

Results in this object loaded:

```json
{
  "en": {
    "foo": {
      "header": {
        "title": "TITLE"
      }
    },
    "bar": {
      "footer": {
        "aboutUs": "About us"
      }
    }
  }
}
```

#### `namespaceResolution: 'relativePath'`

```ts
{
  namespaceResolution: 'relativePath'
}
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

```yml
tree:
  species: Oak
```

blue/foo.yaml

```yml
water:
  ocean: Quite large
```

Results in this object loaded:

```json
{
  "en": {
    "green": {
      "tree": {
        "species": "Oak"
      }
    },
    "blue": {
      "foo": {
        "water": {
          "ocean": "Quite large"
        }
      }
    }
  }
}
```

**NOTE:** If you have a file and a folder with the same name, you **MIGHT** overwrite one with the other. For example:

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

```yml
foo: Welcome
```

blue/foo.yaml

```yml
eggs: delicious
```

Results in this object loaded:

```json
{
  "en": {
    "blue": {
      "foo": {
        "eggs": "delicious"
      }
    }
  }
}
```

But it's just overwriting based on the return value of `glob-all`, so you shouldn't depend on it.

## Credit

This was forked from [@alienfast/i18next-loader](https://github.com/alienfast/i18next-loader/), converted to be a vite plugin and improved. Thanks to the original authors and contributors.
