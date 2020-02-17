import PrimaryKeyError from '@/errors/PrimaryKeyError'
import request from 'superagent'
import config from './MockApi.config'
import mock from 'superagent-mock'

const requestLogger = jest.fn((log) => {})
const superagentMock = mock(request, config({}), requestLogger)

import GenericModel from '@/models/GenericModel'

const url = '/api/clients'

const data = {
  id: 123,
  name: 'client123',
  age: 50
}

const primaryKeys = ['id']

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
      const deleteInstance = new GenericModel(data, url, ['id'])
      await deleteInstance.delete.call()
      expect(requestLogger.mock.calls.length).toBe(1)
      expect(requestLogger.mock.calls[0][0].url).toBe(url + '?id=' + data.id)
      expect(requestLogger.mock.calls[0][0].method).toBe('DELETE')

      const deleteInstance2 = new GenericModel(data, url, ['name', 'age'])
      await deleteInstance2.delete.call()
      expect(requestLogger.mock.calls.length).toBe(2)
      expect(requestLogger.mock.calls[1][0].url).toBe(url + '?name=' + data.name + '&age=' + data.age)
      expect(requestLogger.mock.calls[1][0].method).toBe('DELETE')
    })

    it('throws "PrimaryKeyError" before sending the request if primary key is not valid', async () => {
      const deleteInstance = new GenericModel(data, url, ['not-existing'])
      expect(deleteInstance.delete.hasError).toBe(false)
      await expect(deleteInstance.delete.call()).rejects.toThrow(PrimaryKeyError)
      expect(deleteInstance.delete.hasError).toBeTruthy()

      const deleteInstance2 = new GenericModel({
        name: 'client 321',
        age: 50
      }, url, ['id'])
      await expect(deleteInstance2.delete.call()).rejects.toThrow(PrimaryKeyError)
      expect(requestLogger.mock.calls.length).toBe(0)
    })
  })

  describe('Reset method', () => {})
})
