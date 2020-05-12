import Vue from 'vue'
import { shallowMount } from '@vue/test-utils'
import Postgrest, { pg } from '@/index'
import ObservableFunction from '@/ObservableFunction'
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
    data: () => ({ pgConfig: { route: 'clients', query: {} } })
  }
  let wrapper

  beforeEach(request.mockClear)
  beforeEach(() => {
    wrapper = shallowMount(Component)
  })
  afterEach(() => wrapper.destroy())

  describe('with pgConfig.route set', () => {
    it('provides pg.get observable function', () => {
      expect(wrapper.vm.pg.get).toBeInstanceOf(ObservableFunction)
    })

    it('pg.get makes request with global default', async () => {
      await wrapper.vm.pg.get()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, {})
    })

    it('pg.get makes request with overrides for apiRoot and token', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'apiRoot', '/pk-api')
      wrapper.vm.$set(wrapper.vm.pgConfig, 'token', 'test')
      await wrapper.vm.pg.get()
      expect(request).toHaveBeenLastCalledWith('/pk-api', 'test', 'clients', 'GET', {}, {})
    })

    it('pg.get passes pgConfig.query', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'query', { 'id.eq': 1, select: ['name'] })
      await wrapper.vm.pg.get()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { 'id.eq': 1, select: ['name'] }, {})
    })

    it('pg.get passes options accept, limit, offset and count', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'accept', 'single')
      wrapper.vm.$set(wrapper.vm.pgConfig, 'limit', 5)
      wrapper.vm.$set(wrapper.vm.pgConfig, 'offset', 10)
      wrapper.vm.$set(wrapper.vm.pgConfig, 'count', 'exact')
      await wrapper.vm.pg.get()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, {
        accept: 'single',
        limit: 5,
        offset: 10,
        count: 'exact'
      })
    })

    it('pg.get returns items array', async () => {
      const ret = await wrapper.vm.pg.get()
      expect(ret).toEqual({
        items: expect.arrayContaining([expect.any(GenericModel)])
      })
      expect(wrapper.vm.pg).toMatchObject({
        items: expect.arrayContaining([expect.any(GenericModel)])
      })
    })

    it('pg.get returns item of type GenericModel when accept=single', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'accept', 'single')
      const ret = await wrapper.vm.pg.get()
      expect(ret).toEqual({
        item: expect.any(GenericModel)
      })
      expect(wrapper.vm.pg).toMatchObject({
        item: expect.any(GenericModel)
      })
    })

    it('pg.get returns data of type String when accept=text', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'accept', 'text')
      const ret = await wrapper.vm.pg.get()
      expect(ret).toEqual({
        data: expect.any(String)
      })
      expect(wrapper.vm.pg).toMatchObject({
        data: expect.any(String)
      })
    })

    it('pg.get returns of type String when accept=binary', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'accept', 'binary')
      const ret = await wrapper.vm.pg.get()
      expect(ret.data.constructor.name).toBe('Blob') // Blob is an internal implementation in node-fetch
      expect(wrapper.vm.pg.data.constructor.name).toBe('Blob')
    })

    it('pg.get returns range object when header set #1', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'limit', 2)
      const ret = await wrapper.vm.pg.get()
      expect(ret).toMatchObject({
        range: {
          totalCount: undefined,
          first: 0,
          last: 1
        }
      })
      expect(wrapper.vm.pg).toMatchObject({
        range: {
          totalCount: undefined,
          first: 0,
          last: 1
        }
      })
    })

    it('pg.get returns range object when header set #2', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'count', 'exact')
      const ret = await wrapper.vm.pg.get()
      expect(ret).toMatchObject({
        range: {
          totalCount: 3,
          first: 0,
          last: undefined
        }
      })
      expect(wrapper.vm.pg).toMatchObject({
        range: {
          totalCount: 3,
          first: 0,
          last: undefined
        }
      })
    })
  })

  describe('reactivity', () => {
    it('does not provide pg.get if pgConfig.route is unset', async () => {
      wrapper.vm.$delete(wrapper.vm.pgConfig, 'route')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.pg.get).toBeUndefined()
      wrapper.vm.$set(wrapper.vm.pgConfig, 'route', 'clients')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.pg.get).toBeInstanceOf(ObservableFunction)
    })

    it('calls pg.get initially when query is set', async () => {
      await wrapper.vm.$nextTick()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, {})
    })

    it('doesn\'t call pg.get initially when query is not set', async () => {
      request.mockClear()
      wrapper = shallowMount({
        render () {},
        mixins: [pg],
        data: () => ({ pgConfig: { route: 'clients' } })
      })
      await wrapper.vm.$nextTick()
      expect(request).not.toHaveBeenCalled()
      await wrapper.vm.pg.get()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, {})
    })

    it('calls pg.get when pgConfig.query changed', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'query', {
        'id.eq': 1
      })
      await wrapper.vm.$nextTick()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { 'id.eq': 1 }, {})
    })

    it('calls pg.get when pgConfig.query changed deep', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'query', {
        or: {
          'id.eq': 1
        }
      })
      await wrapper.vm.$nextTick()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { or: { 'id.eq': 1 } }, {})
      request.mockClear()
      wrapper.vm.$set(wrapper.vm.pgConfig.query.or, 'id.eq', 2)
      await wrapper.vm.$nextTick()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { or: { 'id.eq': 2 } }, {})
    })

    it('calls pg.get when pgConfig.accept changed', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'accept', 'single')
      await wrapper.vm.$nextTick()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { accept: 'single' })
      wrapper.vm.$set(wrapper.vm.pgConfig, 'accept', 'binary')
      await wrapper.vm.$nextTick()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { accept: 'binary' })
    })

    it('calls pg.get when pgConfig.limit changed', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'limit', 2)
      await wrapper.vm.$nextTick()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { limit: 2 })
      wrapper.vm.$set(wrapper.vm.pgConfig, 'limit', 3)
      await wrapper.vm.$nextTick()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { limit: 3 })
    })

    it('calls pg.get when pgConfig.offset changed', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'offset', 1)
      await wrapper.vm.$nextTick()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { offset: 1 })
      wrapper.vm.$set(wrapper.vm.pgConfig, 'offset', 2)
      await wrapper.vm.$nextTick()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { offset: 2 })
    })

    it('calls pg.get when pgConfig.count changed', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'count', 'exact')
      await wrapper.vm.$nextTick()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { count: 'exact' })
      wrapper.vm.$set(wrapper.vm.pgConfig, 'count', 'estimated')
      await wrapper.vm.$nextTick()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { count: 'estimated' })
    })

    it('calls pg.get when pgConfig.apiRoot changed', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'apiRoot', '/pk-api')
      await wrapper.vm.$nextTick()
      expect(request).toHaveBeenLastCalledWith('/pk-api', undefined, 'clients', 'GET', {}, {})
      wrapper.vm.$set(wrapper.vm.pgConfig, 'apiRoot', '/api')
      await wrapper.vm.$nextTick()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, {})
    })

    it('calls pg.get when pgConfig.token changed', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'token', 'test')
      await wrapper.vm.$nextTick()
      expect(request).toHaveBeenLastCalledWith('/api', 'test', 'clients', 'GET', {}, {})
      wrapper.vm.$set(wrapper.vm.pgConfig, 'token', undefined)
      await wrapper.vm.$nextTick()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, {})
    })

    it('calls pg.get when pgConfig.route changed', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'route', 'test')
      await wrapper.vm.$nextTick()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'test', 'GET', {}, {})
    })
  })

  describe('newItem', () => {
    it('is created when pgConfig.newTemplate is set', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'newTemplate', {})
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.pg.newItem).toBeInstanceOf(GenericModel)
    })

    it('is re-created when pgConfig.newTemplate is changed', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'newTemplate', {})
      await wrapper.vm.$nextTick()
      const oldNewItem = wrapper.vm.pg.newItem
      wrapper.vm.$set(wrapper.vm.pgConfig, 'newTemplate', { id: 1 })
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.pg.newItem).toBeInstanceOf(GenericModel)
      expect(wrapper.vm.pg.newItem).not.toBe(oldNewItem)
    })

    it('is removed when pgConfig.newTemplate is unset', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'newTemplate', {})
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.pg.newItem).toBeInstanceOf(GenericModel)
      wrapper.vm.$delete(wrapper.vm.pgConfig, 'newTemplate')
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.pg.newItem).toBeUndefined()
    })

    it('has data set to pgConfig.newTemplate', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'newTemplate', { id: 1, name: 'test' })
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.pg.newItem).toMatchObject({
        id: 1,
        name: 'test'
      })
    })

    it('is not re-created when newItem $isDirty', async () => {
      wrapper.vm.$set(wrapper.vm.pgConfig, 'newTemplate', { id: 1 })
      await wrapper.vm.$nextTick()
      const oldNewItem = wrapper.vm.pg.newItem
      oldNewItem.id = 2
      expect(oldNewItem.$isDirty).toBe(true)
      wrapper.vm.$set(wrapper.vm.pgConfig, 'newTemplate', { id: 3, name: 'test' })
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.pg.newItem).toBeInstanceOf(GenericModel)
      expect(wrapper.vm.pg.newItem).toBe(oldNewItem)
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
            'pg.get.hasError' (hasError) {
              expect(hasError).toBe(true)
              resolve(w)
            }
          }
        }
        const w = shallowMount(Component)
      })
    })
  })
})
