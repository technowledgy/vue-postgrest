class AuthError extends Error {
  constructor (err) {
    super(err.error_description)
    this.name = 'AuthError'
    Object.assign(this, err)
  }
}

class FetchError extends Error {
  constructor (resp) {
    super(resp.statusText)
    this.name = 'FetchError'
    this.resp = resp
    this.status = resp.status
    resp.json().catch(() => ({})).then(body => Object.assign(this, body))
  }
}

class PrimaryKeyError extends Error {
  constructor (pk) {
    super(`Primary key not found ${pk}`)
    this.name = 'PrimaryKeyError'
  }
}

class SchemaNotFoundError extends Error {
  constructor (apiRoot, err) {
    super('No openapi definition found for api-root: ' + apiRoot)
    this.name = SchemaNotFoundError
    this.causedBy = err
  }
}

function throwWhenStatusNotOk (resp) {
  if (!resp.ok) {
    throw new FetchError(resp)
  }
  return resp
}

export {
  AuthError,
  FetchError,
  PrimaryKeyError,
  SchemaNotFoundError,
  throwWhenStatusNotOk
}
