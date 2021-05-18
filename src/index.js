import Plugin from '@/Plugin'
import { setDefaultToken } from '@/Schema'
import pg from '@/mixin'
import { AuthError, FetchError, PrimaryKeyError, SchemaNotFoundError } from '@/errors'
import usePostgrest from '@/use'

// Auto-install when vue is found (eg. in browser via <script> tag)
if (typeof globalThis !== 'undefined' && globalThis.Vue) {
  globalThis.Vue.use(Plugin)
}

export { pg, AuthError, FetchError, PrimaryKeyError, SchemaNotFoundError, setDefaultToken, usePostgrest, Plugin as default }
