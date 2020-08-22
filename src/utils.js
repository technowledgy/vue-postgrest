import { PrimaryKeyError } from '@/errors'

function createPKQuery (pkColumns = [], data = {}) {
  try {
    // we can't get/put/patch/delete on a route without PK
    if (pkColumns.length === 0) throw new PrimaryKeyError()
    return pkColumns.reduce((query, col) => {
      if (data[col] === undefined || data[col] === null) {
        throw new PrimaryKeyError(col)
      }
      // TODO: do we need .is for Boolean PKs?
      query[col + '.eq'] = data[col]
      return query
    }, {})
  } catch (e) {
    if (e instanceof PrimaryKeyError) {
      // we are returning the PrimaryKeyError here, because it will be thrown later again,
      // when one of the methods that need a query to succeed is called
      return e
    } else {
      throw e
    }
  }
}

function cloneDeep (source) {
  if (Array.isArray(source)) {
    return source.map(cloneDeep)
  } else if (typeof source === 'object' && source) {
    return Object.entries(source).reduce((acc, [k, v]) => {
      acc[k] = cloneDeep(v)
      return acc
    }, {})
  } else {
    return source
  }
}

function mapAliasesFromSelect (select = [], data) {
  const kvPairs =
    Array.isArray(select) ? select.map(k => [k, true])
      : typeof select === 'string' ? select.split(',').map(k => [k, true])
        : Object.entries(select)
  const alias2column = new Map(kvPairs
    .map(([k, v]) => {
      if (!v) return
      const [alias, column] = k.split(':')
      return [alias, column ?? alias]
    })
    .filter(Boolean)
  )
  return Object.fromEntries(Object.entries(data).map(([alias, value]) => [alias2column.get(alias) ?? alias, value]))
}

function reflect (fn, keys, ret, target, property, ...args) {
  if (keys.includes(property)) return ret
  return Reflect[fn](this, property, ...args)
}

// split strings of the format key1=value1,key2=value2,... into object
function splitToObject (str, fieldDelimiter = ',', kvDelimiter = '=') {
  return str.split(fieldDelimiter).reduce((acc, field) => {
    const parts = field.split(kvDelimiter)
    acc[parts[0].trim()] = parts[1] ? parts[1].replace(/^["\s]+|["\s]+$/g, '') : undefined
    return acc
  }, {})
}

export {
  cloneDeep,
  createPKQuery,
  mapAliasesFromSelect,
  reflect,
  splitToObject
}
