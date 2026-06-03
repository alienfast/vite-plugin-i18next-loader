import { $ } from 'execa'
import { rimraf as r } from 'rimraf'

// TODO: promote this as a script to @alienfast/ci once it is stable

console.log('Cleaning pnpm...')

await Promise.all([r('node_modules'), r('pnpm-lock.yaml')]).then(async () => {
  await $`pnpm store prune`
})
