import type { Plugin } from 'vite'

export interface ThisScope {
  addWatchFile: (id: string) => void
}

// export type LoadFn = Required<Plugin>['load']
/**
 * type UserWithName = WithRequired<User, 'name'>
 *
 * @see https://stackoverflow.com/a/69328045/2363935
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

export type LoaderPlugin = WithRequired<Plugin, 'load'>

// export type LoadFn = ObjectHook<
//   (
//     this: PluginContext,
//     id: string,
//     options?: {
//       ssr?: boolean
//     },
//   ) => Promise<LoadResult> | LoadResult
// >

// export function esm(templateStrings: TemplateStringsArray, ...substitutions: string[]) {
//   let js = templateStrings.raw[0]
//   for (let i = 0; i < substitutions.length; i++) {
//     js += substitutions[i] + templateStrings.raw[i + 1]
//   }
//   return 'data:text/javascript;base64,' + btoa(js)
// }

export function esm(js: string) {
  return `data:text/javascript;base64,${btoa(js)}`
}
