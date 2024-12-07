import { reactive } from 'vue'

// function that exposes some vue reactive properties about it's current running state
// use like observed_fn = new ObservableFunction(orig_fn)
class ObservableFunction extends Function {
  constructor (fn) {
    super()
    let boundFn = fn

    const state = reactive({
      hasReturned: false,
      pending: [],
      errors: [],
      get isPending () {
        return this.pending.length > 0
      },
      get hasError () {
        return this.errors.length > 0
      },
      clear (...args) {
        if (args.length) {
          this.errors = this.errors.filter((e, i) => !args.includes(e) && !args.includes(i))
        } else {
          this.errors = []
          this.hasReturned = false
        }
      },
      bind (thisArg, ...args) {
        boundFn = fn.bind(thisArg, ...args)
        return this
      }
    })

    return new Proxy(fn, {
      apply: async (target, thisArg, argumentsList) => {
        const controller = new AbortController()
        state.pending.push(controller)
        try {
          const ret = await boundFn(controller.signal, ...argumentsList)
          state.clear()
          state.hasReturned = true
          return ret
        } catch (e) {
          state.errors.push(e)
          throw e
        } finally {
          state.pending = state.pending.filter(p => p !== controller)
        }
      },
      get: (target, propertyKey, receiver) => {
        if (propertyKey === 'constructor') return Reflect.get(this, propertyKey, receiver)
        if (Reflect.ownKeys(state).includes(propertyKey)) {
          return Reflect.get(state, propertyKey, state)
        }
        return Reflect.get(target, propertyKey, target)
      },
      getOwnPropertyDescriptor: (target, propertyKey) => {
        if (Reflect.ownKeys(state).includes(propertyKey)) {
          return Reflect.getOwnPropertyDescriptor(state, propertyKey)
        }
        return Reflect.getOwnPropertyDescriptor(target, propertyKey)
      },
      has: (target, propertyKey) => {
        return Reflect.has(state, propertyKey) || Reflect.has(target, propertyKey)
      },
      ownKeys: (target) => {
        return Reflect.ownKeys(state).concat(Reflect.ownKeys(target))
      },
      set: (target, propertyKey, value, receiver) => {
        if (Reflect.ownKeys(state).includes(propertyKey)) {
          return Reflect.set(state, propertyKey, value, state)
        }
        return Reflect.set(target, propertyKey, value, target)
      }
    })
  }
}

export default ObservableFunction
