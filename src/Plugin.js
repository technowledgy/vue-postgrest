import Postgrest from './Postgrest'
import { setDefaultRoot } from './Schema'
import { setDefaultHeaders } from './request'
import usePostgrest from './use'
import { postgrestInjectionKey } from './injection'

export default {
  install (app, options = {}) {
    app.config.optionMergeStrategies.onError = (to, from) => [...new Set([].concat(to ?? [], from))]
    app.component('postgrest', Postgrest)
    app.provide(postgrestInjectionKey, usePostgrest)
    Object.defineProperty(app.config.globalProperties, '$postgrest', {
      get: usePostgrest
    })
    setDefaultRoot(options.apiRoot)
    setDefaultHeaders(options.headers)
  }
}
