const isDeepProxy = Symbol('isDeepProxy')

class DeepProxy {
  #diff

  constructor (target) {
    this.#diff = {}
    Object.entries(target).forEach(([k, v]) => {
      if (typeof v === 'object' && v !== null && !v[isDeepProxy]) {
        target[k] = new DeepProxy(v)
      }
    })
    return new Proxy(target, this)
  }

  get (target, property, receiver) {
    if (property === isDeepProxy) return true

    if (property === '$reset') {
      return () => {
        // reset children
        Object.values(target)
          .filter(v => v && v[isDeepProxy])
          .forEach(c => c.$reset())
        // reset this
        Reflect.ownKeys(this.#diff).forEach(k => Reflect.deleteProperty(this.#diff, k))
      }
    }

    if (property === '$freeze') {
      return () => {
        // freeze this
        Reflect.ownKeys(this.#diff).forEach(k => {
          const desc = Reflect.getOwnPropertyDescriptor(this.#diff, k)
          if (typeof desc.value === 'object' && desc.value !== null && !desc.value[isDeepProxy]) {
            desc.value = new DeepProxy(desc.value)
          }
          Reflect.defineProperty(target, k, desc)
          Reflect.deleteProperty(this.#diff, k)
        })
        // freeze children
        Object.values(target)
          .filter(v => v && v[isDeepProxy])
          .forEach(c => c.$freeze())
      }
    }

    if (property === '$isDirty') {
      const thisIsDirty = Reflect.ownKeys(this.#diff)
        .filter(k => k !== '__ob__')
        .length > 0
      const childrenAreDirty = Object.values(target)
        .filter(v => v && v[isDeepProxy])
        .some(c => c.$isDirty)
      return thisIsDirty || childrenAreDirty
    }

    if (property === '$diff') {
      return Object.assign(
        Object.fromEntries(
          Object.entries(receiver)
            .filter(([k, v]) => v && v[isDeepProxy] && v.$isDirty)
        ),
        this.#diff
      )
    }

    if (property === '$base') {
      return Object.fromEntries(
        Object.entries(target)
          .map(([k, v]) => [k, v[isDeepProxy] ? v.$base : v])
      )
    }

    if (property in this.#diff) return Reflect.get(this.#diff, property)

    return Reflect.get(target, property)
  }

  set (target, property, value, receiver) {
    const currentTargetValue = Reflect.get(target, property, receiver)
    // setting it to the old value removes the #diff
    if (currentTargetValue === value) {
      return Reflect.deleteProperty(this.#diff, property)
    } else {
      return Reflect.set(this.#diff, property, value, receiver)
    }
  }

  deleteProperty (target, property) {
    return Reflect.deleteProperty(this.#diff, property)
  }

  getOwnPropertyDescriptor (target, property) {
    if ([isDeepProxy, '$reset', '$freeze', '$isDirty', '$diff', '$base'].includes(property)) {
      return {
        value: Reflect.get(target, property)
      }
    }

    if (property in this.#diff) return Reflect.getOwnPropertyDescriptor(this.#diff, property)

    return Reflect.getOwnPropertyDescriptor(target, property)
  }

  defineProperty (target, property, descriptor) {
    const currentDescriptor = Reflect.getOwnPropertyDescriptor(target, property) ?? {}
    const isAccessorDesc = 'get' in descriptor || 'set' in descriptor
    const currentIsAccessorDesc = 'get' in currentDescriptor || 'set' in currentDescriptor
    // setting it to the old value removes the #diff
    if (!isAccessorDesc && !currentIsAccessorDesc && currentDescriptor.value === descriptor.value) {
      return Reflect.deleteProperty(this.#diff, property)
    } else {
      if (isAccessorDesc === currentIsAccessorDesc) {
        // modify/extend existing descriptor
        return Reflect.defineProperty(this.#diff, property, Object.assign(currentDescriptor, descriptor))
      } else {
        // set new descriptor (can't merge descriptors, because of incompatible keys)
        return Reflect.defineProperty(this.#diff, property, descriptor)
      }
    }
  }

  has (target, propertyKey) {
    return Reflect.has(target, propertyKey) || Reflect.has(this.#diff, propertyKey)
  }

  ownKeys (target) {
    return Array.from(new Set([...Reflect.ownKeys(target), ...Reflect.ownKeys(this.#diff)]))
  }
}

export default DeepProxy
