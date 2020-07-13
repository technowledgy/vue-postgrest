import Vue from 'vue'

// function that exposes some vue reactive properties about it's current running state
// use like observed_fn = new ObservableFunction(orig_fn)
class ObservableFunction extends Function {
  #fn
  constructor (fn) {
    // call this.call properly
    super('', 'return arguments.callee.call.apply(arguments.callee, arguments)')
    this.#fn = fn
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
    this.__ob__.value = this
  }

  async call (...args) {
    this.nPending++
    try {
      const ret = await this.#fn(...args)
      this.clear()
      return ret
    } catch (e) {
      this.errors.push(e)
      throw e
    } finally {
      this.nPending--
    }
  }

  clear (...args) {
    if (args.length) {
      this.errors = this.errors.filter((e, i) => !args.includes(e) && !args.includes(i))
    } else {
      this.errors = []
    }
  }
}

export default ObservableFunction
