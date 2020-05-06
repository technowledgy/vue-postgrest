class Route extends Function {
  constructor (request, ready) {
    super('', 'return arguments.callee.request.apply(arguments.callee, arguments)')
    this.request = request
    // TODO: check if we can wrap this in an ObservableFunction
    this.options = request.bind(null, 'OPTIONS')
    this.get = request.bind(null, 'GET')
    this.head = request.bind(null, 'HEAD')
    this.post = request.bind(null, 'POST')
    this.put = request.bind(null, 'PUT')
    this.patch = request.bind(null, 'PATCH')
    this.delete = request.bind(null, 'DELETE')
    // non-enumerable $ready prop returning the promise, just for tests
    Object.defineProperty(this, '$ready', {
      value: ready
    })
  }

  _extractPrimaryKeys (tableDef) {
    this.pks = Object.entries(tableDef.properties)
      .filter(([field, fieldDef]) => fieldDef.description?.includes('<pk/>'))
      .map(([field]) => field)
  }
}

export default Route
