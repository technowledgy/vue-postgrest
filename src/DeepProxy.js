// use symbols for the internal props/methods to make them private
const $base = Symbol('base')
const $diff = Symbol('diff')
const $freeze = Symbol('freeze')
const $isDeepProxy = Symbol('isDeepProxy')

// we need to access them in GenericModel
export { $base, $diff, $freeze }

class DeepProxy {
  // used to track the changes to any subfields
  #diff = {}
  // used to keep all accessor properties to be defined on one object
  // solves the problem of spreading those out between target and #diff
  // this ensures support for Vue 2.x reactivity
  #props

  constructor (target) {
    if (Array.isArray(target)) {
      this.#props = []
    } else {
      this.#props = {}
    }
    Object.entries(target).forEach(([k, v]) => {
      if (typeof v === 'object' && v !== null && !v[$isDeepProxy]) {
        target[k] = new DeepProxy(v)
      }
    })
    return new Proxy(target, this)
  }

  get (target, property, receiver) {
    // returns the target stripped from any proxies
    // GenericModel uses this to get to the original PK, before changes
    if (property === $base) {
      return Object.fromEntries(
        Object.entries(target)
          .map(([k, v]) => [k, v[$isDeepProxy] ? v[$base] : v])
      )
    }

    // returns the changed subfields on the first level for GenericModel PATCH
    // on any nested levels the full (potentially changed) object is returned
    if (property === $diff) {
      return Object.assign(
        Object.fromEntries(
          Object.entries(receiver)
            .filter(([k, v]) => v && v[$isDeepProxy] && v.$isDirty)
        ),
        this.#diff
      )
    }

    // promotes the changes in $diff to target, to make them persistent
    if (property === $freeze) {
      return () => {
        // freeze this
        Reflect.ownKeys(this.#diff).forEach(k => {
          const desc = Reflect.getOwnPropertyDescriptor(this.#diff, k)
          if (typeof desc.value === 'object' && desc.value !== null && !desc.value[$isDeepProxy]) {
            desc.value = new DeepProxy(desc.value)
          }
          Reflect.defineProperty(target, k, desc)
          Reflect.deleteProperty(this.#diff, k)
        })
        // freeze children
        Object.values(target)
          .filter(v => v && v[$isDeepProxy])
          .forEach(c => c[$freeze]())
      }
    }

    // id ourselves
    if (property === $isDeepProxy) return true

    // recursive check for any changed fields
    if (property === '$isDirty') {
      const thisIsDirty = Reflect.ownKeys(this.#diff)
        .filter(k => k !== '__ob__')
        .length > 0
      const childrenAreDirty = Object.values(target)
        .filter(v => v && v[$isDeepProxy])
        .some(c => c.$isDirty)
      return thisIsDirty || childrenAreDirty
    }

    // remove any diffs
    if (property === '$reset') {
      return () => {
        // reset children
        Object.values(target)
          .filter(v => v && v[$isDeepProxy])
          .forEach(c => c.$reset())
        // reset this
        Reflect.ownKeys(this.#diff).forEach(k => Reflect.deleteProperty(receiver, k))
      }
    }

    // during initialization #prop is still at 0 at the beginning
    // setting this to 0 removes the existing items
    // however later, when new props are added, it is > target
    // max solves that
    if (Array.isArray(target) && property === 'length') {
      return Math.max(target.length, this.#props.length)
    }

    if (property in this.#props) return Reflect.get(this.#props, property)

    return Reflect.get(target, property)
  }

  set (target, property, value, receiver) {
    // not allowed, because it's hardcoded in "get"
    if ([$base, $diff, $freeze, $isDeepProxy, '$isDirty', '$reset'].includes(property)) return false

    // invoke this on #props as well to make Vues reactivity work
    Reflect.set(this.#props, property, value)

    // since we're saving #diff as an object, we don't need to keep track of length
    if (Array.isArray(target) && property === 'length') {
      return true
    }

    // setting it to the old value removes the #diff
    if (value === target[property]) {
      return Reflect.deleteProperty(this.#diff, property)
    }

    // (re)-define the property in case it doesn't exist yet
    return Reflect.defineProperty(this.#diff, property, {
      value,
      enumerable: true,
      configurable: true
    })
  }

  defineProperty (target, property, descriptor) {
    // not allowed, because it's hardcoded in "get"
    if ([$base, $diff, $freeze, $isDeepProxy, '$isDirty', '$reset'].includes(property)) return false

    return Reflect.defineProperty(this.#props, property, descriptor)
  }

  deleteProperty (target, property) {
    // not allowed, because it's hardcoded in "get"
    if ([$base, $diff, $freeze, $isDeepProxy, '$isDirty', '$reset'].includes(property)) return false

    if (property in target) {
      // set back to default value
      Reflect.set(this.#props, property, target[property])
    } else {
      Reflect.deleteProperty(this.#props, property)
    }
    return Reflect.deleteProperty(this.#diff, property)
  }

  getOwnPropertyDescriptor (target, property) {
    // return undefined, because those are inherited from the faked prototype
    if ([$base, $diff, $freeze, $isDeepProxy, '$isDirty', '$reset'].includes(property)) return

    if (property in this.#props) return Reflect.getOwnPropertyDescriptor(this.#props, property)

    return Reflect.getOwnPropertyDescriptor(target, property)
  }

  has (target, propertyKey) {
    // hardcoded in "get"
    if ([$base, $diff, $freeze, $isDeepProxy, '$isDirty', '$reset'].includes(propertyKey)) return true
    return Reflect.has(target, propertyKey) || Reflect.has(this.#props, propertyKey)
  }

  ownKeys (target) {
    return Array.from(new Set([...Reflect.ownKeys(target), ...Reflect.ownKeys(this.#props)]))
  }
}

export default DeepProxy
