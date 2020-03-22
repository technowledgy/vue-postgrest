import request from 'superagent'
import config from './MockApi.config'
import mock from 'superagent-mock'
import SchemaManager from '@/SchemaManager'

const mockData = {
  docs: {
    definitions: {
      table1: {
        properties: {
          name: {
            type: 'text',
            description: 'Note:\nThis is a Primary Key.<pk/>'
          },
          id: {
            type: 'integer',
            description: 'Note:\nThis is a Primary Key.<pk/>'
          },
          age: {
            type: 'integer',
            description: 'This is not a primary key.'
          }
        }
      }
    }
  }
}
const requestLogger = jest.fn((log) => {})
const superagentMock = mock(request, config(mockData), requestLogger)

describe('SchemaManager', () => {
  afterAll(() => {
    superagentMock.unset()
  })

  beforeEach(() => {
    requestLogger.mockReset()
  })

  describe('"resetCache" method', () => {
    it('empties the cache', () => {
      SchemaManager.cache = { data: true }
      expect(SchemaManager.cache.data).toBeTruthy()
      SchemaManager.resetCache()
      expect(SchemaManager.cache.data).toBe(undefined)
    })
  })

  describe('"getPrimaryKeys" method', () => {
    beforeEach(() => {
      SchemaManager.resetCache()
      requestLogger.mockReset()
    })

    describe('when provided a token', () => {
      it('uses api token in request', async () => {
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiamRvZSIsImV4cCI6MTQ3NTUxNjI1MH0.GYDZV3yM0gqvuEtJmfpplLBXSGYnke_Pvnl0tbKAjB'
        const keys = await SchemaManager.getPrimaryKeys('/api/', token)
        expect(requestLogger.mock.calls.length).toBe(1)
        expect(requestLogger.mock.calls[0][0].headers.authorization).toBe(`Bearer ${token}`)
      })

      it('caches schema under token level and returns the cached schema', async () => {
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiamRvZSIsImV4cCI6MTQ3NTUxNjI1MH0.GYDZV3yM0gqvuEtJmfpplLBXSGYnke_Pvnl0tbKAjB'
        const keys = await SchemaManager.getPrimaryKeys('/api/', token)
        expect(SchemaManager.cache['/api/'][token]).toEqual({
          table1: ['name', 'id']
        })
        expect(SchemaManager.cache['/api/'][token]).toBe(keys)
      })
    })

    describe('when not provided a token', () => {
      it('does not send auth header in request', async () => {
        const keys = await SchemaManager.getPrimaryKeys('/api/')
        expect(requestLogger.mock.calls.length).toBe(1)
        expect(requestLogger.mock.calls[0][0].headers.authorization).toBe(undefined)
      })

      it('caches schema under "anonymous" and returns the cached schema', async () => {
        const keys = await SchemaManager.getPrimaryKeys('/api/')
        expect(SchemaManager.cache['/api/'].anonymous).toEqual({
          table1: ['name', 'id']
        })
        expect(SchemaManager.cache['/api/'].anonymous).toBe(keys)
      })
    })

    it('requests schema if not cached and returns the primary keys for the requested api root if schema exists', async () => {
      const keys = await SchemaManager.getPrimaryKeys('/api/')
      expect(requestLogger.mock.calls.length).toBe(1)
      expect(keys).toEqual({
        table1: ['name', 'id']
      })
    })

    it('uses existing schema if cached and returns the primary keys for the requested api root if schema exists', async () => {
      let keys = await SchemaManager.getPrimaryKeys('/api/')
      expect(requestLogger.mock.calls.length).toBe(1)
      expect(keys).toEqual({
        table1: ['name', 'id']
      })
      keys = await SchemaManager.getPrimaryKeys('/api/')
      expect(requestLogger.mock.calls.length).toBe(1)
    })

    it('throws error if api does not exist', async () => {
      await expect(SchemaManager.getPrimaryKeys('/non-existing/')).rejects.toThrow()
    })

    it('throws error if exists but is not an api', async () => {
      await expect(SchemaManager.getPrimaryKeys('/other-server/')).rejects.toThrow('Not an api.')
    })
  })
})
