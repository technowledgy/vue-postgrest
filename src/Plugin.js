import Postgrest from './Postgrest'
import Schema, { setDefaultRoot } from './Schema'

export default {
  install (Vue, options = {}) {
    Vue.component('postgrest', Postgrest)
    Object.defineProperty(Vue.prototype, '$postgrest', {
      get () {
        return new Schema()
      }
    })
    setDefaultRoot(options.apiRoot)
  }
}
