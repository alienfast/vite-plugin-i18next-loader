import { defineConfig } from 'tsup'

// this is meant to be executed cwd in the package dir, but shared amongst all via `yarn tsup --config ../../tsup.config.ts`
export default defineConfig({
  entry: ['src/index.ts'],
  sourcemap: true,
  clean: true,
  dts: true,
  format: ['esm'],
  minify: true,
})
