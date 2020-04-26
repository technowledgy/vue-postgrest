import request from 'superagent'
import config from './MockApi.config'
import mock from 'superagent-mock'

import { shallowMount } from '@vue/test-utils'
import Postgrest from '@/Postgrest'

const requestLogger = jest.fn((log) => {})
const superagentMock = mock(request, config({
  data: {
    '/clients': {
      get: [{
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
    }
  }
}), requestLogger)

describe('Request', () => {
  afterAll(() => {
    superagentMock.unset()
  })

  beforeEach(() => {
    requestLogger.mockReset()
  })

  it('sends a request with the specified method', async () => {
    expect.assertions(8)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/',
        route: 'clients'
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.request('GET', {})
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients').length).toBe(1)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[0][0].method).toBe('GET')

    await wrapper.vm.request('POST', {})
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients').length).toBe(2)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[1][0].method).toBe('POST')

    await wrapper.vm.request('DELETE', {})
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients').length).toBe(3)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[2][0].method).toBe('DELETE')

    await wrapper.vm.request('PATCH', {})
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients').length).toBe(4)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[3][0].method).toBe('PATCH')
    wrapper.destroy()
  })

  it('it does not send module query', async () => {
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/',
        route: 'clients',
        query: {
          select: ['id', 'name']
        }
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.$nextTick()
    await wrapper.vm.request('GET')
    expect(requestLogger.mock.calls[1][0].url).toBe('/api/clients')
    wrapper.destroy()
  })

  it('it sends passed select part of query', async () => {
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.$nextTick()
    await wrapper.vm.request('GET', { select: ['id', 'name'] })
    expect(decodeURIComponent(requestLogger.mock.calls[1][0].url)).toBe('/api/clients?select=id,name')
    wrapper.destroy()
  })

  it('it parses "accept" option correctly', async () => {
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.$nextTick()
    await wrapper.vm.request('GET', {}, { accept: 'single' })
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[1][0].headers.accept).toBe('application/vnd.pgrst.object+json')
    await wrapper.vm.request('GET', {}, { accept: 'binary' })
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[2][0].headers.accept).toBe('application/octet-stream')
    await wrapper.vm.request('GET', {}, { accept: undefined })
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[3][0].headers.accept).toBe('application/json')
    await wrapper.vm.request('GET', {}, { accept: 'custom-accept-header' })
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[4][0].headers.accept).toBe('custom-accept-header')
    wrapper.destroy()
  })

  it('it parses "return" option correctly', async () => {
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.$nextTick()
    await wrapper.vm.request('GET', {}, {})
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[1][0].headers.prefer).toBe(undefined)
    await wrapper.vm.request('GET', {}, { return: 'representation' })
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[2][0].headers.prefer).toBe('return=representation')
    wrapper.destroy()
  })

  it('it parses "count" option correctly', async () => {
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.$nextTick()
    await wrapper.vm.request('GET', {}, {})
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[1][0].headers.prefer).toBe(undefined)
    await wrapper.vm.request('GET', {}, { count: 'exact' })
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[2][0].headers.prefer).toBe('count=exact')
    wrapper.destroy()
  })

  it('it parses "headers" option correctly', async () => {
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    const headers = { prefer: 'custom-prefer-header', accept: 'custom-accept-header', 'x-header': 'custom-x-header' }
    await wrapper.vm.$nextTick()
    await wrapper.vm.request('GET', {}, { headers })
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[1][0].headers).toEqual(headers)
    await wrapper.vm.request('POST', {}, { accept: 'binary', return: 'minimal', headers })
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[2][0].headers).toEqual(headers)
    wrapper.destroy()
  })

  it('it combines return and count options correctly', async () => {
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.$nextTick()
    await wrapper.vm.request('POST', {}, { count: 'exact', return: 'minimal' })
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[1][0].headers.prefer).toBe('return=minimal,count=exact')
    wrapper.destroy()
  })

  it('does not throw if query argument is undefined', async () => {
    expect.assertions(1)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    await expect(wrapper.vm.request('GET')).resolves.toBeTruthy()
    wrapper.destroy()
  })

  it('does not send authentication header if prop "token" is not set', async () => {
    expect.assertions(1)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.request('GET', {})
    expect(requestLogger.mock.calls[1][0].headers.authorization).toBe(undefined)
    wrapper.destroy()
  })

  it('sends authentication header if prop "token" is set', async () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiamRvZSIsImV4cCI6MTQ3NTUxNjI1MH0.GYDZV3yM0gqvuEtJmfpplLBXSGYnke_Pvnl0tbKAjB'
    expect.assertions(1)
    const wrapper = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/',
        route: 'clients',
        query: {},
        token
      },
      slots: { default: '<div />' }
    })
    await wrapper.vm.request('GET', {})
    expect(requestLogger.mock.calls[1][0].headers.authorization).toBe(`Bearer ${token}`)
    wrapper.destroy()
  })

  it('emits "token-error" when server sets appropriate header', async () => {
    expect.assertions(3)
    let wrapper
    await new Promise((resolve, reject) => {
      wrapper = shallowMount(Postgrest, {
        propsData: {
          apiRoot: '/api/',
          route: 'clients',
          query: {},
          token: 'expired'
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
