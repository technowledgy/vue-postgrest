import request from 'superagent'
import config from './MockApi.config'
import mock from 'superagent-mock'

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
        id: {
          type: 'integer',
          description: 'Note:\nThis is a Primary Key.<pk/>'
        }
      }
    }
  }
}), requestLogger)

import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import PostgrestPlugin from '@/index'
import Postgrest from '@/Postgrest'

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
        route: 'clients',
        query: {}
      }
    })
    await postgrest.vm.request('GET', {})
    // one call by get in created
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients').length).toBe(2)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[1][0].method).toBe('GET')

    await postgrest.vm.request('POST', {})
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients').length).toBe(3)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[2][0].method).toBe('POST')

    await postgrest.vm.request('DELETE', {})
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients').length).toBe(4)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[3][0].method).toBe('DELETE')

    await postgrest.vm.request('PATCH', {})
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients').length).toBe(5)
    expect(requestLogger.mock.calls.filter(c => c[0].url === '/api/clients')[4][0].method).toBe('PATCH')
  })

  it('merges select part of module query with query argument', async () => {
    const postgrest = shallowMount(Postgrest, {
      propsData: {
        apiRoot: '/api/',
        route: 'clients',
        query: {
          select: ['id', 'name']
        }
      }
    })
    await postgrest.vm.request('GET', { id: 'eq.123' })
    expect(requestLogger.mock.calls[1][0].url).toBe('/api/clients?select=id,name&id=eq.123')
  })

  // TODO: add more tests for params, data and headers
})
