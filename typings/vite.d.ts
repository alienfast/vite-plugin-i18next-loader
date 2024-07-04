/// <reference types="vite/client" />

type Booly = 'true' | 'false'

// https://vitejs.dev/guide/env-and-mode.html
interface ImportMetaEnv {
  readonly APP_VERSION: string
  readonly CI: Booly
  readonly GOOGLE_ANALYTICS_KEY: string
  readonly INTEGRATION_TEST: Booly // set to reduce durations for faster ui testing
  readonly INTERCOM_APP_ID: string
  readonly SENTRY_DSN: string
  readonly STORYBOOK: Booly
  readonly STRIPE_PUBLISHABLE_KEY: string
  // NOTE that any new env vars must be added to vite.config.lib.ts for downstream retention/replacement
  //  otherwise they will be removed by the build process.
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  readonly hot?: ViteHotContext
}

type ModuleNamespace = Record<string, any> & {
  [Symbol.toStringTag]: 'Module'
}

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
