import js from '@eslint/js';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores([
    '.next/**',
    'dist/**',
    'out/**',
    'android/**',
    'ios/**',
    'public/**',
    'node_modules/**',
  ]),
  {
    files: [
      'middleware.js',
      'app/**/*.{js,jsx}',
      'src/**/*.{js,jsx}',
      'tests/**/*.{js,jsx}',
    ],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-useless-escape': 'warn',
      'no-useless-assignment': 'warn',
      'no-extra-boolean-cast': 'warn',
    },
  },
]);
