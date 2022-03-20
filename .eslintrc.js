module.exports = {
  root: true,
  env: {
    node: false
  },
  parserOptions: {
    ecmaVersion: 2021
  },
  rules: {
    'no-console': 'warn',
    'no-debugger': 'warn',
    'no-unused-vars': [
      'warn',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_'
      }
    ],
    semi: [
      'warn',
      'never',
      {
        beforeStatementContinuationChars: 'any'
      }
    ],
    'quote-props': ['warn', 'as-needed'],
    indent: ['warn', 2],
    'space-before-function-paren': ['warn', 'always'],
    'space-before-blocks': ['warn', 'always'],
    'space-infix-ops': 'warn',
    'key-spacing': [
      'warn',
      {
        beforeColon: false,
        afterColon: true,
        mode: 'strict'
      }
    ],
    'comma-spacing': [
      'warn',
      {
        before: false,
        after: true
      }
    ],
    'arrow-spacing': [
      'warn',
      {
        before: true,
        after: true
      }
    ],
    'eol-last': ['warn', 'always']
  }
}
