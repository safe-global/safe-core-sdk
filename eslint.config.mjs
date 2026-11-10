import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

export default defineConfig([
  globalIgnores(['**/dist/**', '**/node_modules/**']),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2020, sourceType: 'module' },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      // types-kit's *_AbiTypes constants exist only for `typeof`; see PLA-2238 follow-up.
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '_AbiTypes$' }]
    }
  },
  {
    // chai property assertions (expect(x).to.be.true) are expression statements by design.
    files: ['packages/*/tests/**'],
    rules: { '@typescript-eslint/no-unused-expressions': 'off' }
  },
  eslintPluginPrettierRecommended // keep last so it disables conflicting formatting rules
])
