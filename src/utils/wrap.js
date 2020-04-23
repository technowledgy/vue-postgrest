import Vue from 'vue'
import EmittedError from '@/errors/EmittedError'

class ObservableFunction extends Function {
  constructor (call, props) {
    // call this.call properly
    super('', 'return arguments.callee.call.apply(arguments.callee, arguments)')
    this.call = call.bind(this)
    // Vue.observable only works on plain objects, so we use a workaround:
    // make props observable first and then copy getters and setters to this instance
    Object.defineProperties(this, Object.getOwnPropertyDescriptors(Vue.observable(props)))
    return this
  }
}

export default function (fn) {
  return new ObservableFunction(
    function (...args) {
      if (this.isPending) {
        // TODO: improve - this stops calls silently sometimes and is unexpected.
        // Maybe add a counter for pendings?
        return
      }
      this.hasError = false
      this.isPending = true
      return Promise.resolve(fn(...args))
        .catch((e) => {
          this.hasError = true
          if (e instanceof EmittedError === false) {
            throw e
          }
        })
        .finally(() => {
          this.isPending = false
        })
    },
    {
      hasError: false,
      isPending: false
    }
  )
}
