import { createReactivePrototype } from '@/utils'

// function that exposes some vue reactive properties about it's current running state
// use like observed_fn = new ObservableFunction(orig_fn)
class ObservableFunction extends Function {
  constructor (fn) {
    super()
    return new Proxy(createReactivePrototype(this, this), {
      apply: async (target, thisArg, argumentsList) => {
        const controller = new AbortController()
        this.pending.push(controller)
        try {
          const ret = await fn(controller.signal, ...argumentsList)
          this.clear()
          this.hasReturned = true
          return ret
        } catch (e) {
          this.errors.push(e)
          throw e
        } finally {
          this.pending = this.pending.filter(p => p !== controller)
        }
      }
    })
  }

  hasReturned = false

  pending = []

  get isPending () {
    return this.pending.length > 0
  }

  errors = []

  get hasError () {
    return this.errors.length > 0
  }

  clear (...args) {
    if (args.length) {
      this.errors = this.errors.filter((e, i) => !args.includes(e) && !args.includes(i))
    } else {
      this.errors = []
      this.hasReturned = false
    }
  }
}

export default ObservableFunction
