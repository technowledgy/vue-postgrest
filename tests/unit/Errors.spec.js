import { AuthError, FetchError } from '@/errors'

describe('AuthError', () => {
  it('parses error and error_description from WWW-Authenticate header', () => {
    try {
      throw new AuthError({
        headers: new Headers({
          'WWW-Authenticate': 'Bearer error="invalid_token", error_description="JWT expired"'
        })
      })
    } catch (e) {
      expect(e.error).toBe('invalid_token')
      expect(e.error_description).toBe('JWT expired')
    }
  })
})

describe('FetchError', () => {
  it('uses statusText as message', () => {
    try {
      throw new FetchError({
        statusText: 'status text'
      })
    } catch (e) {
      expect(e.message).toBe('status text')
    }
  })
})
