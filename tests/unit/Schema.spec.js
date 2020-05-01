import Schema, { resetSchemaCache } from '@/Schema'
import Route from '@/Route'

describe('Schema', () => {
  beforeEach(() => {
    resetSchemaCache()
    // just reset .mock data, but not .mockResponse
    fetch.mockClear()
  })

  describe('ready method', () => {
    it('throws error if api does not exist', async () => {
      await expect((new Schema('/404')).$ready).rejects.toThrow('No openapi definition found for api-root: /404')
    })

    it('throws error if exists but is not json', async () => {
      await expect((new Schema('/text')).$ready).rejects.toThrow('No openapi definition found for api-root: /text')
    })

    it('throws error if exists but is regular json', async () => {
      await expect((new Schema('/json')).$ready).rejects.toThrow('No openapi definition found for api-root: /json')
    })
  })

  describe('once ready', () => {
    it('returns the primary keys for the requested api root', async () => {
      const schema = new Schema('/pk-api')
      await schema.$ready
      expect(fetch.mock.calls.length).toBe(1)
      expect(fetch.mock.calls[0][0]).toBe('http://localhost/pk-api')
      expect(schema.no_pk.pks).toEqual([])
      expect(schema.simple_pk.pks).toEqual(['id'])
      expect(schema.composite_pk.pks).toEqual(['id', 'name'])
    })

    describe('tokens', () => {
      it('has not sent auth header in request when no token provided', async () => {
        const schema = new Schema('/pk-api')
        await schema.$ready
        expect(fetch.mock.calls.length).toBe(1)
        expect(fetch.mock.calls[0][0]).toBe('http://localhost/pk-api')
        expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe(null)
      })

      it('used api token in request', async () => {
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiamRvZSIsImV4cCI6MTQ3NTUxNjI1MH0.GYDZV3yM0gqvuEtJmfpplLBXSGYnke_Pvnl0tbKAjB'
        const schema = new Schema('/pk-api', token)
        await schema.$ready
        expect(fetch.mock.calls.length).toBe(1)
        expect(fetch.mock.calls[0][0]).toBe('http://localhost/pk-api')
        expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe(`Bearer ${token}`)
      })
    })
  })

  describe('cache', () => {
    it('returns cached schema when called twice', async () => {
      const schema = new Schema('/pk-api')
      await schema.$ready
      expect(fetch.mock.calls.length).toBe(1)
      const schemaCached = new Schema('/pk-api')
      await schemaCached.$ready
      expect(fetch.mock.calls.length).toBe(1)
      expect(fetch.mock.calls[0][0]).toBe('http://localhost/pk-api')
      expect(schemaCached).toBe(schema)
    })

    it('separates cache by api-root', async () => {
      const schema = new Schema('/pk-api')
      await schema.$ready
      expect(fetch.mock.calls.length).toBe(1)
      const schema2 = new Schema('/pk-api2')
      await schema2.$ready
      expect(fetch.mock.calls.length).toBe(2)
    })

    it('separates cache by token', async () => {
      const schema = new Schema('/pk-api')
      await schema.$ready
      expect(fetch.mock.calls.length).toBe(1)
      const schema2 = new Schema('/pk-api', 'token')
      await schema2.$ready
      expect(fetch.mock.calls.length).toBe(2)
    })
  })

  describe('called as function', () => {
    const schema = new Schema('/pk-api')
    beforeAll(() => schema.$ready)

    it('returns current schema instance without arguments', () => {
      // repeat this in here, because the schema cache should not be cleared to receive the same instance
      const schema = new Schema('/pk-api')
      const calledSchema = schema()
      expect(calledSchema).toBeInstanceOf(Schema)
      expect(schema).toBe(calledSchema)
    })

    it('ready rejects for unavailable schema', async () => {
      const calledSchema = schema('/404')
      await expect(calledSchema.$ready).rejects.toThrow()
    })

    it('ready resolves for available schema', async () => {
      const calledSchema = schema('/api')
      await calledSchema.$ready
      expect(fetch.mock.calls.length).toBe(1)
      expect(fetch.mock.calls[0][0]).toBe('http://localhost/api')
      expect(schema.clients).toBe(undefined)
      expect(calledSchema.clients.pks).toEqual(['id'])
    })

    it('passes token', async () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiamRvZSIsImV4cCI6MTQ3NTUxNjI1MH0.GYDZV3yM0gqvuEtJmfpplLBXSGYnke_Pvnl0tbKAjB'
      const calledSchema = schema('/api', token)
      await calledSchema.$ready
      expect(fetch.mock.calls.length).toBe(1)
      expect(fetch.mock.calls[0][0]).toBe('http://localhost/api')
      expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe(`Bearer ${token}`)
    })

    it('re-uses default apiRoot when only token is passed', async () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiamRvZSIsImV4cCI6MTQ3NTUxNjI1MH0.GYDZV3yM0gqvuEtJmfpplLBXSGYnke_Pvnl0tbKAjB'
      const calledSchema = schema(undefined, token)
      await calledSchema.$ready
      expect(fetch.mock.calls.length).toBe(1)
      expect(fetch.mock.calls[0][0]).toBe('http://localhost/pk-api')
      expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe(`Bearer ${token}`)
    })
  })

  describe('$route()', () => {
    const schema = new Schema('/api')
    beforeAll(() => schema.$ready)

    it('returns route object', () => {
      const route = schema.$route('clients')
      expect(route).toBeInstanceOf(Route)
    })

    it('route object has pks set', async () => {
      const route = schema.$route('clients')
      await route.$ready
      expect(route.pks).toEqual(['id'])
    })

    it('route ready rejects for unavailable schema', async () => {
      const route = schema('/404').$route('clients')
      await expect(route.$ready).rejects.toThrow()
    })
  })
})
