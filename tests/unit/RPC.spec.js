import request from 'superagent'
import config from './MockApi.config'
import mock from 'superagent-mock'

import { shallowMount } from '@vue/test-utils'
import Postgrest from '@/Postgrest'

const requestLogger = jest.fn((log) => {})
const superagentMock = mock(request, config({
  data: {
    '/rpc/rpc-test': {
      get: 'test'
    }
  }
}), requestLogger)

describe('RPC', () => {
  afterAll(() => {
    superagentMock.unset()
  })

  beforeEach(() => {
    requestLogger.mockReset()
  })

  it('is wrapped in utility function and observable', () => {
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/'
      },
      slots: { default: '<div />' }
    })
    expect(typeof wrapper.vm.rpc).toBe('function')
    expect(typeof wrapper.vm.rpc.__ob__).toBe('object')
    expect(typeof wrapper.vm.rpc.call).toBe('function') // backwards compatibility
    expect(typeof wrapper.vm.rpc.isPending).toBe('boolean')
    expect(typeof wrapper.vm.rpc.hasError).toBe('boolean')
  })

  it('sends a request with the specified method and arguments to the rpc route', async () => {
    expect.assertions(6)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/'
      },
      slots: { default: '<div />' }
    })
    const functionParams = {
      a: 1,
      b: 2
    }
    await wrapper.vm.rpc.call('rpc-test', { method: 'POST' }, functionParams)
    expect(requestLogger.mock.calls.filter(c => c[0].url === 'http://localhost/api/rpc/rpc-test').length).toBe(1)
    expect(requestLogger.mock.calls.filter(c => c[0].url === 'http://localhost/api/rpc/rpc-test')[0][0].method).toBe('POST')
    expect(requestLogger.mock.calls.filter(c => c[0].url === 'http://localhost/api/rpc/rpc-test')[0][0].data).toEqual(functionParams)

    await wrapper.vm.rpc.call('rpc-test', { method: 'GET' }, functionParams)
    expect(requestLogger.mock.calls.filter(c => c[0].url.startsWith('http://localhost/api/rpc/rpc-test')).length).toBe(2)
    expect(requestLogger.mock.calls.filter(c => c[0].url.startsWith('http://localhost/api/rpc/rpc-test'))[1][0].method).toBe('GET')
    expect(requestLogger.mock.calls.filter(c => c[0].url.startsWith('http://localhost/api/rpc/rpc-test'))[1][0].url).toEqual('http://localhost/api/rpc/rpc-test?a=1&b=2')
    wrapper.destroy()
  })

  it('does not send arguments when not specified', async () => {
    expect.assertions(5)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/'
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.rpc.call('rpc-test', { method: 'POST' })
    expect(requestLogger.mock.calls.filter(c => c[0].url === 'http://localhost/api/rpc/rpc-test').length).toBe(1)
    expect(requestLogger.mock.calls.filter(c => c[0].url === 'http://localhost/api/rpc/rpc-test')[0][0].method).toBe('POST')
    expect(requestLogger.mock.calls.filter(c => c[0].url === 'http://localhost/api/rpc/rpc-test')[0][0].data).toBe(undefined)

    await wrapper.vm.rpc.call('rpc-test', { method: 'GET' })
    expect(requestLogger.mock.calls.filter(c => c[0].url === 'http://localhost/api/rpc/rpc-test').length).toBe(2)
    expect(requestLogger.mock.calls.filter(c => c[0].url === 'http://localhost/api/rpc/rpc-test')[1][0].method).toBe('GET')
    wrapper.destroy()
  })

  it('defaults to method "POST"', async () => {
    expect.assertions(2)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/'
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.rpc.call('rpc-test')
    expect(requestLogger.mock.calls.filter(c => c[0].url === 'http://localhost/api/rpc/rpc-test').length).toBe(1)
    expect(requestLogger.mock.calls.filter(c => c[0].url === 'http://localhost/api/rpc/rpc-test')[0][0].method).toBe('POST')
    wrapper.destroy()
  })

  it('sets correct header for option accept', async () => {
    expect.assertions(4)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/'
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.rpc.call('rpc-test', { accept: 'binary' })
    expect(requestLogger.mock.calls.filter(c => c[0].url === 'http://localhost/api/rpc/rpc-test')[0][0].headers.accept).toBe('application/octet-stream')
    await wrapper.vm.rpc.call('rpc-test', { accept: 'single' })
    expect(requestLogger.mock.calls.filter(c => c[0].url === 'http://localhost/api/rpc/rpc-test')[1][0].headers.accept).toBe('application/vnd.pgrst.object+json')
    await wrapper.vm.rpc.call('rpc-test')
    expect(requestLogger.mock.calls.filter(c => c[0].url === 'http://localhost/api/rpc/rpc-test')[2][0].headers.accept).toBe('application/json')
    await wrapper.vm.rpc.call('rpc-test', { accept: 'custom-accept-header' })
    expect(requestLogger.mock.calls.filter(c => c[0].url === 'http://localhost/api/rpc/rpc-test')[3][0].headers.accept).toBe('custom-accept-header')
    wrapper.destroy()
  })

  it('correctly passes "headers" option', async () => {
    expect.assertions(1)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/'
      },
      slots: { default: '<div />' }
    })
    const headers = { accept: 'custom-accept-header', 'x-header': 'custom-x-header' }
    await wrapper.vm.rpc.call('rpc-test', { accept: 'single', headers })
    expect(requestLogger.mock.calls.filter(c => c[0].url === 'http://localhost/api/rpc/rpc-test')[0][0].headers).toEqual(headers)
    wrapper.destroy()
  })

  it('throws if method is neither "POST" nor "GET"', async () => {
    expect.assertions(1)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/'
      },
      slots: { default: '<div />' }
    })
    await expect(wrapper.vm.rpc.call('rpc-test', { method: 'PATCH' })).rejects.toThrow()
    wrapper.destroy()
  })
})
