import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { $ } from 'execa'

const $$ = $({ stdio: 'inherit' })
// TODO: promote this as a script to @alienfast/ci once it is stable

console.log('Resetting...')

const dir = path.dirname(fileURLToPath(import.meta.url))

await Promise.all([$$`tsx ${dir}/clean.ts`, $$`tsx ${dir}/clean-pnpm.ts`])

console.log('Installing...')
await $$`pnpm install`
