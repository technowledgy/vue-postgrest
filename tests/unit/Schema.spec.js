import Schema, { resetSchemaCache } from '@/Schema'

describe('Schema', () => {
  beforeEach(() => {
    resetSchemaCache()
    // just reset .mock data, but not .mockResponse
    fetch.mockClear()
  })

  describe('ready method', () => {
    it('throws error if api does not exist', async () => {
      await expect((new Schema('/404'))._ready).rejects.toThrow('No openapi definition found for api-root: /404')
    })

    it('throws error if exists but is not json', async () => {
      await expect((new Schema('/text'))._ready).rejects.toThrow('No openapi definition found for api-root: /text')
    })

    it('throws error if exists but is regular json', async () => {
      await expect((new Schema('/json'))._ready).rejects.toThrow('No openapi definition found for api-root: /json')
    })
  })

  describe('once ready', () => {
    it('returns the primary keys for the requested api root', async () => {
      const schema = new Schema('/pk-api')
      await schema._ready
      expect(fetch.mock.calls.length).toBe(1)
      expect(fetch.mock.calls[0][0]).toBe('http://localhost/pk-api')
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
        const schema = new Schema('/pk-api')
        await schema._ready
        expect(fetch.mock.calls.length).toBe(1)
        expect(fetch.mock.calls[0][0]).toBe('http://localhost/pk-api')
        expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe(null)
      })

      it('used api token in request', async () => {
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiamRvZSIsImV4cCI6MTQ3NTUxNjI1MH0.GYDZV3yM0gqvuEtJmfpplLBXSGYnke_Pvnl0tbKAjB'
        const schema = new Schema('/pk-api', token)
        await schema._ready
        expect(fetch.mock.calls.length).toBe(1)
        expect(fetch.mock.calls[0][0]).toBe('http://localhost/pk-api')
        expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe(`Bearer ${token}`)
      })
    })
  })

  describe('cache', () => {
    it('returns cached schema when called twice', async () => {
      const schema = new Schema('/pk-api')
      await schema._ready
      expect(fetch.mock.calls.length).toBe(1)
      const schemaCached = new Schema('/pk-api')
      await schemaCached._ready
      expect(fetch.mock.calls.length).toBe(1)
      expect(fetch.mock.calls[0][0]).toBe('http://localhost/pk-api')
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
      const schema = new Schema('/pk-api')
      await schema._ready
      expect(fetch.mock.calls.length).toBe(1)
      const schema2 = new Schema('/pk-api2')
      await schema2._ready
      expect(fetch.mock.calls.length).toBe(2)
    })

    it('separates cache by token', async () => {
      const schema = new Schema('/pk-api')
      await schema._ready
      expect(fetch.mock.calls.length).toBe(1)
      const schema2 = new Schema('/pk-api', 'token')
      await schema2._ready
      expect(fetch.mock.calls.length).toBe(2)
    })
  })
})
