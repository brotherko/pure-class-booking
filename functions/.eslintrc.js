module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['airbnb',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'],
  settings: {
    'import/extensions': ['.js',
      '.jsx',
      '.ts',
      '.tsx'],
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts',
        '.tsx'],
    },
    'import/resolver': {
      node: {
        extensions: ['.js',
          '.jsx',
          '.ts',
          '.tsx'],
      },
    },
  },
  rules: {
    'no-restricted-syntax': 0,
    'no-await-in-loop': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    'import/prefer-default-export': 0,
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        mjs: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
  },
};
