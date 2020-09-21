import Vue from 'vue'
import ObservableFunction from '@/ObservableFunction'
import { reflectHelper } from './reflect'

function createReactivePrototype (target, boundThis) {
  // adds observer to target through helper object to avoid vue internal check of isPlainObject
  const reactiveBase = Vue.observable(Array.isArray(target) ? [] : {})
  Object.defineProperties(target, Object.getOwnPropertyDescriptors(reactiveBase))
  target.__ob__.value = target
  // split the target prototype object into constructor and prototype props
  const targetProto = Object.getPrototypeOf(target)
  const { constructor, ...props } = Object.getOwnPropertyDescriptors(targetProto)
  const keys = Object.keys(props)
  // copies the vue-augmented prototype and adds the target constructor
  const reactiveProto = Object.getPrototypeOf(reactiveBase)
  Object.setPrototypeOf(target, Object.create(targetProto, {
    ...Object.getOwnPropertyDescriptors(reactiveProto),
    constructor
  }))
  // add the target prototype's properties non-enumerable on the instance for reactivity
  // to add vue's reactive getters and setters, set them enumerable first and then change that
  // using temporary Proxies to hook into defineProperty to change enumerability
  const makeEnumerableAndObservableProxy = new Proxy(target, {
    defineProperty: (target, key, descriptor) => {
      descriptor.enumerable = true
      if (descriptor.value instanceof Function) {
        descriptor.value = descriptor.value.bind(boundThis)
        if (descriptor.value[Symbol.toStringTag] === 'AsyncFunction') {
          descriptor.value = new ObservableFunction(descriptor.value)
        }
      }
      return Reflect.defineProperty(target, key, descriptor)
    }
  })
  Object.defineProperties(makeEnumerableAndObservableProxy, props)
  const makeNonEnumerableProxy = new Proxy(target, {
    defineProperty: (target, key, descriptor) => {
      // only turn enumeration off for proto keys
      // target could already have data, that should stay untouched during ob.walk
      if (keys.includes(key)) {
        descriptor.enumerable = false
      }
      return Reflect.defineProperty(target, key, descriptor)
    }
  })
  // call observer's walk method to pick up on the newly created props
  target.__ob__.walk(makeNonEnumerableProxy)
  // wrap in proxy to hide instanced proto props
  return new Proxy(target, {
    defineProperty: reflectHelper.bind('defineProperty', keys, false),
    deleteProperty: reflectHelper.bind('deleteProperty', keys, false),
    getOwnPropertyDescriptor: reflectHelper.bind('getOwnPropertyDescriptor', keys, undefined),
    ownKeys: (target) => {
      return Reflect.ownKeys(target).filter(k => !keys.includes(k))
    },
    set: reflectHelper.bind('set', keys, false)
  })
}

export { createReactivePrototype }
