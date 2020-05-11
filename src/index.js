import Plugin from '@/Plugin'
import pg from '@/mixin'
import { AuthError, FetchError, PrimaryKeyError, SchemaNotFoundError } from '@/errors'

// Auto-install when vue is found (eg. in browser via <script> tag)
if (typeof globalThis !== 'undefined' && globalThis.Vue) {
  globalThis.Vue.use(Plugin)
}

export { pg, AuthError, FetchError, PrimaryKeyError, SchemaNotFoundError, Plugin as default }
