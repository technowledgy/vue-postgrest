import { createApp } from 'vue'
import Plugin, { setDefaultToken } from '@/index'
import Schema, { resetSchemaCache } from '@/Schema'
import Route from '@/Route'

describe('Plugin', () => {
  let app

  beforeEach(() => {
    app = createApp()
  })

  afterEach(() => {
    fetch.mockClear()
    resetSchemaCache()
  })

  describe('Plugin installation', () => {
    it('registers a global component', () => {
      expect(app._context.components.postgrest).toBeUndefined()
      app.use(Plugin)
      expect(app._context.components.postgrest).toBeTruthy()
    })

    describe('$postgrest', () => {
      beforeEach(async () => {
        app.use(Plugin, {
          apiRoot: '/api',
          headers: {
            Prefer: 'timezone=Europe/Berlin'
          }
        })
        await app._context.config.globalProperties.$postgrest.$ready
      })

      it('registers apiRoot Schema as $postgrest on the Vue prototype', async () => {
        expect(app._context.config.globalProperties.$postgrest).toBeInstanceOf(Schema)
        expect(fetch).toHaveBeenCalledWith('http://localhost/api', expect.anything())
      })

      it('exposes routes', () => {
        expect(app._context.config.globalProperties.$postgrest.clients).toBeInstanceOf(Route)
      })

      it('allows request', async () => {
        const resp = await app._context.config.globalProperties.$postgrest.clients.get()
        const body = await resp.json()
        expect(fetch).toHaveBeenCalledWith('http://localhost/api/clients', expect.objectContaining({
          headers: new Headers({
            Accept: 'application/json',
            Prefer: 'timezone=Europe/Berlin'
          })
        }))
        expect(body).toEqual([
          {
            id: 1,
            name: 'Test Client 1'
          },
          {
            id: 2,
            name: 'Test Client 2'
          },
          {
            id: 3,
            name: 'Test Client 3'
          }
        ])
      })
    })

    describe('setDefaultToken', () => {
      it('uses new default token', async () => {
        app.use(Plugin, {
          apiRoot: '/api'
        })
        await app._context.config.globalProperties.$postgrest.$ready
        await app._context.config.globalProperties.$postgrest.clients.get()
        expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
          headers: new Headers({
            Accept: 'application/json'
          })
        }))

        setDefaultToken('token')
        await app._context.config.globalProperties.$postgrest.$ready
        await app._context.config.globalProperties.$postgrest.clients.get()
        expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
          headers: new Headers({
            Accept: 'application/json',
            Authorization: 'Bearer token'
          })
        }))
      })
    })
  })
})
