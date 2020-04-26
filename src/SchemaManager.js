import { throwWhenStatusNotOk, SchemaNotFoundError } from '@/errors'

let schemaCache = {}

class Schema {
  constructor (schema) {
    Object.assign(this, this._extractPrimaryKeys(schema))
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

async function getSchema (apiRoot, token) {
  const cached = schemaCache[apiRoot] && schemaCache[apiRoot][token]
  if (cached) return cached
  // cache not available, make request
  const headers = new Headers()
  if (token) {
    headers.append('Authorization', `Bearer ${token}`)
  }
  try {
    const url = new URL(apiRoot, window.location.href)
    const resp = await fetch(url.toString(), { headers }).then(throwWhenStatusNotOk)
    const body = await resp.json()
    if (!resp.headers.get('Content-Type').startsWith('application/openapi+json') || !body.definitions) {
      throw new Error('wrong body format')
    }
    if (!schemaCache[apiRoot]) {
      schemaCache[apiRoot] = {}
    }
    const schema = new Schema(body)
    // cache it for nex ttime
    schemaCache[apiRoot][token] = schema
    return schema
  } catch (err) {
    throw new SchemaNotFoundError(apiRoot, err)
  }
}

function resetSchemaCache () {
  schemaCache = {}
}

export {
  getSchema,
  resetSchemaCache
}
