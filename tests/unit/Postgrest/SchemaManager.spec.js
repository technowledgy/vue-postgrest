import request from 'superagent'
import config from './MockApi.config'
import mock from 'superagent-mock'

const mockData = {
  docs: {
    definitions: {
      table1: {
        required: ['PK1', 'PK2']
      }
    }
  }
}
const requestLogger = jest.fn((log) => {})
const superagentMock = mock(request, config(mockData), requestLogger)
import SchemaManager from '@/SchemaManager'

describe('SchemaManager', () => {
  afterAll(() => {
    superagentMock.unset()
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

    it('requests schema if not cached and returns the primary keys for the requested api root if schema exists', async () => {
      const keys = await SchemaManager.getPrimaryKeys('/api/')
      expect(requestLogger.mock.calls.length).toBe(1)
      expect(keys).toEqual({
        table1: mockData.docs.definitions.table1.required
      })
    })

    it('uses existing schema if cached and returns the primary keys for the requested api root if schema exists', async () => {
      let keys = await SchemaManager.getPrimaryKeys('/api/')
      expect(requestLogger.mock.calls.length).toBe(1)
      expect(keys).toEqual({
        table1: mockData.docs.definitions.table1.required
      })
      keys = await SchemaManager.getPrimaryKeys('/api/')
      expect(requestLogger.mock.calls.length).toBe(1)
    })

    it('throws error if schema does not exist', async () => {
      await expect(SchemaManager.getPrimaryKeys('/non-existing/')).rejects.toThrow()
    })
  })
})
