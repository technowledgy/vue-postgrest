import { reflectHelper } from './reflect'

// use symbols for the internal props/methods to make them private
const $diff = Symbol('diff')
const $freeze = Symbol('freeze')
const $isDiffProxy = Symbol('isDiffProxy')

function createDiffProxy (target) {
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
          return () => copy(target, base)

        case $isDiffProxy: return true

        case '$isDirty':
          if (Array.isArray(target)) {
            if (target.length !== base.length) return true
            return target.filter((v, k) => v !== base[k] || (v && v[$isDiffProxy] && v.$isDirty)).length > 0
          } else {
            if (Object.keys(base).filter(k => !(k in target)).length > 0) return true
            return Object.entries(target).filter(([k, v]) => v !== base[k] || (v && v[$isDiffProxy] && v.$isDirty)).length > 0
          }

        case '$reset':
          return () => copy(base, target)
      }
      return Reflect.get(target, property, receiver)
    },
    defineProperty: reflectHelper.bind('defineProperty', [$diff, $freeze, $isDiffProxy, '$isDirty', '$reset'], false),
    deleteProperty: reflectHelper.bind('deleteProperty', [$diff, $freeze, $isDiffProxy, '$isDirty', '$reset'], false),
    getOwnPropertyDescriptor: reflectHelper.bind('getOwnPropertyDescriptor', [$diff, $freeze, $isDiffProxy, '$isDirty', '$reset'], undefined),
    has: reflectHelper.bind('has', [$diff, $freeze, $isDiffProxy, '$isDirty', '$reset'], true),
    set: reflectHelper.bind('set', [$diff, $freeze, $isDiffProxy, '$isDirty', '$reset'], false)
  })
}

// copies target keys to base and creates DiffProxies everywhere
function copy (target, base) {
  Object.entries(target).forEach(([k, v]) => {
    if (typeof v === 'object' && v !== null && !v[$isDiffProxy]) {
      target[k] = createDiffProxy(v)
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
