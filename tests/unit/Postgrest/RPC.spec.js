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

describe('RPC', () => {
  afterAll(() => {
    superagentMock.unset()
  })

  beforeEach(() => {
    requestLogger.mockReset()
  })

  it('sends a post request with the specified method and arguments to the rpc route', async () => {
    expect.assertions(6)
    const postgrest = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    const functionParams = {
      a: 1,
      b: 2
    }
    await postgrest.vm.rpc('rpc-test', 'POST', functionParams)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test').length).toBe(1)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test')[0][0].method).toBe('POST')
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test')[0][0].data).toEqual(functionParams)

    await postgrest.vm.rpc('rpc-test', 'GET', functionParams)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test').length).toBe(2)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test')[1][0].method).toBe('GET')
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/rpc/rpc-test')[1][0].data).toEqual(functionParams)
  })

  it('throws if method is neither "POST" nor "GET"', async () => {
    expect.assertions(1)
    const postgrest = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/',
        route: 'clients',
        query: {}
      },
      slots: { default: '<div />' }
    })
    await expect(postgrest.vm.rpc('rpc-test', 'PATCH', {})).rejects.toThrow()
  })
})
