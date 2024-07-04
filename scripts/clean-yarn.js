import { $ } from 'execa'
import { rimraf as r } from 'rimraf'

// TODO: promote this as a script to @alienfast/ci once it is stable

console.log('Cleaning yarn...')

await $`yarn tsc -b --clean`

// packages/*/dist cloud/*/dist .eslintcache ./packages/*/*.log *.log
await Promise.all([
  r('./{packages,cloud}/*/node_modules', { glob: true }),
  r('yarn.lock'),
  r('node_modules'),
  r('.yarn/install-state.gz'),
]).then(() => {
  $`yarn cache clean`
})
