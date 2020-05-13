import Vue from 'vue'

function isEqual (a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return a === b
  if (a === b || (a.valueOf() === b.valueOf() && a.constructor === b.constructor)) return true
  if (a instanceof Date) return false
  if (b instanceof Date) return false
  if (a instanceof Object && b instanceof Object && Array.isArray(a) === Array.isArray(b)) {
    if (Object.keys(a).every(key => Object.prototype.hasOwnProperty.call(b, key))) {
      return Object.keys(b).every(key => isEqual(a[key], b[key]))
    }
  }
  // eslint-disable-next-line no-self-compare
  return a !== a && b !== b // both NaN
}

// object, but not null
function isObject (obj) {
  return (typeof obj === 'object' && obj)
}

// deep merge o2 into o1, while reusing all existing objects to keep existing references valid
// when del=true, top-level-keys on o1 that are not on o2 are removed
function syncObjects (o1, o2, del = true) {
  if (del) {
    for (const k in o1) {
      if (o2[k] === undefined) {
        Vue.delete(o1, k)
      }
    }
  }
  const copy = cloneDeep(o2)
  for (const k in copy) {
    Vue.set(o1, k, copy[k])
  }
  return Object.assign(o1)
}

function cloneDeep (source) {
  if (Array.isArray(source)) {
    return source.map(cloneDeep)
  } else if (isObject(source)) {
    return Object.entries(source).reduce((acc, [k, v]) => {
      acc[k] = cloneDeep(v)
      return acc
    }, {})
  } else {
    return source
  }
}

// split strings of the format key1=value1,key2=value2,... into object
export default function splitToObject (str, fieldDelimiter = ',', kvDelimiter = '=') {
  return str.split(fieldDelimiter).reduce((acc, field) => {
    const parts = field.split(kvDelimiter)
    acc[parts[0].trim()] = parts[1] ? parts[1].replace(/^["\s]+|["\s]+$/g, '') : undefined
    return acc
  }, {})
}

export {
  cloneDeep,
  isEqual,
  syncObjects,
  splitToObject
}
