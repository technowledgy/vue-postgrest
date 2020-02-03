import Postgrest from './Postgrest'

// eslint-disable-next-line
console.log('hello')

const plugin = {
  install (Vue, options) {
    Vue.component('postgrest', Postgrest)
  }
}

// Auto-install when vue is found (eg. in browser via <script> tag)
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(plugin)
}

export default plugin
