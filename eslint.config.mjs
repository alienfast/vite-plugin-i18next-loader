import af from '@alienfast/eslint-config'
import { defineConfig } from 'eslint/config'

/**
 * Project eslint configuration.
 *
 * View config with `npx @eslint/config-inspector`
 */
export default defineConfig([af.configs.recommended])
