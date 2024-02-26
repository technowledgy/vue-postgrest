import Postgrest from './Postgrest'
import { setDefaultRoot } from './Schema'
import { setDefaultHeaders } from './request'
import usePostgrest from './use'

export default {
  install (Vue, options = {}) {
    // use the mergeHook strategy for onError that is also used for vue lifecycle hooks
    Vue.config.optionMergeStrategies.onError = Vue.config.optionMergeStrategies.created
    Vue.component('postgrest', Postgrest)
    Object.defineProperty(Vue.prototype, '$postgrest', {
      get: usePostgrest
    })
    setDefaultRoot(options.apiRoot)
    setDefaultHeaders(options.headers)
  }
}
