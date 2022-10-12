import { Plugin } from 'vite'

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
