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
    if (Array.isArray(o1) && Array.isArray(o2)) {
      for (let i = o1.length; i >= o2.length; i--) {
        Vue.delete(o1, i)
      }
    } else {
      for (const k1 in o1) {
        if (o2[k1] === undefined) {
          Vue.delete(o1, k1)
        }
      }
    }
  }
  for (const k2 in o2) {
    if (isObject(o2[k2])) {
      if (!isObject(o1[k2]) || Array.isArray(o1[k2]) !== Array.isArray(o2[k2])) {
        Vue.set(o1, k2, Array.isArray(o2[k2]) ? [] : {})
      }
      syncObjects(o1[k2], o2[k2])
    } else {
      Vue.set(o1, k2, o2[k2])
    }
  }
  return o1
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
  isEqual,
  syncObjects,
  splitToObject
}
