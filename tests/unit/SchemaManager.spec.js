import { getSchema, resetSchemaCache } from '@/SchemaManager'

fetch.resetMocks()
fetch.mockResponse(JSON.stringify({
  definitions: {
    no_pk: {
      properties: {
        age: {
          type: 'integer',
          description: 'This is not a primary key.'
        }
      }
    },
    simple_pk: {
      properties: {
        id: {
          type: 'integer',
          description: 'Note:\nThis is a Primary Key.<pk/>'
        },
        age: {
          type: 'integer',
          description: 'This is not a primary key.'
        }
      }
    },
    composite_pk: {
      properties: {
        id: {
          type: 'integer',
          description: 'Note:\nThis is a Primary Key.<pk/>'
        },
        name: {
          type: 'text',
          description: 'Note:\nThis is a Primary Key.<pk/>'
        },
        age: {
          type: 'integer',
          description: 'This is not a primary key.'
        }
      }
    }
  }
}), {
  status: 200,
  statusText: 'OK',
  headers: {
    'Content-Type': 'application/openapi+json'
  }
})

describe('SchemaManager', () => {
  beforeEach(() => {
    resetSchemaCache()
    // just reset .mock data, but not .mockResponse
    fetch.mockClear()
  })

  describe('"getSchema" method', () => {
    it('throws error if api does not exist', async () => {
      fetch.once('{}', {
        status: 404,
        statusText: 'Not found'
      })
      await expect(getSchema('/api')).rejects.toThrow('No openapi definition found for api-root: /api')
    })

    it('throws error if exists but is not json', async () => {
      fetch.once('just some text', {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      await expect(getSchema('/api')).rejects.toThrow('No openapi definition found for api-root: /api')
    })

    it('throws error if exists but is regular json', async () => {
      fetch.once(JSON.stringify({
        just: 'some',
        json: 'data'
      }), {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      await expect(getSchema('/api')).rejects.toThrow('No openapi definition found for api-root: /api')
    })

    it('requests schema and returns the primary keys for the requested api root if schema exists', async () => {
      const keys = await getSchema('/api')
      expect(fetch.mock.calls.length).toBe(1)
      expect(fetch.mock.calls[0][0]).toBe('http://localhost/api')
      expect(keys).toEqual({
        no_pk: {
          pks: []
        },
        simple_pk: {
          pks: ['id']
        },
        composite_pk: {
          pks: ['id', 'name']
        }
      })
    })

    describe('tokens', () => {
      it('does not send auth header in request when no token provided', async () => {
        await getSchema('/api')
        expect(fetch.mock.calls.length).toBe(1)
        expect(fetch.mock.calls[0][0]).toBe('http://localhost/api')
        expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe(null)
      })

      it('uses api token in request', async () => {
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiamRvZSIsImV4cCI6MTQ3NTUxNjI1MH0.GYDZV3yM0gqvuEtJmfpplLBXSGYnke_Pvnl0tbKAjB'
        await getSchema('/api', token)
        expect(fetch.mock.calls.length).toBe(1)
        expect(fetch.mock.calls[0][0]).toBe('http://localhost/api')
        expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe(`Bearer ${token}`)
      })
    })

    describe('cache', () => {
      it('returns cached schema when called twice', async () => {
        const keys = await getSchema('/api')
        expect(fetch.mock.calls.length).toBe(1)
        const keysCached = await getSchema('/api')
        expect(fetch.mock.calls.length).toBe(1)
        expect(fetch.mock.calls[0][0]).toBe('http://localhost/api')
        expect(keys).toEqual({
          no_pk: {
            pks: []
          },
          simple_pk: {
            pks: ['id']
          },
          composite_pk: {
            pks: ['id', 'name']
          }
        })
        expect(keysCached).toBe(keys)
      })

      it('separates cache by api-root', async () => {
        await getSchema('/api')
        expect(fetch.mock.calls.length).toBe(1)
        await getSchema('/api2')
        expect(fetch.mock.calls.length).toBe(2)
      })

      it('separates cache by token', async () => {
        await getSchema('/api')
        expect(fetch.mock.calls.length).toBe(1)
        await getSchema('/api', 'token')
        expect(fetch.mock.calls.length).toBe(2)
      })
    })
  })
})
