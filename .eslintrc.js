module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-case-declarations': 'off',
    'prefer-const': 'warn',
  },
  ignorePatterns: [
    'dist',
    '.next',
    'node_modules',
    '.turbo',
    'coverage',
    '*.config.js',
    '*.config.mjs',
  ],
};
