import js from '@eslint/js';
import globals from 'globals';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['node_modules/**', 'business-plan/**', 'coverage/**', 'dist/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-process-exit': 'off',
      'prefer-const': 'warn',
      'no-var': 'error',
      eqeqeq: ['warn', 'smart'],
      // Single quotes + all other formatting is enforced by Prettier (.prettierrc.json)
      'prettier/prettier': 'warn',
    },
  },
  prettierConfig,
];
