import Vue from 'vue'
import Plugin from '@/Plugin'
import { shallowMount } from '@vue/test-utils'
import Postgrest from '@/Postgrest'
import GenericModel from '@/GenericModel'
import ObservableFunction from '@/ObservableFunction'

Vue.use(Plugin, {
  apiRoot: '/api'
})

function createComponent (props, cb) {
  const render = jest.fn(cb)
  const wrapper = shallowMount(Postgrest, {
    propsData: props,
    listeners: {
      /* eslint-disable standard/no-callback-literal */
      'token-error': evt => cb('token-error', evt),
      'get-error': evt => cb('get-error', evt)
      /* eslint-enable standard/no-callback-literal */
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
    it('provides observable get function if prop route is set', () => {
      ({ render, wrapper } = createComponent({ route: 'clients' }))
      expect(render).toHaveBeenCalledWith(expect.objectContaining({
        get: expect.any(ObservableFunction)
      }))
    })

    it('provides items if accept is not set', async () => {
      ({ render, wrapper } = await new Promise(resolve => {
        const cc = createComponent({ route: 'clients' }, scope => {
          if (scope.items) resolve(cc)
        })
      }))
      expect(render).toHaveBeenCalledWith(expect.objectContaining({
        items: expect.arrayContaining([expect.any(GenericModel)])
      }))
    })

    it('provides item if accept is "single"', async () => {
      ({ render, wrapper } = await new Promise(resolve => {
        const cc = createComponent({ route: 'clients', accept: 'single' }, scope => {
          if (scope.item) resolve(cc)
        })
      }))
      expect(render).toHaveBeenCalledWith(expect.objectContaining({
        item: expect.any(GenericModel)
      }))
    })

    it('provides data if accept is "text"', async () => {
      ({ render, wrapper } = await new Promise(resolve => {
        const cc = createComponent({ route: 'clients', accept: 'text' }, scope => {
          if (scope.data) resolve(cc)
        })
      }))
      expect(render).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.any(String)
      }))
    })

    it('provides data if accept is "binary"', async () => {
      ({ render, wrapper } = await new Promise(resolve => {
        const cc = createComponent({ route: 'clients', accept: 'binary' }, scope => {
          if (scope.data) resolve(cc)
        })
      }))
      expect(render).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.anything() // can't match Blob properly, because it's internal to node-fetch
      }))
    })

    it('provides range if available', async () => {
      ({ render, wrapper } = await new Promise(resolve => {
        const cc = createComponent({ route: 'clients', limit: 2 }, scope => {
          if (scope.range) resolve(cc)
        })
      }))
      expect(render).toHaveBeenCalledWith(expect.objectContaining({
        range: expect.any(Object)
      }))
    })

    it('does not provide newItem if "newTemplate" is not set', async () => {
      ({ render, wrapper } = createComponent({ route: 'clients' }))
      expect(render).toHaveBeenCalledWith(expect.not.objectContaining({
        newItem: expect.any(GenericModel)
      }))
    })

    it('provides newItem if "newTemplate" is set', async () => {
      ({ render, wrapper } = createComponent({ route: 'clients', newTemplate: {} }))
      expect(render).toHaveBeenCalledWith(expect.objectContaining({
        newItem: expect.any(GenericModel)
      }))
    })
  })

  describe('error handling', () => {
    it('emits "token-error" when using expired-token', async () => {
      ({ render, wrapper } = await new Promise(resolve => {
        const cc = createComponent({ route: 'clients', token: 'expired-token' }, (evt, err) => {
          if (typeof evt === 'string') {
            expect(evt).toBe('token-error')
            expect(err).toMatchObject({ error: 'invalid_token', error_description: 'JWT expired' })
            resolve(cc)
          }
        })
      }))
    })

    it('emits "token-error" when using expired-token', async () => {
      ({ render, wrapper } = await new Promise(resolve => {
        const cc = createComponent({ route: '404' }, (evt, err) => {
          if (typeof evt === 'string') {
            expect(evt).toBe('get-error')
            expect(err).toMatchObject({ status: 404 })
            resolve(cc)
          }
        })
      }))
    })
  })
})
