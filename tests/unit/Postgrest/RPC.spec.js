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

  it('sends a request with the specified method and arguments to the rpc route', async () => {
    expect.assertions(6)
    const postgrest = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/'
      },
      slots: { default: '<div />' }
    })
    const functionParams = {
      a: 1,
      b: 2
    }
    await postgrest.vm.rpc('rpc-test', { method: 'POST', params: functionParams })
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test').length).toBe(1)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test')[0][0].method).toBe('POST')
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test')[0][0].data).toEqual(functionParams)

    await postgrest.vm.rpc('rpc-test', { method: 'GET', params: functionParams })
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test').length).toBe(2)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test')[1][0].method).toBe('GET')
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test')[1][0].data).toEqual(functionParams)
  })

  it('does not send arguments when not specified', async () => {
    expect.assertions(3)
    const postgrest = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/'
      },
      slots: { default: '<div />' }
    })
    await postgrest.vm.rpc('rpc-test', { method: 'POST' })
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test').length).toBe(1)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test')[0][0].method).toBe('POST')
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test')[0][0].data).toBe(undefined)
  })

  it('defaults to method "POST"', async () => {
    expect.assertions(2)
    const postgrest = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/'
      },
      slots: { default: '<div />' }
    })
    await postgrest.vm.rpc('rpc-test')
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test').length).toBe(1)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test')[0][0].method).toBe('POST')
  })

  it('sets correct header for option "binary"', async () => {
    expect.assertions(3)
    const postgrest = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/'
      },
      slots: { default: '<div />' }
    })
    await postgrest.vm.rpc('rpc-test', { binary: true })
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test').length).toBe(1)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test')[0][0].method).toBe('POST')
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test')[0][0].headers.accept).toBe('application/octet-stream')
  })

  it('throws if method is neither "POST" nor "GET"', async () => {
    expect.assertions(1)
    const postgrest = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/'
      },
      slots: { default: '<div />' }
    })
    await expect(postgrest.vm.rpc('rpc-test', { method: 'PATCH' })).rejects.toThrow()
  })
})
