import Route from '@/Route'
import request from '@/request'
import { throwWhenStatusNotOk, SchemaNotFoundError } from '@/errors'

let schemaCache = {}

// just for test env
export function resetSchemaCache () {
  schemaCache = {}
}

export default class Schema extends Function {
  #apiRoot
  #token

  constructor (apiRoot, token) {
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
        for (const [route, def] of Object.entries(schema.definitions)) {
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
      this[route]._extractPrimaryKeys(def)
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
      if (!resp.headers.get('Content-Type').startsWith('application/openapi+json') || !body.definitions) {
        throw new Error('wrong body format')
      }
      return body
    } catch (err) {
      throw new SchemaNotFoundError(apiRoot, err)
    }
  }
}
