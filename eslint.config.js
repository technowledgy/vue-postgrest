import { FlatCompat } from '@eslint/eslintrc'
import globals from 'globals'
import parser from '@babel/eslint-parser'
import vue from 'eslint-plugin-vue'

const compat = new FlatCompat()

export default [
  {
    ignores: [
      'coverage/**',
      'dist/**',
      'docs/**',
      'package.json.cjs'
    ]
  },
  ...compat.extends('@vue/standard'),
  ...vue.configs['flat/vue2-essential'],
  {
    files: ['**/*.js', '**/*.vue'],
    languageOptions: {
      parser
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'vue/multi-word-component-names': 'off'
    }
  },
  {
    files: ['**/*.spec.js'],
    languageOptions: {
      globals: globals.jest
    }
  }
]
