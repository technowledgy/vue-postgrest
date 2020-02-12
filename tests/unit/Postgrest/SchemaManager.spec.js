import request from 'superagent'
import config from './MockApi.config'
import mock from 'superagent-mock'

const mockData = {
  docs: {
    definitions: {
      table1: {
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

    it('throws error if schema does not exist', async () => {
      await expect(SchemaManager.getPrimaryKeys('/non-existing/')).rejects.toThrow()
    })
  })
})
