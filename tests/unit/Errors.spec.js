import { AuthError, FetchError } from '@/errors'

describe('AuthError', () => {
  it('uses message when set', () => {
    try {
      throw new AuthError({
        message: 'message',
        error_description: 'description'
      })
    } catch (e) {
      expect(e.message).toBe('message')
    }
  })

  it('uses error_description when message not set', () => {
    try {
      throw new AuthError({
        error_description: 'description'
      })
    } catch (e) {
      expect(e.message).toBe('description')
    }
  })
})

describe('FetchError', () => {
  it('uses message when set', () => {
    try {
      throw new FetchError({
        message: 'message',
        statusText: 'status text'
      })
    } catch (e) {
      expect(e.message).toBe('message')
    }
  })

  it('uses statusText when message not set', () => {
    try {
      throw new FetchError({
        statusText: 'status text'
      })
    } catch (e) {
      expect(e.message).toBe('status text')
    }
  })
})
