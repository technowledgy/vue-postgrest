import Postgrest from './Postgrest'
import Schema, { setDefaultRoot } from './Schema'

export default {
  install (Vue, options = {}) {
    // use mergeHook strategy for onError, that is also used for vue lifecycle hooks
    Vue.config.optionMergeStrategies.onError = Vue.config.optionMergeStrategies.created
    Vue.component('postgrest', Postgrest)
    Object.defineProperty(Vue.prototype, '$postgrest', {
      get () {
        return new Schema()
      }
    })
    setDefaultRoot(options.apiRoot)
  }
}
