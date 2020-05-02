import Vue from 'vue'

function isEqual (a, b) {
  if (a === b || a?.valueOf() === b?.valueOf()) return true
  if (a?.toString?.() === '[object Object]' && b?.toString?.() === '[object Object]') {
    if (Object.keys(a).every(key => Object.prototype.hasOwnProperty.call(b, key))) {
      return Object.keys(b).every(key => isEqual(a[key], b[key]))
    }
  }
  return false
}

// object, but not null
function isObject (obj) {
  return (typeof obj === 'object' && obj)
}

// deep merge o2 into o1, while reusing all existing objects to keep existing references valid
// when del=true, top-level-keys on o1 that are not on o2 are removed
function syncObjects (o1, o2, del = true) {
  if (del) {
    for (const k1 in o1) {
      if (o2[k1] === undefined) {
        Vue.delete(o1, k1)
      }
    }
  }
  for (const k2 in o2) {
    if (isObject(o2[k2])) {
      if (!isObject(o1[k2])) {
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
  isObject,
  syncObjects,
  splitToObject
}