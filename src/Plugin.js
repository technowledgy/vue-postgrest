import Postgrest from './Postgrest'
import { setDefaultRoot } from './Schema'
import usePostgrest from './use'

export default {
  install (Vue, options = {}) {
    // use the mergeHook strategy for onError that is also used for vue lifecycle hooks
    Vue.config.optionMergeStrategies.onError = Vue.config.optionMergeStrategies.created
    Vue.component('postgrest', Postgrest)
    Object.defineProperty(Vue.prototype, '$postgrest', {
      get () {
        return usePostgrest()
      }
    })
    setDefaultRoot(options.apiRoot)
  }
}
