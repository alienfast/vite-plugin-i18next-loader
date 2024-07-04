import af from '@alienfast/eslint-config'
import tseslint from 'typescript-eslint'

/**
 * Project eslint configuration.
 *
 * View config with `npx @eslint/config-inspector`
 */
export default tseslint.config({
  name: 'project',
  extends: [...af.configs.recommended],
})
