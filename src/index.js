import Postgrest from './Postgrest'
import rfdc from 'rfdc'
const clone = rfdc()

const plugin = {
  install (Vue, options) {
    if (options && options.apiRoot) {
      const customPostgrest = clone(Postgrest)
      customPostgrest.props.apiRoot.default = options.apiRoot
      Vue.component('postgrest', customPostgrest)
    } else {
      Vue.component('postgrest', Postgrest)
    }
  }
}

// Auto-install when vue is found (eg. in browser via <script> tag)
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(plugin)
}

export default plugin
