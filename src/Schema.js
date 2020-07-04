import Route from '@/Route'
import RPC from '@/RPC'
import request from '@/request'
import { throwWhenStatusNotOk, SchemaNotFoundError } from '@/errors'
import ObservableFunction from '@/ObservableFunction'

let schemaCache = {}

// just for test env
export function resetSchemaCache () {
  schemaCache = {}
}

let defaultApiRoot = '/'
let defaultToken

export function setDefaultRoot (apiRoot = defaultApiRoot) {
  defaultApiRoot = apiRoot
}

export function setDefaultToken (token) {
  defaultToken = token
}

export default class Schema extends Function {
  #apiRoot
  #token

  constructor (apiRoot = defaultApiRoot, token = defaultToken) {
    super('', 'return arguments.callee._call.apply(arguments.callee, arguments)')
    const cached = schemaCache[apiRoot] && schemaCache[apiRoot][token]
    if (cached) return cached
    // create new Instance
    this.#apiRoot = apiRoot
    this.#token = token
    if (!schemaCache[apiRoot]) {
      schemaCache[apiRoot] = {}
    }
    schemaCache[apiRoot][token] = this
    // eslint-disable-next-line no-async-promise-executor
    const ready = new Promise(async (resolve, reject) => {
      try {
        const schema = await this._fetchSchema(apiRoot, token)
        for (const path of Object.keys(schema.paths ?? {})) {
          if (path.startsWith('/rpc/')) {
            const fn = path.substring(5)
            this.rpc[fn] = new ObservableFunction(this.rpc.bind(this.rpc, fn))
          } else {
            const route = path.substring(1)
            this._createRoute(route)
          }
        }
        for (const [route, def] of Object.entries(schema.definitions ?? {})) {
          this._createRoute(route, def)
        }
        resolve()
      } catch (e) {
        reject(e)
      }
    })
    // non-enumerable $ready prop returning the promise, just for tests
    Object.defineProperty(this, '$ready', {
      value: ready
    })
    this.rpc = new RPC(request.bind(null, this.#apiRoot, this.#token), this.$ready)
  }

  _call (apiRoot = this.#apiRoot, token = this.#token) {
    return new Schema(apiRoot, token)
  }

  $route (route) {
    return this._createRoute(route)
  }

  _createRoute (route, def) {
    if (!this[route]) {
      this[route] = new Route(request.bind(null, this.#apiRoot, this.#token, route), this.$ready)
    }
    if (def) {
      this[route]._extractFromDefinition(def)
    }
    return this[route]
  }

  async _fetchSchema (apiRoot, token) {
    const headers = new Headers()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    try {
      const url = new URL(apiRoot, window.location.href)
      const resp = await fetch(url.toString(), { headers }).then(throwWhenStatusNotOk)
      const body = await resp.json()
      if (!resp.headers.get('Content-Type').startsWith('application/openapi+json')) {
        throw new Error('wrong body format')
      }
      return body
    } catch (err) {
      throw new SchemaNotFoundError(apiRoot, err)
    }
  }
}
