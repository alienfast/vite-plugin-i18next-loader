import { $ } from 'execa'
import { rimraf as r } from 'rimraf'

// TODO: promote this as a script to @alienfast/ci once it is stable

console.log('Cleaning...')

await $`yarn tsc -b --clean`

// packages/*/dist cloud/*/dist .eslintcache ./packages/*/*.log *.log
await Promise.all([
  r('./{packages,cloud}/*/dist', { glob: true }),
  r('.eslintcache'),
  r('node_modules/.cache'),
  r('./{packages,cloud}/*/*.log', { glob: true }),
  r('*.log', { glob: true }),
  r('./{packages,cloud}/*/test-report.xml', { glob: true }),
  r('test-results'),
  r('test-report.xml'),
])
