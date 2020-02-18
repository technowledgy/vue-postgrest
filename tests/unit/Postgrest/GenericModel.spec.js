import PrimaryKeyError from '@/errors/PrimaryKeyError'
import FieldNotExistsError from '@/errors/FieldNotExistsError'
import request from 'superagent'
import config from './MockApi.config'
import mock from 'superagent-mock'

const data = {
  id: 123,
  name: 'client123',
  age: 50,
  level: 10
}

const requestLogger = jest.fn((log) => {})
const superagentMock = mock(request, config({
  data: {
    '/clients': {
      patch: [{
        ...data
      }]
    }
  }
}), requestLogger)

import GenericModel from '@/models/GenericModel'

const url = '/api/clients'

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
    it('sets the data field getters and setters on instance property "data"', () => {
      for (let prop in data) {
        expect(instance.data[prop]).toBe(data[prop])
        instance.data[prop] = 'test'
        expect(instance.data[prop]).toBe('test')
      }
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

  describe('Reset method', () => {
    it('resets the changes on the instance data object', () => {
      const patchInstance = new GenericModel(data, url, ['id'])
      patchInstance.data.name = 'client321'
      expect(patchInstance.data.name).toBe('client321')
      patchInstance.reset()
      expect(patchInstance.data.name).toBe('client123')
    })
  })

  describe('Patch method', () => {
    describe('called without argument', () => {
      it('does not send a patch request if data was not changed', async () => {
        const patchInstance = new GenericModel(data, url, ['id'])
        await patchInstance.patch.call()
        expect(requestLogger.mock.calls.length).toBe(0)

        const patchInstance2 = new GenericModel(data, url, ['id'])
        patchInstance2.name = 'client321'
        patchInstance2.name = 'client123'
        await patchInstance2.patch.call()
        expect(requestLogger.mock.calls.length).toBe(0)
      })

      describe('sends a patch request for the specified entity to the relevant endpoint for changed', () => {
        it('simple data fields', async () => {
          const patchInstance = new GenericModel(data, url, ['id'])
          patchInstance.data.name = 'client321'
          await patchInstance.patch.call()
          expect(requestLogger.mock.calls.length).toBe(1)
          expect(requestLogger.mock.calls[0][0].url).toBe(url + '?id=' + data.id)
          expect(requestLogger.mock.calls[0][0].method).toBe('PATCH')
          expect(requestLogger.mock.calls[0][0].data).toEqual({
            name: 'client321'
          })
        })

        describe('nested data fields', () => {
          const nestedField = {
            parent: {
              child: 'old'
            },
            sibling: 'old'
          }

          it('that are changed as a whole', async () => {
            const patchInstance = new GenericModel({
              ...data,
              nestedField
            }, url, ['id'])
            const newNestedField = {
              newParent: {
                newChild: 'new'
              },
              newSibling: 'new'
            }
            patchInstance.data.nestedField = newNestedField
            await patchInstance.patch.call()
            expect(requestLogger.mock.calls.length).toBe(1)
            expect(requestLogger.mock.calls[0][0].data).toEqual({ nestedField: newNestedField })
          })

          it('of whom only a subfield is changed', async () => {
            const patchInstance = new GenericModel({
              ...data,
              nestedField
            }, url, ['id'])
            patchInstance.data.nestedField.parent.set('child', 'new')
            await patchInstance.patch.call()
            expect(requestLogger.mock.calls.length).toBe(1)
            expect(requestLogger.mock.calls[0][0].data).toEqual({
              nestedField: {
                parent: {
                  child: 'new'
                },
                sibling: 'old'
              }
            })
          })
        })

        describe('array data fields', () => {
          it('with primitive values', async () => {
            const patchInstance = new GenericModel({
              ...data,
              nestedField: [1, 5, 10]
            }, url, ['id'])
            patchInstance.data.nestedField.set(0, 2)
            patchInstance.data.nestedField.push(20)
            await patchInstance.patch.call()
            expect(requestLogger.mock.calls.length).toBe(1)
            expect(requestLogger.mock.calls[0][0].data).toEqual({ nestedField: [2, 5, 10, 20] })
  
          })

          it('with nested values', async () => {
            const patchInstance = new GenericModel({
              ...data,
              nestedField: [{
                child: 'old'
              }, 5, 10]
            }, url, ['id'])
            patchInstance.data.nestedField[0].set('child', 'new')
            await patchInstance.patch.call()
            expect(requestLogger.mock.calls.length).toBe(1)
            expect(requestLogger.mock.calls[0][0].data).toEqual({ nestedField: [{
              child: 'new'
            }, 5, 10] })
          })
        })
      })
    })

    describe('called with argument', () => {
      it('throws if argument is not an object', async () => {
        const patchInstance = new GenericModel(data, url, ['id'])
        await expect(patchInstance.patch.call(1)).rejects.toThrow()
        await expect(patchInstance.patch.call([])).rejects.toThrow()
      })

      describe('sends a patch request for the specified entity to the relevant endpoint for changed', () => {
        it('data fields, merged with argument (takes precedence)', async () => {
          const patchInstance = new GenericModel(data, url, ['id'])
          patchInstance.data.name = 'client321'
          patchInstance.data.age = 66
          await patchInstance.patch.call({
            name: 'client 222',
            newField: true
          })
          expect(requestLogger.mock.calls.length).toBe(1)
          expect(requestLogger.mock.calls[0][0].url).toBe(url + '?id=' + data.id)
          expect(requestLogger.mock.calls[0][0].method).toBe('PATCH')
          expect(requestLogger.mock.calls[0][0].data).toEqual({
            name: 'client 222',
            age: 66,
            newField: true
          })
        })
      })
    })

    it('updates the patched instance when arg "sync" is true', async () => {
      const patchInstance = new GenericModel(data, url, ['id'])
      patchInstance.data.name = 'client321'
      await patchInstance.patch.call()
      expect(requestLogger.mock.calls.length).toBe(1)
      patchInstance.reset()
      expect(patchInstance.data).toEqual({
        ...data,
        name: 'client321'
      })
    })

    it('resets the patched instance when arg "sync" is false', async () => {
      const patchInstance = new GenericModel(data, url, ['id'])
      patchInstance.data.name = 'client321'
      await patchInstance.patch.call({}, { sync: false })
      expect(requestLogger.mock.calls.length).toBe(1)
      expect(patchInstance.data).toEqual({
        ...data,
        name: 'client123'
      })
    })

    it('throws "PrimaryKeyError" before sending the request if primary key is not valid', async () => {
      const patchInstance = new GenericModel(data, url, ['not-existing'])
      patchInstance.data.name = 'client321'
      expect(patchInstance.patch.hasError).toBe(false)
      await expect(patchInstance.patch.call()).rejects.toThrow(PrimaryKeyError)
      expect(patchInstance.patch.hasError).toBeTruthy()
    })
  })

  describe('Delete method', () => {
    it('sends a delete request for the specified entity to the relevant endpoint', async () => {
      const deleteInstance = new GenericModel(data, url, ['id'])
      await deleteInstance.delete.call()
      expect(requestLogger.mock.calls.length).toBe(1)
      expect(requestLogger.mock.calls[0][0].url).toBe(url + '?id=eq.' + data.id)
      expect(requestLogger.mock.calls[0][0].method).toBe('DELETE')

      const deleteInstance2 = new GenericModel(data, url, ['name', 'age'])
      await deleteInstance2.delete.call()
      expect(requestLogger.mock.calls.length).toBe(2)
      expect(requestLogger.mock.calls[1][0].url).toBe(url + '?name=eq.' + data.name + '&age=eq.' + data.age)
      expect(requestLogger.mock.calls[1][0].method).toBe('DELETE')
    })

    it('throws "PrimaryKeyError" before sending the request if primary key is not valid', async () => {
      const deleteInstance = new GenericModel(data, url, ['not-existing'])
      expect(deleteInstance.delete.hasError).toBe(false)
      await expect(deleteInstance.delete.call()).rejects.toThrow(PrimaryKeyError)
      expect(deleteInstance.delete.hasError).toBeTruthy()

      const deleteInstance2 = new GenericModel({
        name: 'client321',
        age: 50
      }, url, ['id'])
      await expect(deleteInstance2.delete.call()).rejects.toThrow(PrimaryKeyError)
      expect(requestLogger.mock.calls.length).toBe(0)
    })
  })

  describe('Reset method', () => {})
})
