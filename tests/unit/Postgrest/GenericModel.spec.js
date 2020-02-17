import request from 'superagent'
import config from './MockApi.config'
import mock from 'superagent-mock'

const requestLogger = jest.fn((log) => {})
const superagentMock = mock(request, config({}), requestLogger)

import GenericModel from '@/models/GenericModel'

const url = '/api/clients'

const data = {
  id: 123,
  name: 'client 123'
}

const primaryKeys = {
  clients: ['id']
}

describe('GenericModel', () => {
  beforeEach(() => {
    requestLogger.mockReset()
  })

  afterAll(() => {
    superagentMock.unset()
  })

  const instance = new GenericModel(data, url, primaryKeys)

  describe('Instance', () => {
    it('sets the first constructor argument to instance property "data"', () => {
      expect(instance.data).toEqual(data)
    })

    it('sets the second constructor argument to instance property "url"', () => {
      expect(instance.url).toBe(url)
    })

    it('sets the third constructor argument to instance property "primaryKeys"', () => {
      expect(instance.primaryKeys).toBe(primaryKeys)
    })

    it('has instance method "post"', () => {
      expect(typeof instance.post).toBe('object')
      expect(typeof instance.post.call).toBe('function')
      expect(typeof instance.post.hasError).toBe('boolean')
      expect(typeof instance.post.isPending).toBe('boolean')
    })

    it('has instance method "patch"', () => {
      expect(typeof instance.patch).toBe('object')
      expect(typeof instance.patch.call).toBe('function')
      expect(typeof instance.patch.hasError).toBe('boolean')
      expect(typeof instance.patch.isPending).toBe('boolean')
    })

    it('has instance method "delete"', () => {
      expect(typeof instance.delete).toBe('object')
      expect(typeof instance.delete.call).toBe('function')
      expect(typeof instance.delete.hasError).toBe('boolean')
      expect(typeof instance.delete.isPending).toBe('boolean')
    })

    it('has instance method "reset"', () => {
      expect(typeof instance.reset).toBe('function')
    })
  })

  describe('Post method', () => {})

  describe('Patch method', () => {})

  describe('Delete method', () => {
    it('sends a delete request for the specified entity to the relevant endpoint', async () => {
      await instance.delete.call()
      // id is primary key as defined above
      expect(requestLogger.mock.calls.length).toBe(1)
      expect(requestLogger.mock.calls[0][0].url).toBe(url + '?id=' + data.id)
      expect(requestLogger.mock.calls[0][0].method).toBe('DELETE')
    })
  })

  describe('Reset method', () => {})
})
