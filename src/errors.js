import { splitToObject } from '@/utils'

class FetchError extends Error {
  constructor (resp, body) {
    super(resp.statusText)
    this.name = 'FetchError'
    this.resp = resp
    this.status = resp.status
    Object.assign(this, body)
  }
}

class AuthError extends FetchError {
  constructor (resp, body) {
    super(resp, body)
    this.name = 'AuthError'
    Object.assign(this, splitToObject(resp.headers.get('WWW-Authenticate').replace(/^Bearer /, '')))
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
    if (resp.headers.get('WWW-Authenticate')) {
      throw new AuthError(resp, body)
    }
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
