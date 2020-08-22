import { createPKQuery, mapAliasesFromSelect, splitToObject } from '@/utils'
import { PrimaryKeyError } from '@/errors'

describe('utils', () => {
  describe('createPKQuery', () => {
    it('returns PrimaryKeyError without pks', () => {
      expect(createPKQuery()).toBeInstanceOf(PrimaryKeyError)
    })

    it('throws with non-string keys', () => {
      // non-string key is just any error that is not PrimaryKeyError
      // those should be thrown instead of returned
      expect(() => createPKQuery([Symbol('sym')])).toThrow()
    })

    it('returns PrimaryKeyError with missing key', () => {
      expect(createPKQuery(['a'], { b: 1 })).toBeInstanceOf(PrimaryKeyError)
    })

    it('returns proper pk query', () => {
      expect(createPKQuery(['a'], { a: 1, b: 2 })).toEqual({
        'a.eq': 1
      })
    })
  })

  describe('mapAliasesFromSelect', () => {
    it('returns same keys with empty select', () => {
      expect(mapAliasesFromSelect(undefined, { a: 'a', b: 'b' })).toEqual({ a: 'a', b: 'b' })
    })
  })

  describe('splitToObject', () => {
    it('splits single pair', () => {
      expect(splitToObject('k=v')).toEqual({ k: 'v' })
    })

    it('splits multiple pairs', () => {
      expect(splitToObject('k1=v1,k2=v2')).toEqual({ k1: 'v1', k2: 'v2' })
    })

    it('returns undefined for field without delimiter', () => {
      expect(splitToObject('k1,k2=v2')).toEqual({ k1: undefined, k2: 'v2' })
    })

    it('removes quotes properly', () => {
      expect(splitToObject('k1="test"test"')).toEqual({ k1: 'test"test' })
    })
  })
})
