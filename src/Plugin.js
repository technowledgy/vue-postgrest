import Postgrest from './Postgrest'
import Schema from './Schema'

export default {
  install (Vue, options = {}) {
    if (options.apiRoot) {
      Postgrest.props.apiRoot.default = options.apiRoot
    }
    Vue.component('postgrest', Postgrest)

    Vue.prototype.$postgrest = new Schema(options.apiRoot || '')
  }
}
