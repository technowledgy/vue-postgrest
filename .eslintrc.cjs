module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    '@vue/standard',
    'plugin:vue/essential'
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'vue/multi-word-component-names': 'off'
  },
  parserOptions: {
    parser: '@babel/eslint-parser'
  },
  overrides: [
    {
      files: [
        '**/tests/**/*.js'
      ],
      env: {
        jest: true
      }
    }
  ],
  globals: {
    globalThis: false
  }
}
