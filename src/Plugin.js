import Postgrest from './Postgrest'
import { setDefaultRoot } from './Schema'
import { setDefaultHeaders } from './request'
import usePostgrest from './use'

export default {
  install (app, options = {}) {
    app.config.optionMergeStrategies.onError = (to, from) => [...new Set([].concat(to ?? [], from))]
    app.component('postgrest', Postgrest)
    Object.defineProperty(app.config.globalProperties, '$postgrest', {
      get: usePostgrest
    })
    setDefaultRoot(options.apiRoot)
    setDefaultHeaders(options.headers)
  }
}
