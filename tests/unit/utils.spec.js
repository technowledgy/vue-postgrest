import { splitToObject } from '@/utils'

describe('utils', () => {
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
