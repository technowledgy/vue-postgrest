class AuthError extends Error {
  constructor (err) {
    super(err.message || err.error_description)
    this.name = 'AuthError'
    Object.assign(this, err)
  }
}

class FetchError extends Error {
  constructor (resp, body) {
    super(resp.message || resp.statusText)
    this.name = 'FetchError'
    this.resp = resp
    this.status = resp.status
    Object.assign(this, body)
  }
}

class PrimaryKeyError extends Error {
  constructor (pk) {
    super(`Primary key not found ${pk ?? ''}`)
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

async function throwWhenStatusNotOk (resp) {
  if (!resp.ok) {
    let body = {}
    try {
      body = await resp.json()
    } catch {}
    throw new FetchError(resp, body)
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
