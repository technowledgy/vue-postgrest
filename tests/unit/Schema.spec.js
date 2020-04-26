import Schema, { resetSchemaCache } from '@/Schema'

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

describe('Schema', () => {
  beforeEach(() => {
    resetSchemaCache()
    // just reset .mock data, but not .mockResponse
    fetch.mockClear()
  })

  describe('ready method', () => {
    it('throws error if api does not exist', async () => {
      fetch.once('{}', {
        status: 404,
        statusText: 'Not found'
      })
      await expect((new Schema('/api'))._ready).rejects.toThrow('No openapi definition found for api-root: /api')
    })

    it('throws error if exists but is not json', async () => {
      fetch.once('just some text', {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      await expect((new Schema('/api'))._ready).rejects.toThrow('No openapi definition found for api-root: /api')
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
      await expect((new Schema('/api'))._ready).rejects.toThrow('No openapi definition found for api-root: /api')
    })
  })

  describe('once ready', () => {
    it('returns the primary keys for the requested api root', async () => {
      const schema = new Schema('/api')
      await schema._ready
      expect(fetch.mock.calls.length).toBe(1)
      expect(fetch.mock.calls[0][0]).toBe('http://localhost/api')
      expect(schema).toEqual({
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
      it('has not sent auth header in request when no token provided', async () => {
        const schema = new Schema('/api')
        await schema._ready
        expect(fetch.mock.calls.length).toBe(1)
        expect(fetch.mock.calls[0][0]).toBe('http://localhost/api')
        expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe(null)
      })

      it('used api token in request', async () => {
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiamRvZSIsImV4cCI6MTQ3NTUxNjI1MH0.GYDZV3yM0gqvuEtJmfpplLBXSGYnke_Pvnl0tbKAjB'
        const schema = new Schema('/api', token)
        await schema._ready
        expect(fetch.mock.calls.length).toBe(1)
        expect(fetch.mock.calls[0][0]).toBe('http://localhost/api')
        expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe(`Bearer ${token}`)
      })
    })
  })

  describe('cache', () => {
    it('returns cached schema when called twice', async () => {
      const schema = new Schema('/api')
      await schema._ready
      expect(fetch.mock.calls.length).toBe(1)
      const schemaCached = new Schema('/api')
      await schemaCached._ready
      expect(fetch.mock.calls.length).toBe(1)
      expect(fetch.mock.calls[0][0]).toBe('http://localhost/api')
      expect(schema).toEqual({
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
      expect(schemaCached).toBe(schema)
    })

    it('separates cache by api-root', async () => {
      const schema = new Schema('/api')
      await schema._ready
      expect(fetch.mock.calls.length).toBe(1)
      const schema2 = new Schema('/api2')
      await schema2._ready
      expect(fetch.mock.calls.length).toBe(2)
    })

    it('separates cache by token', async () => {
      const schema = new Schema('/api')
      await schema._ready
      expect(fetch.mock.calls.length).toBe(1)
      const schema2 = new Schema('/api', 'token')
      await schema2._ready
      expect(fetch.mock.calls.length).toBe(2)
    })
  })
})
