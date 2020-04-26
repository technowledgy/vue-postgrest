import Vue from 'vue'
import { throwWhenStatusNotOk, SchemaNotFoundError } from '@/errors'

let schemaCache = {}

// just for test env
export function resetSchemaCache () {
  schemaCache = {}
}

export default class Schema {
  constructor (apiRoot, token) {
    const cached = schemaCache[apiRoot] && schemaCache[apiRoot][token]
    if (cached) return cached
    // create new Instance
    Object.defineProperties(this, Object.getOwnPropertyDescriptors(Vue.observable({})))
    if (!schemaCache[apiRoot]) {
      schemaCache[apiRoot] = {}
    }
    schemaCache[apiRoot][token] = this
    Object.defineProperty(this, '_ready', {
      value: this._fetchSchema(apiRoot, token)
    })
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
      Object.defineProperty(this, '_schema', {
        value: body
      })
    } catch (err) {
      throw new SchemaNotFoundError(apiRoot, err)
    }
    Object.assign(this, this._extractPrimaryKeys(this._schema))
  }

  _extractPrimaryKeys (schema) {
    return Object.entries(schema.definitions).reduce((acc, [table, tableDef]) => {
      const pks = Object.entries(tableDef.properties)
        .filter(([field, fieldDef]) => fieldDef.description && fieldDef.description.includes('<pk/>'))
        .map(([field]) => field)
      acc[table] = { pks }
      return acc
    }, {})
  }
}
