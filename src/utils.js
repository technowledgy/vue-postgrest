import Vue from 'vue'
import { PrimaryKeyError } from '@/errors'
import ObservableFunction from '@/ObservableFunction'

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

function createReactivePrototype (target) {
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
      descriptor.value = descriptor.value.bind(target)
      if (descriptor.value[Symbol.toStringTag] === 'AsyncFunction') {
        descriptor.value = new ObservableFunction(descriptor.value)
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

function reflectHelper (keys, ret, target, property, ...args) {
  if (keys.includes(property)) return ret
  return Reflect[this](target, property, ...args)
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
  createReactivePrototype,
  mapAliasesFromSelect,
  reflectHelper,
  splitToObject
}
