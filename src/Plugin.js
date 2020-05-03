import Postgrest from './Postgrest'
import Schema from './Schema'

export default {
  install (Vue, options = {}) {
    Vue.component('postgrest', Postgrest)
    Vue.prototype.$postgrest = new Schema(options.apiRoot ?? '/')
  }
}
