import Postgrest from './Postgrest'

const plugin = {
  install (Vue, options = {}) {
    if (options.apiRoot) {
      Postgrest.props.apiRoot.default = options.apiRoot
    }
    Vue.component('postgrest', Postgrest)
  }
}

// Auto-install when vue is found (eg. in browser via <script> tag)
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(plugin)
}

export default plugin
