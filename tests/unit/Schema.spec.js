import Schema, { resetSchemaCache } from '@/Schema'
import Route from '@/Route'
import RPC from '@/RPC'
import { SchemaNotFoundError } from '@/index'

import request from '@/request'
jest.mock('@/request')

describe('Schema', () => {
  beforeEach(() => {
    resetSchemaCache()
    // just reset .mock data, but not .mockResponse
    fetch.mockClear()
  })

  describe('ready method', () => {
    it('throws error if api does not exist', async () => {
      await expect((new Schema('/404')).$ready).rejects.toThrow('No openapi definition found for api-root: /404')
      await expect((new Schema('/404')).$ready).rejects.toThrow(SchemaNotFoundError)
    })

    it('throws error if exists but is not json', async () => {
      await expect((new Schema('/text')).$ready).rejects.toThrow('No openapi definition found for api-root: /text')
      await expect((new Schema('/text')).$ready).rejects.toThrow(SchemaNotFoundError)
    })

    it('throws error if exists but is regular json', async () => {
      await expect((new Schema('/json')).$ready).rejects.toThrow('No openapi definition found for api-root: /json')
      await expect((new Schema('/json')).$ready).rejects.toThrow(SchemaNotFoundError)
    })
  })

  describe('tokens', () => {
    it('has not sent auth header in request when no token provided', async () => {
      const schema = new Schema('/pk-api')
      await schema.$ready
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/pk-api', expect.objectContaining({
        headers: new Headers()
      }))
    })

    it('used api token in request', async () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiamRvZSIsImV4cCI6MTQ3NTUxNjI1MH0.GYDZV3yM0gqvuEtJmfpplLBXSGYnke_Pvnl0tbKAjB'
      const schema = new Schema('/pk-api', token)
      await schema.$ready
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/pk-api', expect.objectContaining({
        headers: new Headers({
          Authorization: `Bearer ${token}`
        })
      }))
    })
  })

  describe('cache', () => {
    it('returns cached schema when called twice', async () => {
      const schema = new Schema('/pk-api')
      await schema.$ready
      expect(fetch).toHaveBeenCalledTimes(1)
      const schemaCached = new Schema('/pk-api')
      await schemaCached.$ready
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/pk-api', expect.anything())
      expect(schemaCached).toBe(schema)
    })

    it('separates cache by api-root', async () => {
      const schema = new Schema('/pk-api')
      await schema.$ready
      expect(fetch).toHaveBeenCalledTimes(1)
      const schema2 = new Schema('/pk-api2')
      await schema2.$ready
      expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('separates cache by token', async () => {
      const schema = new Schema('/pk-api')
      await schema.$ready
      expect(fetch).toHaveBeenCalledTimes(1)
      const schema2 = new Schema('/pk-api', 'token')
      await schema2.$ready
      expect(fetch).toHaveBeenCalledTimes(2)
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
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/api', expect.anything())
      expect(schema.clients).toBeUndefined()
      expect(calledSchema.clients.pks).toEqual(['id'])
    })

    it('passes token', async () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiamRvZSIsImV4cCI6MTQ3NTUxNjI1MH0.GYDZV3yM0gqvuEtJmfpplLBXSGYnke_Pvnl0tbKAjB'
      const calledSchema = schema('/api', token)
      await calledSchema.$ready
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/api', expect.objectContaining({
        headers: new Headers({
          Authorization: `Bearer ${token}`
        })
      }))
    })

    it('re-uses default apiRoot when only token is passed', async () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiamRvZSIsImV4cCI6MTQ3NTUxNjI1MH0.GYDZV3yM0gqvuEtJmfpplLBXSGYnke_Pvnl0tbKAjB'
      const calledSchema = schema(undefined, token)
      await calledSchema.$ready
      expect(fetch).toHaveBeenLastCalledWith('http://localhost/pk-api', expect.objectContaining({
        headers: new Headers({
          Authorization: `Bearer ${token}`
        })
      }))
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

    it('provides curried functions as props', async () => {
      await schema.$ready
      expect(schema.clients).toBeInstanceOf(Route)
      schema.clients()
      expect(request).toHaveBeenCalledWith('/api', undefined, 'clients')

      expect(schema.other).toBeInstanceOf(Route)
      schema.other()
      expect(request).toHaveBeenCalledWith('/api', undefined, 'other')
    })
  })

  describe('RPC', () => {
    const schema = new Schema('/api')
    beforeAll(() => schema.$ready)

    it('schema has rpc function', () => {
      expect(schema.rpc).toBeInstanceOf(RPC)
      expect(schema.rpc).toBeInstanceOf(Function)
    })

    it('curries request function with schema data', () => {
      schema.rpc('test')
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'rpc/test', 'POST', undefined, {}, undefined)
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiamRvZSIsImV4cCI6MTQ3NTUxNjI1MH0.GYDZV3yM0gqvuEtJmfpplLBXSGYnke_Pvnl0tbKAjB'
      const tokenSchema = schema('/pk-api', token)
      tokenSchema.rpc('test')
      expect(request).toHaveBeenLastCalledWith('/pk-api', token, 'rpc/test', 'POST', undefined, {}, undefined)
    })

    it('provides curried functions as props', async () => {
      await schema.rpc.$ready
      schema.rpc.authenticate({ query: { select: 'id' } }, { user: 'test' })
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'rpc/authenticate', 'POST', { select: 'id' }, {}, { user: 'test' })
    })
  })
})
