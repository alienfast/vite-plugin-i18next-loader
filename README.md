![MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Version](https://img.shields.io/github/package-json/v/alienfast/vite-plugin-i18next-loader?style=for-the-badge)
![CI](https://img.shields.io/github/actions/workflow/status/alienfast/vite-plugin-i18next-loader/release.yml?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge)

# vite-plugin-i18next-loader

`yarn add -D vite-plugin-i18next-loader`

Vite plugin to client bundle i18next locales composited from one to many json/yaml files _from_ one to many libraries. Zero config HMR support included.

This vite-plugin i18next loader generates the `resources` structure necessary for [i18next](https://github.com/i18next/i18next). The structure is made available as a [virtual module](https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention) to the client bundle at build time, thus avoiding loading any language resources via extra HTTP requests.

## Features

- [x] glob based file filtering
- [x] one to many overrides supporting reuse cases (white labeling)
- [x] yaml and json support
- [x] hot module reloading (Basic with full reload works, HMR may be improved with vite 3.2 api - see #5)
- [ ] chunking/tree shaking may already be possible, see #4 - needs more trial/discussion.

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
  ;['**/*.json']
}
```

#### All json except one file

```ts
{
  ;['**/*.json', '!**/excludeThis.json']
}
```

### `paths` for overriding/white labeling

Applications that reuse libraries e.g. white labeling, can utilize one to many sets of locale directories that
the app will override.

```ts
{
  ;['../node_modules/lib1/locales', './locales'] // from least to most specialized
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
  ;('basename')
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
  ;('relativePath')
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

## Output

Note that the [virtual module](https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention) generated has contents that conform to the [i18next resource format](https://www.i18next.com/misc/json-format).

While using the output with `import resources from 'virtual:i18next-loader'` will not be tree-shaken, it is possible to use the named outputs with a dynamic `import` for tree shaking/chunking optimizations. If you take advantage of this, please see #4 and take a moment to update this doc with more information.

**NOTE** as shown by the test output below, due to ES syntactical rules, we cannot use hyphenated lang codes. I'm open to ideas, but in the interim, affected lang codes are exported with the hyphen converted to underscore e.g. `zh-cn` has a named export of `zh_cn`. I noted that vite allows for tree-shaking of JSON files, perhaps that is worth looking at to consider how it might help us and inform our output?

```ts
export const en = {
  foo: { test: 'app foo.test en' },
  main: {
    test: 'app test en',
    sub: {
      slug: 'app sub.slug en',
      test: 'lib sub.test en',
      subsub: { slugslug: 'app sub.subsub.slugsub en', test: 'lib sub.subsub.test en' },
    },
  },
}
export const zh_cn = {
  foo: { test: 'app foo.test zh-cn' },
  main: {
    test: 'app test zh-cn',
    sub: {
      slug: 'app sub.slug zh-cn',
      test: 'lib sub.test zh-cn',
      subsub: { slugslug: 'app sub.subsub.slugsub zh-cn', test: 'lib sub.subsub.test zh-cn' },
    },
  },
}
const resources = {
  en,
  'zh-cn': zh_cn,
}
export default resources
```

## Vite typescript definitions

In order for the vite [virtual module](https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention) to be typechecked, you will need to a declaration. Below is an example of a common type file included in a project for vite:

```ts
// https://vitejs.dev/guide/api-hmr.html
interface ViteHotContext {
  readonly data: any

  // accept(): void
  accept(cb?: (mod: ModuleNamespace | undefined) => void): void
  accept(dep: string, cb: (mod: ModuleNamespace | undefined) => void): void
  accept(deps: readonly string[], cb: (mods: Array<ModuleNamespace | undefined>) => void): void

  dispose(cb: (data: any) => void): void
  decline(): void
  invalidate(): void

  // `InferCustomEventPayload` provides types for built-in Vite events
  on<T extends string>(event: T, cb: (payload: InferCustomEventPayload<T>) => void): void
  send<T extends string>(event: T, data?: InferCustomEventPayload<T>): void
}

// Allow for virtual module imports
// https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention
declare module 'virtual:*'
```

## Credit

This was forked from [@alienfast/i18next-loader](https://github.com/alienfast/i18next-loader/), converted to be a vite plugin and improved. Thanks to the original authors and contributors.
