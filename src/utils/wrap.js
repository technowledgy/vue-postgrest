export default function (fn, emit) {
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
          // TODO: this could be handled better
          emit(String(fn.name).replace('bound _', '') + '-error', e)
        })
        .finally(() => {
          wrapped.isPending = false
        })
    }
  }
  return wrapped
}