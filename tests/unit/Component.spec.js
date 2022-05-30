import Vue from 'vue'
import Plugin from '@/Plugin'
import { shallowMount } from '@vue/test-utils'
import Postgrest from '@/Postgrest'
import GenericModel from '@/GenericModel'
import ObservableFunction from '@/ObservableFunction'
import { AuthError, FetchError } from '@/index'

Vue.use(Plugin, {
  apiRoot: '/api'
})

function createComponent (props, cb) {
  const render = jest.fn(cb)
  const wrapper = shallowMount(Postgrest, {
    propsData: props,
    listeners: {
      /* eslint-disable n/no-callback-literal */
      error: evt => cb('error', evt)
    },
    scopedSlots: {
      default: render
    }
  })
  return {
    render,
    wrapper
  }
}

describe('Component', () => {
  let render
  let wrapper
  // fallback for tests that don't set wrapper
  beforeEach(() => {
    wrapper = {
      destroy () {}
    }
  })
  afterEach(() => wrapper.destroy())

  it('registers component', () => {
    expect(() => createComponent({ route: 'clients' })).not.toThrow()
  })

  describe('Slot scope', () => {
    it('provides observable $get function', () => {
      ({ render, wrapper } = createComponent({ route: 'clients' }))
      expect(render.mock.calls[0][0].$get).toBeInstanceOf(ObservableFunction)
    })

    it('provides GenericCollection if single is not set', async () => {
      ({ render, wrapper } = await new Promise(resolve => {
        const cc = createComponent({ route: 'clients', query: {} }, async (items) => {
          if (!items.$get.isPending) resolve(cc)
        })
      }))
      // checking for Array here because Vue 2.x reactivity doesn't allow us to expose GenericCollection as the true prototype
      expect(render).toHaveBeenCalledWith(expect.any(Array))
    })

    it('provides GenericModel if single is true', async () => {
      ({ render, wrapper } = await new Promise(resolve => {
        const cc = createComponent({ route: 'clients', query: {}, single: true }, async (item) => {
          if (!item.$get.isPending) resolve(cc)
        })
      }))
      expect(render).toHaveBeenCalledWith(expect.any(GenericModel))
    })

    it('provides $range if available', async () => {
      ({ render, wrapper } = await new Promise(resolve => {
        const cc = createComponent({ route: 'clients', query: {}, limit: 2 }, async (items) => {
          if (!items.$get.isPending) resolve(cc)
        })
      }))
      expect(render.mock.calls[2][0].$range).toMatchObject({
        totalCount: undefined,
        first: 0,
        last: 1
      })
    })
  })

  describe('error handling', () => {
    it('emits "error" with "invalid_token" when using expired-token', async () => {
      ({ render, wrapper } = await new Promise(resolve => {
        const cc = createComponent({ route: 'clients', query: {}, token: 'expired-token' }, (evt, err) => {
          if (typeof evt === 'string') {
            expect(evt).toBe('error')
            expect(err).toBeInstanceOf(AuthError)
            expect(err).toMatchObject({ error: 'invalid_token', error_description: 'JWT expired' })
            resolve(cc)
          }
        })
      }))
    })

    it('emits "error" with status "404" when failing with 404', async () => {
      ({ render, wrapper } = await new Promise(resolve => {
        const cc = createComponent({ route: '404', query: {} }, (evt, err) => {
          if (typeof evt === 'string') {
            expect(evt).toBe('error')
            expect(err).toBeInstanceOf(FetchError)
            expect(err).toMatchObject({ status: 404 })
            resolve(cc)
          }
        })
      }))
    })
  })
})
