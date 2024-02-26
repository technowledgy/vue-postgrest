import { createLocalVue } from '@vue/test-utils'
import Plugin, { setDefaultToken } from '@/index'
import Schema, { resetSchemaCache } from '@/Schema'
import Route from '@/Route'

describe('Plugin', () => {
  let localVue

  beforeEach(() => {
    localVue = createLocalVue()
  })

  afterEach(() => {
    fetch.mockClear()
    resetSchemaCache()
  })

  describe('Plugin installation', () => {
    it('registers a global component', () => {
      expect(localVue.options.components.postgrest).toBeUndefined()
      localVue.use(Plugin)
      expect(localVue.options.components.postgrest).toBeTruthy()
    })

    describe('$postgrest', () => {
      beforeEach(async () => {
        localVue.use(Plugin, {
          apiRoot: '/api',
          headers: {
            Prefer: 'timezone=Europe/Berlin'
          }
        })
        await localVue.prototype.$postgrest.$ready
      })

      it('registers apiRoot Schema as $postgrest on the Vue prototype', async () => {
        expect(localVue.prototype.$postgrest).toBeInstanceOf(Schema)
        expect(fetch).toHaveBeenCalledWith('http://localhost/api', expect.anything())
      })

      it('exposes routes', () => {
        expect(localVue.prototype.$postgrest.clients).toBeInstanceOf(Route)
      })

      it('allows request', async () => {
        const resp = await localVue.prototype.$postgrest.clients.get()
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
        localVue.use(Plugin, {
          apiRoot: '/api'
        })
        await localVue.prototype.$postgrest.$ready
        await localVue.prototype.$postgrest.clients.get()
        expect(fetch).toHaveBeenLastCalledWith('http://localhost/api/clients', expect.objectContaining({
          headers: new Headers({
            Accept: 'application/json'
          })
        }))

        setDefaultToken('token')
        await localVue.prototype.$postgrest.$ready
        await localVue.prototype.$postgrest.clients.get()
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
