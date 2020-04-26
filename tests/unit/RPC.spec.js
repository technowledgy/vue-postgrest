import { shallowMount } from '@vue/test-utils'
import Postgrest from '@/Postgrest'

fetch.mockResponse(async req => {
  if (['http://localhost/api'].includes(req.url)) {
    return {
      body: JSON.stringify({
        definitions: {}
      }),
      init: {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/openapi+json'
        }
      }
    }
  } else {
    return {
      body: 'test',
      init: {
        status: 200,
        statusText: 'OK'
      }
    }
  }
})

describe('RPC', () => {
  beforeEach(() => {
    // just reset .mock data, but not .mockResponse
    fetch.mockClear()
  })

  it('is wrapped in utility function and observable', () => {
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api'
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
    expect.assertions(5)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api'
      },
      slots: { default: '<div />' }
    })
    const functionParams = {
      a: 1,
      b: 2
    }
    await wrapper.vm.rpc.call('rpc-test', { method: 'POST' }, functionParams)
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/rpc/rpc-test')).toBeTruthy()
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/rpc/rpc-test')[1].method).toBe('POST')
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/rpc/rpc-test')[1].body).toEqual(functionParams)
    fetch.mockClear()

    await wrapper.vm.rpc.call('rpc-test', { method: 'GET' }, functionParams)
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/rpc/rpc-test?a=1&b=2')).toBeTruthy()
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/rpc/rpc-test?a=1&b=2')[1].method).toBe('GET')
    wrapper.destroy()
  })

  it('does not send arguments when not specified', async () => {
    expect.assertions(5)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api'
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.rpc.call('rpc-test', { method: 'POST' })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/rpc/rpc-test')).toBeTruthy()
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/rpc/rpc-test')[1].method).toBe('POST')
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/rpc/rpc-test')[1].body).toBe(undefined)
    fetch.mockClear()

    await wrapper.vm.rpc.call('rpc-test', { method: 'GET' })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/rpc/rpc-test')).toBeTruthy()
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/rpc/rpc-test')[1].method).toBe('GET')
    wrapper.destroy()
  })

  it('defaults to method "POST"', async () => {
    expect.assertions(2)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api'
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.rpc.call('rpc-test')
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/rpc/rpc-test')).toBeTruthy()
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/rpc/rpc-test')[1].method).toBe('POST')
    wrapper.destroy()
  })

  it('sets correct header for option accept', async () => {
    expect.assertions(4)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api'
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.rpc.call('rpc-test', { accept: 'binary' })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/rpc/rpc-test')[1].headers.get('Accept')).toBe('application/octet-stream')
    fetch.mockClear()

    await wrapper.vm.rpc.call('rpc-test', { accept: 'single' })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/rpc/rpc-test')[1].headers.get('Accept')).toBe('application/vnd.pgrst.object+json')
    fetch.mockClear()

    await wrapper.vm.rpc.call('rpc-test')
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/rpc/rpc-test')[1].headers.get('Accept')).toBe('application/json')
    fetch.mockClear()

    await wrapper.vm.rpc.call('rpc-test', { accept: 'custom-accept-header' })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/rpc/rpc-test')[1].headers.get('Accept')).toBe('custom-accept-header')
    wrapper.destroy()
  })

  it('correctly passes "headers" option', async () => {
    expect.assertions(2)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api'
      },
      slots: { default: '<div />' }
    })
    const headers = { accept: 'custom-accept-header', 'x-header': 'custom-x-header' }
    await wrapper.vm.rpc.call('rpc-test', { accept: 'single', headers })
    const respHeaders = fetch.mock.calls.find(args => args[0] === 'http://localhost/api/rpc/rpc-test')[1].headers
    expect(respHeaders.get('Accept')).toBe(headers.accept)
    expect(respHeaders.get('X-Header')).toBe(headers['x-header'])
    wrapper.destroy()
  })

  it('throws if method is neither "POST" nor "GET"', async () => {
    expect.assertions(1)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api'
      },
      slots: { default: '<div />' }
    })
    await expect(wrapper.vm.rpc.call('rpc-test', { method: 'PATCH' })).rejects.toThrow()
    wrapper.destroy()
  })
})
