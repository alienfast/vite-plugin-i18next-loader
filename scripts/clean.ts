import { rimraf as r } from 'rimraf'

// TODO: promote this as a script to @alienfast/ci once it is stable

console.log('Cleaning...')

await Promise.all([
  r('dist'),
  r('node_modules/.cache'),
  r('node_modules/.vite-temp'),
  r('*.log', { glob: true }),
  r('*.tsbuildinfo', { glob: true }),
  r('test-results'),
  r('test-report.xml'),
])
