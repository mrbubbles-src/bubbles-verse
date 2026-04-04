import { nextJsConfig } from '@bubbles/eslint-config/next-js';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';

export default [
  ...nextJsConfig,
  {
    ignores: ['next-env.d.ts'],
  },
  {
    plugins: {
      'jsx-a11y': jsxA11yPlugin,
    },
    rules: {
      ...jsxA11yPlugin.configs.recommended.rules,
    },
  },
];
