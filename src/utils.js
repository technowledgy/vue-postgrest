import Vue from 'vue'
import { EmittedError } from '@/errors'

// function that exposes some vue reactive properties about it's current running state
// use like observed_fn = new ObservableFunction(orig_fn)
class ObservableFunction extends Function {
  constructor (fn) {
    // call this.call properly
    super('', 'return arguments.callee.call.apply(arguments.callee, arguments)')
    this._fn = fn
    // Vue.observable only works on plain objects, so we use a workaround:
    // make properties observable first and then copy getters and setters to this instance
    Object.defineProperties(this, Object.getOwnPropertyDescriptors(Vue.observable({
      errors: [],
      get hasError () {
        return this.errors.length > 0
      },
      nPending: 0,
      get isPending () {
        return this.nPending > 0
      }
    })))
    return this
  }

  call (...args) {
    this.nPending++
    return Promise.resolve(this._fn(...args))
      .then(ret => {
        this.errors = []
        return ret
      })
      .catch((e) => {
        this.errors.push(e)
        if (e instanceof EmittedError === false) {
          throw e
        }
      })
      .finally(() => {
        this.nPending--
      })
  }
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
    if (isObject(o2[k2]) && isObject(o1[k2])) {
      syncObjects(o1[k2], o2[k2])
    } else {
      Vue.set(o1, k2, o2[k2])
    }
  }
}

// split strings of the format key1=value1,key2=value2,... into object
export default function splitToObject (str, fieldDelimiter=',', kvDelimiter='=') {
  return str.split(fieldDelimiter).reduce((acc, field) => {
    const parts = field.split(kvDelimiter)
    acc[parts[0].trim()] = parts[1] ? parts[1].replace(/^["\s]+|["\s]+$/g, '') : undefined
    return acc
  }, {})
}

export {
  ObservableFunction,
  isObject,
  syncObjects,
  splitToObject
}
