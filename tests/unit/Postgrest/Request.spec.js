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
  },
  docs: {
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
    const postgrest = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/',
        route: 'clients'
      },
      slots: { default: '<div />' }
    })
    await postgrest.vm.request('GET', {})
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients').length).toBe(1)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[0][0].method).toBe('GET')

    await postgrest.vm.request('POST', {})
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients').length).toBe(2)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[1][0].method).toBe('POST')

    await postgrest.vm.request('DELETE', {})
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients').length).toBe(3)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[2][0].method).toBe('DELETE')

    await postgrest.vm.request('PATCH', {})
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients').length).toBe(4)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[3][0].method).toBe('PATCH')
  })

  it('merges select part of module query with query argument', async () => {
    const postgrest = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/',
        route: 'clients',
        query: {
          select: ['id', 'name']
        }
      },
      slots: { default: '<div />' }
    })
    await postgrest.vm.$nextTick()
    await postgrest.vm.request('GET', { id: 'eq.123' })
    expect(requestLogger.mock.calls[1][0].url).toBe('/api/clients?select=id,name&id=eq.123')
  })

  it('does not throw if query argument is undefined', async () => {
    expect.assertions(1)
    const postgrest = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    await expect(postgrest.vm.request('GET')).resolves.toBeTruthy()
  })

  it('does not send authentication header if prop "token" is not set', async () => {
    expect.assertions(1)
    const postgrest = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    await postgrest.vm.request('GET', {})
    expect(requestLogger.mock.calls[1][0].headers.authorization).toBe(undefined)
  })

  it('sends authentication header if prop "token" is set', async () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiamRvZSIsImV4cCI6MTQ3NTUxNjI1MH0.GYDZV3yM0gqvuEtJmfpplLBXSGYnke_Pvnl0tbKAjB'
    expect.assertions(1)
    const postgrest = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/',
        route: 'clients',
        query: {},
        token
      },
      slots: { default: '<div />' }
    })
    await postgrest.vm.request('GET', {})
    expect(requestLogger.mock.calls[1][0].headers.authorization).toBe(`Bearer ${token}`)
  })

  it('emits "token-error" when server sets appropriate header', async () => {
    expect.assertions(3)
    return new Promise((resolve, reject) => {
      const postgrest = shallowMount(Postgrest, {
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
                expect(postgrest.emitted()['token-error']).toBeTruthy()
                expect(postgrest.emitted()['token-error'].length).toBe(1)
                expect(postgrest.emitted()['token-error'][0][0]).toEqual({ error: 'invalid_token', error_description: 'JWT expired' })
                resolve()
              }
            } catch (e) {
              reject(e)
            }
          }
        }
      })
    })
  })
})
