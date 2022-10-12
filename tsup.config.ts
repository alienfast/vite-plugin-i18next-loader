import { defineConfig } from 'tsup'

// this is meant to be executed cwd in the package dir, but shared amongst all via `yarn tsup --config ../../tsup.config.ts`
export default defineConfig({
  entry: ['src/index.ts'],
  sourcemap: true,
  clean: true,
  // dts: true, // bug with project references https://github.com/egoist/tsup/issues/647#issuecomment-1268777707
  format: ['esm'],
  minify: true,
})
