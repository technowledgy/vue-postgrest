import { shallowMount } from '@vue/test-utils'
import Postgrest from '@/Postgrest'

const mockData = [
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
]

fetch.mockResponse(async req => {
  if (req.url === 'http://localhost/api') {
    return {
      body: JSON.stringify({
        definitions: {
          clients: {
            properties: {
              id: {
                type: 'integer',
                description: 'Note:\nThis is a Primary Key.<pk/>'
              }
            }
          }
        }
      }),
      init: {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/openapi+json'
        }
      }
    }
  } else if (req.headers.get('Authorization') === 'Bearer expired-token') {
    return {
      body: '',
      init: {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Bearer error="invalid_token", error_description="JWT expired"'
        }
      }
    }
  } else {
    return {
      body: JSON.stringify(mockData),
      init: {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    }
  }
})

describe('Request', () => {
  beforeEach(() => {
    // just reset .mock data, but not .mockResponse
    fetch.mockClear()
  })

  it('sends a request with the specified method', async () => {
    expect.assertions(4)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api',
        route: 'clients'
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.request('GET', {})
    expect(fetch.mock.calls.filter(args => args[0] === 'http://localhost/api/clients' && args[1].method === 'GET').length).toBe(1)

    await wrapper.vm.request('POST', {})
    expect(fetch.mock.calls.filter(args => args[0] === 'http://localhost/api/clients' && args[1].method === 'POST').length).toBe(1)

    await wrapper.vm.request('DELETE', {})
    expect(fetch.mock.calls.filter(args => args[0] === 'http://localhost/api/clients' && args[1].method === 'DELETE').length).toBe(1)

    await wrapper.vm.request('PATCH', {})
    expect(fetch.mock.calls.filter(args => args[0] === 'http://localhost/api/clients' && args[1].method === 'PATCH').length).toBe(1)
    wrapper.destroy()
  })

  it('it does not send module query', async () => {
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api',
        route: 'clients',
        query: {
          select: ['id', 'name']
        }
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.$nextTick()
    fetch.mockClear()

    await wrapper.vm.request('GET')
    expect(fetch.mock.calls[0][0]).toBe('http://localhost/api/clients')
    wrapper.destroy()
  })

  it('it sends passed select part of query', async () => {
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.$nextTick()
    fetch.mockClear()

    await wrapper.vm.request('GET', { select: ['id', 'name'] })
    expect(decodeURIComponent(fetch.mock.calls[0][0])).toBe('http://localhost/api/clients?select=id,name')
    wrapper.destroy()
  })

  it('it parses "accept" option correctly', async () => {
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.$nextTick()
    fetch.mockClear()

    await wrapper.vm.request('GET', {}, { accept: 'single' })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Accept')).toBe('application/vnd.pgrst.object+json')
    fetch.mockClear()

    await wrapper.vm.request('GET', {}, { accept: 'binary' })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Accept')).toBe('application/octet-stream')
    fetch.mockClear()

    await wrapper.vm.request('GET', {}, { accept: undefined })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Accept')).toBe('application/json')
    fetch.mockClear()

    await wrapper.vm.request('GET', {}, { accept: 'custom-accept-header' })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Accept')).toBe('custom-accept-header')
    wrapper.destroy()
  })

  it('it parses "return" option correctly', async () => {
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.$nextTick()
    fetch.mockClear()

    await wrapper.vm.request('GET', {}, {})
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Prefer')).toBe(null)
    fetch.mockClear()

    await wrapper.vm.request('GET', {}, { return: 'representation' })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Prefer')).toBe('return=representation')
    wrapper.destroy()
  })

  it('it parses "count" option correctly', async () => {
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.$nextTick()
    fetch.mockClear()

    await wrapper.vm.request('GET', {}, {})
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Prefer')).toBe(null)
    fetch.mockClear()

    await wrapper.vm.request('GET', {}, { count: 'exact' })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Prefer')).toBe('count=exact')
    wrapper.destroy()
  })

  it('it parses "headers" option correctly', async () => {
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    const headers = { prefer: 'custom-prefer-header', accept: 'custom-accept-header', 'x-header': 'custom-x-header' }
    await wrapper.vm.$nextTick()
    fetch.mockClear()

    await wrapper.vm.request('GET', {}, { headers })
    const getHeaders = fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers
    expect(getHeaders.get('Prefer')).toBe(headers.prefer)
    expect(getHeaders.get('Accept')).toBe(headers.accept)
    expect(getHeaders.get('X-Header')).toBe(headers['x-header'])
    fetch.mockClear()

    await wrapper.vm.request('POST', {}, { accept: 'binary', return: 'minimal', headers })
    const postHeaders = fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers
    expect(postHeaders.get('Prefer')).toBe(headers.prefer)
    expect(postHeaders.get('Accept')).toBe(headers.accept)
    expect(postHeaders.get('X-Header')).toBe(headers['x-header'])
    wrapper.destroy()
  })

  it('it combines return and count options correctly', async () => {
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.$nextTick()
    fetch.mockClear()

    await wrapper.vm.request('POST', {}, { count: 'exact', return: 'minimal' })
    expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Prefer')).toBe('return=minimal,count=exact')
    wrapper.destroy()
  })

  it('does not throw if query argument is undefined', async () => {
    expect.assertions(1)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    await expect(wrapper.vm.request('GET')).resolves.toBeTruthy()
    wrapper.destroy()
  })

  it('does not send authorization header if prop "token" is not set', async () => {
    expect.assertions(1)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.$nextTick()
    fetch.mockClear()

    await wrapper.vm.request('GET', {})
    expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe(null)
    wrapper.destroy()
  })

  it('sends authorization header if prop "token" is set', async () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiamRvZSIsImV4cCI6MTQ3NTUxNjI1MH0.GYDZV3yM0gqvuEtJmfpplLBXSGYnke_Pvnl0tbKAjB'
    expect.assertions(1)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api',
        route: 'clients',
        query: {},
        token
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.$nextTick()
    fetch.mockClear()

    await wrapper.vm.request('GET', {})
    expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe(`Bearer ${token}`)
    wrapper.destroy()
  })

  it('emits "token-error" when server sets appropriate header', async () => {
    expect.assertions(3)
    let wrapper
    await new Promise((resolve, reject) => {
      wrapper = shallowMount(Postgrest, {
        propsData: {
          apiRoot: '/api',
          route: 'clients',
          query: {},
          token: 'expired-token'
        },
        scopedSlots: {
          default (props) {
            try {
              if (!props.get.isPending) {
                expect(wrapper.emitted()['token-error']).toBeTruthy()
                expect(wrapper.emitted()['token-error'].length).toBe(1)
                expect(wrapper.emitted()['token-error'][0][0]).toEqual({ error: 'invalid_token', error_description: 'JWT expired' })
                resolve()
              }
            } catch (e) {
              reject(e)
            }
          }
        }
      })
    })
    wrapper.destroy()
  })
})
