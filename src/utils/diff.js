import { reflectHelper } from './reflect'

// use symbols for the internal props/methods to make them private
const $diff = Symbol('diff')
const $freeze = Symbol('freeze')
const $isDiffProxy = Symbol('isDiffProxy')

function createDiffProxy (target, parentDirty = false) {
  const base = Array.isArray(target) ? [] : {}
  copy(target, base)
  return new Proxy(target, {
    get (target, property, receiver) {
      switch (property) {
        case $diff:
          return Object.fromEntries(Object.entries(target)
            .filter(([k, v]) => v !== base[k] || (v && v[$isDiffProxy] && v.$isDirty))
          )

        case $freeze:
          return () => {
            parentDirty = false
            copy(target, base, $freeze)
          }

        case $isDiffProxy: return true

        case '$isDirty':
          if (parentDirty) return true
          if (Array.isArray(target)) {
            if (target.length !== base.length) return true
            return target.filter((v, k) => v !== base[k] || (v && v[$isDiffProxy] && v.$isDirty)).length > 0
          } else {
            if (Object.keys(base).filter(k => !(k in target)).length > 0) return true
            return Object.entries(target).filter(([k, v]) => v !== base[k] || (v && v[$isDiffProxy] && v.$isDirty)).length > 0
          }

        case '$reset':
          return () => copy(base, target, '$reset')
      }
      return Reflect.get(target, property, receiver)
    },
    set (target, property, value, receiver) {
      if (typeof value === 'object' && value !== null && !value[$isDiffProxy]) {
        value = createDiffProxy(value, true)
      }
      return reflectHelper.call('set', [$diff, $freeze, $isDiffProxy, '$isDirty', '$reset'], false, target, property, value, receiver)
    },
    defineProperty: reflectHelper.bind('defineProperty', [$diff, $freeze, $isDiffProxy, '$isDirty', '$reset'], false),
    deleteProperty: reflectHelper.bind('deleteProperty', [$diff, $freeze, $isDiffProxy, '$isDirty', '$reset'], false),
    getOwnPropertyDescriptor: reflectHelper.bind('getOwnPropertyDescriptor', [$diff, $freeze, $isDiffProxy, '$isDirty', '$reset'], undefined),
    has: reflectHelper.bind('has', [$diff, $freeze, $isDiffProxy, '$isDirty', '$reset'], true)
  })
}

// copies target keys to base and creates DiffProxies everywhere
function copy (target, base, recurse) {
  Object.entries(target).forEach(([k, v]) => {
    if (typeof v === 'object' && v !== null) {
      if (v[$isDiffProxy]) {
        v[recurse]?.()
      } else {
        target[k] = createDiffProxy(v)
      }
    }
    // create base copy for diffs and reset
    base[k] = target[k]
  })
}

export {
  // we need to access the first two props in GenericModel
  $diff,
  $freeze,
  createDiffProxy
}
