import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  dts: { sourcemap: true },
  entry: ['src/index.ts'],
  // emit .js/.d.ts (this is a "type": "module" package) rather than tsdown's
  // node default of .mjs/.d.mts, preserving the published exports contract
  fixedExtension: false,
  format: ['esm'],
  minify: true,
  sourcemap: true,
})
