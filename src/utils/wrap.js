export default function (fn) {
  const wrapped = {
    hasError: false,
    isPending: false,
    call: function (...args) {
      if (wrapped.isPending) {
        return
      }
      wrapped.hasError = false
      wrapped.isPending = true
      return Promise.resolve(fn(...args))
        .catch((e) => {
          wrapped.hasError = true
          throw e
        })
        .finally(() => {
          wrapped.isPending = false
        })
    }
  }
  return wrapped
}