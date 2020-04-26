class EmittedError extends Error {
  constructor (msg) {
    super(msg)
    this.name = 'EmittedError'
  }
}

class PrimaryKeyError extends Error {
  constructor (pk) {
    super('Instance has no primary key "' + pk + '"')
    this.name = 'PrimaryKeyError'
  }
}

class SchemaNotFoundError extends Error {
  constructor (apiRoot, err) {
    super('No openapi definition found for api-root: ' + apiRoot)
    this.causedBy = err
  }
}

class FetchError extends Error {
  constructor (resp) {
    super(resp.statusText)
    this.resp = resp
    this.status = resp.status
    Object.assign(this, resp.body.json())
  }
}

function throwWhenStatusNotOk (resp) {
  if (!resp.ok) {
    throw new FetchError(resp)
  }
  return resp
}

export {
  EmittedError,
  FetchError,
  PrimaryKeyError,
  SchemaNotFoundError,
  throwWhenStatusNotOk
}
