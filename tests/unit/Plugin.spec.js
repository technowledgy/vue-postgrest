import { createLocalVue } from '@vue/test-utils'
import Plugin from '@/index'
import Schema, { resetSchemaCache } from '@/Schema'
import Route from '@/Route'

describe('Plugin', () => {
  describe('Plugin installation', () => {
    it('registers a global component', () => {
      const localVue = createLocalVue()
      expect(localVue.options.components.postgrest).toBeUndefined()
      localVue.use(Plugin, {
        apiRoot: '/api'
      })
      expect(localVue.options.components.postgrest).toBeTruthy()
    })

    describe('$postgrest', () => {
      resetSchemaCache()
      fetch.mockClear()
      const localVue = createLocalVue()
      localVue.use(Plugin, {
        apiRoot: '/api'
      })
      beforeAll(() => localVue.prototype.$postgrest.$ready)

      it('registers apiRoot Schema as $postgrest on the Vue prototype', async () => {
        expect(localVue.prototype.$postgrest).toBeInstanceOf(Schema)
        expect(fetch).toHaveBeenCalledWith('http://localhost/api', expect.anything())
      })

      it('exposes routes', () => {
        expect(localVue.prototype.$postgrest.clients).toBeInstanceOf(Route)
      })

      it('allows request', async () => {
        fetch.mockClear()
        const resp = await localVue.prototype.$postgrest.clients.get()
        const body = await resp.json()
        expect(fetch).toHaveBeenCalledWith('http://localhost/api/clients', expect.anything())
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
  })
})
