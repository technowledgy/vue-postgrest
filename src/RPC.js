class RPC extends Function {
  constructor (request, ready) {
    super('', 'return arguments.callee._call.apply(arguments.callee, arguments)')
    this._request = request
    // non-enumerable $ready prop returning the promise, just for tests
    Object.defineProperty(this, '$ready', {
      value: ready
    })
  }

  async _call (fn, params, opts = {}) {
    const { get, query, ...requestOptions } = opts
    if (get) {
      return this._request('rpc/' + fn, 'GET', Object.assign({}, query, params), requestOptions)
    } else {
      return this._request('rpc/' + fn, 'POST', query, requestOptions, params)
    }
  }
}

export default RPC
