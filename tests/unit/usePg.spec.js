import { reactive, ref } from 'vue'
import { shallowMount } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Postgrest, { usePg } from '@/index'
import GenericCollection from '@/GenericCollection'

// mock request function with actual call included (spy)
import request from '@/request'
jest.mock('@/request', () => {
  const { default: req } = jest.requireActual('@/request')
  return {
    __esModule: true,
    default: jest.fn(req),
    setDefaultHeaders: jest.fn()
  }
})

describe('Composition API', () => {
  let wrapper

  beforeEach(request.mockClear)
  afterEach(() => wrapper?.unmount())

  describe('with pgConfig unset initially', () => {
    it('does not make a request until pgConfig is set', async () => {
      let pgConfig
      wrapper = shallowMount({
        render () {},
        setup () {
          pgConfig = ref(undefined)
          usePg(pgConfig)
          return {}
        }
      }, {
        global: {
          plugins: [[Postgrest, { apiRoot: '/api' }]]
        }
      })

      await flushPromises()
      expect(request).not.toHaveBeenCalled()

      pgConfig.value = { route: 'clients' }
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { signal: expect.any(AbortSignal) })
    })
  })

  describe('with pgConfig.single = true', () => {
    it('provides pg of type GenericModel', async () => {
      wrapper = shallowMount({
        render () {},
        setup () {
          const pgConfig = reactive({ route: 'clients', single: true })
          return usePg(pgConfig)
        }
      }, {
        global: {
          plugins: [[Postgrest, { apiRoot: '/api' }]]
        }
      })

      await flushPromises()
      expect(wrapper.vm.pg.constructor.name).toBe('GenericModel')
    })

    it('does not call without query', async () => {
      wrapper = shallowMount({
        render () {},
        setup () {
          return usePg(reactive({ route: 'clients', single: true }))
        }
      }, {
        global: {
          plugins: [[Postgrest, { apiRoot: '/api' }]]
        }
      })

      await flushPromises()
      expect(request).not.toHaveBeenCalled()
    })

    it('reacts to query/apiRoot/token/route updates', async () => {
      let pgConfig
      wrapper = shallowMount({
        render () {},
        setup () {
          pgConfig = reactive({ route: 'clients', single: true, query: {} })
          return usePg(pgConfig)
        }
      }, {
        global: {
          plugins: [[Postgrest, { apiRoot: '/api' }]]
        }
      })

      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { accept: 'single', signal: expect.any(AbortSignal) })

      request.mockClear()
      pgConfig.query.and = { 'id.eq': 1 }
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { and: { 'id.eq': 1 } }, { accept: 'single', signal: expect.any(AbortSignal) })

      request.mockClear()
      pgConfig.query.and['id.eq'] = 2
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { and: { 'id.eq': 2 } }, { accept: 'single', signal: expect.any(AbortSignal) })

      pgConfig.apiRoot = '/pk-api'
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/pk-api', undefined, 'clients', 'GET', { and: { 'id.eq': 2 } }, { accept: 'single', signal: expect.any(AbortSignal) })

      pgConfig.token = 'test'
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/pk-api', 'test', 'clients', 'GET', { and: { 'id.eq': 2 } }, { accept: 'single', signal: expect.any(AbortSignal) })

      pgConfig.route = 'test'
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/pk-api', 'test', 'test', 'GET', { and: { 'id.eq': 2 } }, { accept: 'single', signal: expect.any(AbortSignal) })
    })
  })

  describe('with pgConfig.single = false', () => {
    it('provides pg of type GenericCollection and loads by default', async () => {
      wrapper = shallowMount({
        render () {},
        setup () {
          return usePg(reactive({ route: 'clients' }))
        }
      }, {
        global: {
          plugins: [[Postgrest, { apiRoot: '/api' }]]
        }
      })

      await flushPromises()
      expect(wrapper.vm.pg).toBeInstanceOf(GenericCollection)
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { signal: expect.any(AbortSignal) })
    })

    it('reacts to query/limit/offset/count/apiRoot/token/route changes', async () => {
      let pgConfig
      wrapper = shallowMount({
        render () {},
        setup () {
          pgConfig = reactive({ route: 'clients' })
          return usePg(pgConfig)
        }
      }, {
        global: {
          plugins: [[Postgrest, { apiRoot: '/api' }]]
        }
      })

      await flushPromises()
      request.mockClear()

      pgConfig.query = { or: { 'id.eq': 1 } }
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { or: { 'id.eq': 1 } }, { signal: expect.any(AbortSignal) })

      pgConfig.query.or['id.eq'] = 2
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { or: { 'id.eq': 2 } }, { signal: expect.any(AbortSignal) })

      pgConfig.limit = 2
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { or: { 'id.eq': 2 } }, { limit: 2, signal: expect.any(AbortSignal) })

      pgConfig.offset = 1
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { or: { 'id.eq': 2 } }, { limit: 2, offset: 1, signal: expect.any(AbortSignal) })

      pgConfig.count = 'exact'
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { or: { 'id.eq': 2 } }, { limit: 2, offset: 1, count: 'exact', signal: expect.any(AbortSignal) })

      pgConfig.apiRoot = '/pk-api'
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/pk-api', undefined, 'clients', 'GET', { or: { 'id.eq': 2 } }, { limit: 2, offset: 1, count: 'exact', signal: expect.any(AbortSignal) })

      pgConfig.token = 'test'
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/pk-api', 'test', 'clients', 'GET', { or: { 'id.eq': 2 } }, { limit: 2, offset: 1, count: 'exact', signal: expect.any(AbortSignal) })

      pgConfig.route = 'test'
      await flushPromises()
      expect(request).toHaveBeenLastCalledWith('/pk-api', 'test', 'test', 'GET', { or: { 'id.eq': 2 } }, { limit: 2, offset: 1, count: 'exact', signal: expect.any(AbortSignal) })
    })
  })

  describe('error handling', () => {
    it('calls onError on auth errors', async () => {
      const onError = jest.fn()
      wrapper = shallowMount({
        render () {},
        setup () {
          const pgConfig = reactive({ route: 'clients', query: {}, token: 'expired-token' })
          usePg(pgConfig, { onError })
          return {}
        }
      }, {
        global: {
          plugins: [[Postgrest, { apiRoot: '/api' }]]
        }
      })

      await flushPromises()
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ error: 'invalid_token' }))
    })

    it('does not throw unexpectedly without onError hook', async () => {
      let pg
      wrapper = shallowMount({
        render () {},
        setup () {
          const pgConfig = reactive({ route: 'clients', query: {}, token: 'expired-token' })
          const state = usePg(pgConfig)
          pg = state.pg
          return {}
        }
      }, {
        global: {
          plugins: [[Postgrest, { apiRoot: '/api' }]]
        }
      })

      await flushPromises()
      expect(pg.value.$get.hasError).toBe(true)
    })
  })

  describe('reactivity', () => {
    it('keeps pg when single changes to same semantics', async () => {
      let pg
      let pgConfig
      wrapper = shallowMount({
        render () {},
        setup () {
          pgConfig = reactive({ route: 'clients', single: false })
          const state = usePg(pgConfig)
          pg = state.pg
          return {}
        }
      }, {
        global: {
          plugins: [[Postgrest, { apiRoot: '/api' }]]
        }
      })

      await flushPromises()
      const before = pg.value
      pgConfig.single = undefined
      await flushPromises()
      expect(pg.value).toBe(before)
    })
  })
})
