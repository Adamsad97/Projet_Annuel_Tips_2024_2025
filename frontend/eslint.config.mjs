// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default withNuxt(prettierConfig, {
  plugins: {
    prettier,
  },
  rules: {
    // Prettier
    'prettier/prettier': 'error',

    // Vue
    'vue/multi-word-component-names': 'off',
    'vue/no-multiple-template-root': 'off',
    'vue/require-default-prop': 'warn',
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],

    // TypeScript
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',

    // Console
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

    // Best practices
    'prefer-const': 'error',
    'no-var': 'error',
  },
});
