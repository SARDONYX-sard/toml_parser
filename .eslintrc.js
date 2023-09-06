/** @type {import('eslint/lib/shares/types').ConfigData} */
module.exports = {
  // *.js settings
  env: {
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2023,
  },
  plugins: ['jest'],
  extends: ['eslint:recommended', 'plugin:jest/recommended', 'plugin:prettier/recommended', 'prettier'],
  rules: {
    indent: ['error', 2, { SwitchCase: 1 }],
    'max-len': [
      'error',
      {
        code: 120,
        ignoreComments: true,
        ignoreUrls: true,
        ignoreStrings: true,
      },
    ],
  },
  ignorePatterns: ['node_modules/**'],

  // *.ts settings
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      env: {
        browser: true,
      },
      extends: ['plugin:prettier/recommended', 'plugin:@typescript-eslint/recommended'],
      plugins: ['@typescript-eslint'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module',
      },
    },
  ],
};
