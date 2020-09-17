import Vue from 'vue'
import { shallowMount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Postgrest, { pg } from '@/index'
import GenericCollection from '@/GenericCollection'
import GenericModel from '@/GenericModel'

// mock request function with actual call included (spy)
import request from '@/request'
jest.mock('@/request', () => {
  const { default: req } = jest.requireActual('@/request')
  return {
    __esModule: true,
    default: jest.fn(req)
  }
})

Vue.use(Postgrest, {
  apiRoot: '/api'
})

describe('Mixin', () => {
  const Component = {
    render () {},
    mixins: [pg],
    props: {
      single: {
        type: Boolean,
        default: false
      }
    },
    data () {
      return { pgConfig: { route: 'clients', single: this.single } }
    }
  }
  let wrapper

  beforeEach(request.mockClear)
  afterEach(() => wrapper.destroy())

  describe('with pgConfig.single = true', () => {
    beforeEach(() => {
      wrapper = shallowMount(Component, { propsData: { single: true } })
    })

    it('provides pg of type GenericModel', () => {
      expect(wrapper.vm.pg).toBeInstanceOf(GenericModel)
    })

    it('pg does not make a call without query', async () => {
      await flushPromises()
      expect(request).not.toHaveBeenCalled()
    })

    it('pg has proper route, query and select parameters', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'query', {
        'id.eq': 1,
        select: 'id'
      })
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { 'id.eq': 1, select: 'id' }, { accept: 'single', signal: expect.any(AbortSignal) })
    })

    it('calls $get when pgConfig.query changed deep', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'query', {
        and: {
          'id.eq': 1
        }
      })
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { and: { 'id.eq': 1 } }, {
        accept: 'single',
        signal: expect.any(AbortSignal)
      })
      request.mockClear()
      wrapper.vm.$set(wrapper.vm.pgConfig.query.and, 'id.eq', 2)
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { and: { 'id.eq': 2 } }, { accept: 'single', signal: expect.any(AbortSignal) })
    })

    it('calls $get when pgConfig.apiRoot changed', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'query', {})
      await flushPromises()
      request.mockClear()
      wrapper.vm.$set(wrapper.vm.pgConfig, 'apiRoot', '/pk-api')
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/pk-api', undefined, 'clients', 'GET', {}, { accept: 'single', signal: expect.any(AbortSignal) })
      wrapper.vm.$set(wrapper.vm.pgConfig, 'apiRoot', '/api')
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { accept: 'single', signal: expect.any(AbortSignal) })
    })

    it('calls $get when pgConfig.token changed', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'query', {})
      await flushPromises()
      request.mockClear()
      wrapper.vm.$set(wrapper.vm.pgConfig, 'token', 'test')
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', 'test', 'clients', 'GET', {}, { accept: 'single', signal: expect.any(AbortSignal) })
      wrapper.vm.$set(wrapper.vm.pgConfig, 'token', undefined)
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { accept: 'single', signal: expect.any(AbortSignal) })
    })

    it('calls $get when pgConfig.route changed', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'query', {})
      await flushPromises()
      request.mockClear()
      wrapper.vm.$set(wrapper.vm.pgConfig, 'route', 'test')
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'test', 'GET', {}, { accept: 'single', signal: expect.any(AbortSignal) })
    })
  })

  describe('with pgConfig.single = false', () => {
    beforeEach(() => {
      wrapper = shallowMount(Component)
    })

    it('provides pg of type GenericCollection', () => {
      expect(wrapper.vm.pg).toBeInstanceOf(GenericCollection)
    })

    it('pg does make a call without query', async () => {
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { signal: expect.any(AbortSignal) })
    })

    it('pg has proper route and query parameters', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'query', {
        'id.gt': 1,
        select: 'id'
      })
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { 'id.gt': 1, select: 'id' }, { signal: expect.any(AbortSignal) })
    })

    it('calls $get when pgConfig.query changed deep', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'query', {
        or: {
          'id.eq': 1
        }
      })
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { or: { 'id.eq': 1 } }, { signal: expect.any(AbortSignal) })
      request.mockClear()
      wrapper.vm.$set(wrapper.vm.pgConfig.query.or, 'id.eq', 2)
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { or: { 'id.eq': 2 } }, { signal: expect.any(AbortSignal) })
    })

    it('calls $get when pgConfig.limit changed', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'limit', 2)
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { limit: 2, signal: expect.any(AbortSignal) })
      wrapper.vm.$set(wrapper.vm.pgConfig, 'limit', 3)
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { limit: 3, signal: expect.any(AbortSignal) })
    })

    it('calls $get when pgConfig.offset changed', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'offset', 1)
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { offset: 1, signal: expect.any(AbortSignal) })
      wrapper.vm.$set(wrapper.vm.pgConfig, 'offset', 2)
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { offset: 2, signal: expect.any(AbortSignal) })
    })

    it('calls $get when pgConfig.count changed', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'count', 'exact')
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { count: 'exact', signal: expect.any(AbortSignal) })
      wrapper.vm.$set(wrapper.vm.pgConfig, 'count', 'estimated')
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { count: 'estimated', signal: expect.any(AbortSignal) })
    })

    it('calls $get when pgConfig.apiRoot changed', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'apiRoot', '/pk-api')
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/pk-api', undefined, 'clients', 'GET', {}, { signal: expect.any(AbortSignal) })
      wrapper.vm.$set(wrapper.vm.pgConfig, 'apiRoot', '/api')
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { signal: expect.any(AbortSignal) })
    })

    it('calls $get when pgConfig.token changed', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'token', 'test')
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', 'test', 'clients', 'GET', {}, { signal: expect.any(AbortSignal) })
      wrapper.vm.$set(wrapper.vm.pgConfig, 'token', undefined)
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { signal: expect.any(AbortSignal) })
    })

    it('calls $get when pgConfig.route changed', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'route', 'test')
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'test', 'GET', {}, { signal: expect.any(AbortSignal) })
    })
  })

  describe('error handling', () => {
    it('calls "onError" hook when using expired-token', async () => {
      wrapper = await new Promise(resolve => {
        const Component = {
          render () {},
          mixins: [pg],
          data: () => ({ pgConfig: { route: 'clients', query: {}, token: 'expired-token' } }),
          onError: e => {
            expect(e).toMatchObject({ error: 'invalid_token', error_description: 'JWT expired' })
            resolve(w)
          }
        }
        const w = shallowMount(Component)
      })
    })

    it('calls "onError" hook for request error', async () => {
      wrapper = await new Promise(resolve => {
        const Component = {
          render () {},
          mixins: [pg],
          data: () => ({ pgConfig: { route: '404', query: {} } }),
          onError: e => {
            expect(e).toMatchObject({ status: 404 })
            resolve(w)
          }
        }
        const w = shallowMount(Component)
      })
    })

    it('does not throw unexpectedly without onError hook', async () => {
      wrapper = await new Promise(resolve => {
        const Component = {
          render () {},
          mixins: [pg],
          data: () => ({ pgConfig: { route: 'clients', query: {}, token: 'expired-token' } }),
          watch: {
            'pg.$get.hasError' (hasError) {
              expect(hasError).toBe(true)
              resolve(w)
            }
          }
        }
        const w = shallowMount(Component)
      })
    })
  })

  describe('reactivity', () => {
    beforeEach(() => {
      wrapper = shallowMount(Component)
    })

    it('keeps pg when single is changed to same semantics', async () => {
      await flushPromises()
      const pgBefore = wrapper.vm.pg
      wrapper.vm.$set(wrapper.vm.pgConfig, 'single', undefined)
      await flushPromises()
      expect(wrapper.vm.pg).toBe(pgBefore)
    })
  })
})
