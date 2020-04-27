class AuthError extends Error {
  constructor (err) {
    super(err.error_description)
    Object.assign(this, err)
  }
}

class EmittedError extends Error {
  constructor (msg) {
    super(msg)
    this.name = 'EmittedError'
  }
}

class FetchError extends Error {
  constructor (resp) {
    super(resp.statusText)
    this.resp = resp
    this.status = resp.status
    resp.json().catch(() => ({})).then(body => Object.assign(this, body))
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

function throwWhenStatusNotOk (resp) {
  if (!resp.ok) {
    throw new FetchError(resp)
  }
  return resp
}

export {
  AuthError,
  EmittedError,
  FetchError,
  PrimaryKeyError,
  SchemaNotFoundError,
  throwWhenStatusNotOk
}
