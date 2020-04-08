import PrimaryKeyError from '@/errors/PrimaryKeyError'
import GenericModel from '@/models/GenericModel'
import cloneDeep from 'lodash.clonedeep'

const data = {
  id: 123,
  name: 'client123',
  age: 50,
  level: 10
}

const primaryKeys = ['id']

const makeRequestCB = jest.fn()

describe('GenericModel', () => {
  beforeEach(() => {
    makeRequestCB.mockReset()
  })

  describe('Instance', () => {
    it('sets the data field getters and setters on instance property "data"', () => {
      const instance = new GenericModel(data, makeRequestCB, primaryKeys)
      for (const prop in data) {
        expect(instance.data[prop]).toBe(data[prop])
        instance.data[prop] = 'test'
        expect(instance.data[prop]).toBe('test')
      }
    })

    it('sets the third constructor argument to instance property "primaryKeys"', () => {
      const instance = new GenericModel(data, makeRequestCB, primaryKeys)
      expect(instance.primaryKeys).toBe(primaryKeys)
    })

    it('sets the fourth constructor argument to instance property "select"', () => {
      const select = ['id', 'name']
      const instance = new GenericModel(data, makeRequestCB, primaryKeys, select)
      expect(instance.select).toBe(select)
    })

    it('throws "PrimaryKeyError" if primary key is not valid', async () => {
      expect.assertions(1)
      const instance = new GenericModel(data, makeRequestCB, ['not-existing'])
      try {
        // eslint-disable-next-line
        const q = instance.query
      } catch (e) {
        expect(e instanceof PrimaryKeyError).toBeTruthy()
      }
    })

    it('has instance property "isDirty" which defaults to false', () => {
      const instance = new GenericModel(data, makeRequestCB, primaryKeys)
      expect(instance.isDirty).toBe(false)
    })

    it('sets the second constructor argument to instance method "request"', () => {
      const instance = new GenericModel(data, makeRequestCB, primaryKeys)
      expect(instance.request).toEqual(makeRequestCB)
    })

    it('has instance method "post"', () => {
      const instance = new GenericModel(data, makeRequestCB, primaryKeys)
      expect(typeof instance.post).toBe('object')
      expect(typeof instance.post.call).toBe('function')
      expect(typeof instance.post.hasError).toBe('boolean')
      expect(typeof instance.post.isPending).toBe('boolean')
    })

    it('has instance method "patch" if primary keys are passed', () => {
      const instance = new GenericModel(data, makeRequestCB, primaryKeys)
      expect(typeof instance.patch).toBe('object')
      expect(typeof instance.patch.call).toBe('function')
      expect(typeof instance.patch.hasError).toBe('boolean')
      expect(typeof instance.patch.isPending).toBe('boolean')
    })

    it('has instance method "delete" if primary keys are passed', () => {
      const instance = new GenericModel(data, makeRequestCB, primaryKeys)
      expect(typeof instance.delete).toBe('object')
      expect(typeof instance.delete.call).toBe('function')
      expect(typeof instance.delete.hasError).toBe('boolean')
      expect(typeof instance.delete.isPending).toBe('boolean')
    })

    it('does not have methods "delete" and "path" if primary keys are not passed', () => {
      const instance = new GenericModel(data, makeRequestCB)
      expect(instance.delete).toBe(undefined)
      expect(instance.patch).toBe(undefined)
    })

    it('has instance method "reset"', () => {
      const instance = new GenericModel(data, makeRequestCB, primaryKeys)
      expect(typeof instance.reset).toBe('function')
    })
  })

  describe('Post method', () => {
    it('sends a post request with instance data to the specified endpoint', async () => {
      const postInstance = new GenericModel(data, makeRequestCB)
      postInstance.post.call()
      expect(makeRequestCB.mock.calls.length).toBe(1)
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ columns: Object.keys(data) })
      expect(makeRequestCB.mock.calls[0][3]).toEqual(data)
      expect(makeRequestCB.mock.calls[0][0]).toBe('POST')
    })

    it('sends a post request with changed instance data to the specified endpoint', async () => {
      const postInstance = new GenericModel(data, makeRequestCB)
      postInstance.data.name = 'client321'
      postInstance.post.call()
      expect(makeRequestCB.mock.calls.length).toBe(1)
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ columns: Object.keys(data) })
      expect(makeRequestCB.mock.calls[0][3]).toEqual({
        ...data,
        name: 'client321'
      })
      expect(makeRequestCB.mock.calls[0][0]).toBe('POST')
    })

    it('resets the instance data after the request if sync is false', async () => {
      const postInstance = new GenericModel(data, makeRequestCB)
      postInstance.data.name = 'client321'
      await postInstance.post.call({}, false)
      expect(makeRequestCB.mock.calls.length).toBe(1)
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ columns: Object.keys(data) })
      expect(makeRequestCB.mock.calls[0][3]).toEqual({
        ...data,
        name: 'client321'
      })
      expect(makeRequestCB.mock.calls[0][0]).toBe('POST')
      expect(postInstance.data).toEqual(data)
    })

    it('returns the requests return value', async () => {
      const postInstance = new GenericModel(data, makeRequestCB)
      const mockReturn = {
        body: [{
          ...data,
          name: 'client321',
          id: 321
        }]
      }
      makeRequestCB.mockReturnValueOnce(mockReturn)
      const ret = await postInstance.post.call()
      expect(ret).toEqual(mockReturn)
    })

    it('parses "return" option correctly', async () => {
      const postInstance = new GenericModel(data, makeRequestCB)
      await postInstance.post.call({}, false)
      expect(makeRequestCB.mock.calls[0][2].return).toBe(undefined)
      await postInstance.post.call({ return: 'representation' })
      expect(makeRequestCB.mock.calls[1][2].return).toBe('representation')
      await postInstance.post.call({ return: 'minimal' }, false)
      expect(makeRequestCB.mock.calls[2][2].return).toBe('minimal')
      await postInstance.post.call({ return: 'minimal' })
      expect(makeRequestCB.mock.calls[3][2].return).toBe('representation')
    })

    it('updates the instance data after the request if sync is true', async () => {
      const postInstance = new GenericModel(data, makeRequestCB)
      postInstance.data.name = 'client321'
      makeRequestCB.mockReturnValueOnce({
        body: [{
          ...data,
          name: 'client321',
          id: 321
        }]
      })
      await postInstance.post.call()
      expect(makeRequestCB.mock.calls.length).toBe(1)
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ columns: Object.keys(data) })
      expect(makeRequestCB.mock.calls[0][3]).toEqual({
        ...data,
        name: 'client321'
      })
      expect(makeRequestCB.mock.calls[0][0]).toBe('POST')
      expect(postInstance.data).toEqual({
        ...data,
        name: 'client321',
        id: 321
      })
    })

    it('sets select part of query if sync is true', async () => {
      const select = ['id', 'name']
      const postInstance = new GenericModel(data, makeRequestCB, [], select)
      postInstance.post.call()
      expect(makeRequestCB.mock.calls.length).toBe(1)
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ select, columns: Object.keys(data) })
    })

    it('does not set select part of query if sync is false', async () => {
      const select = ['id', 'name']
      const postInstance = new GenericModel(data, makeRequestCB, [], select)
      await postInstance.post.call({}, false)
      expect(makeRequestCB.mock.calls.length).toBe(1)
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ columns: Object.keys(data) })
    })

    it('does not set select part of query if select is undefined', async () => {
      const postInstance = new GenericModel(data, makeRequestCB)
      await postInstance.post.call()
      expect(makeRequestCB.mock.calls.length).toBe(1)
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ columns: Object.keys(data) })
    })

    it('sets select part of query if return is "representation"', async () => {
      const select = ['id', 'name']
      const postInstance = new GenericModel(data, makeRequestCB, [], select)
      postInstance.post.call({ return: 'representation' })
      expect(makeRequestCB.mock.calls.length).toBe(1)
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ select, columns: Object.keys(data) })
    })

    it('does not set columns part of query if columns is specified as undefined', async () => {
      const postInstance = new GenericModel(data, makeRequestCB)
      await postInstance.post.call({ columns: undefined })
      expect(makeRequestCB.mock.calls.length).toBe(1)
      expect(makeRequestCB.mock.calls[0][1]).toEqual({})
    })

    it('sets columns part of query to all columns if option "columns" is undefined', async () => {
      const postInstance = new GenericModel(data, makeRequestCB)
      postInstance.post.call()
      expect(makeRequestCB.mock.calls.length).toBe(1)
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ columns: Object.keys(data) })
    })

    it('sets columns part of query to user-defined columns if option "columns" is specified', async () => {
      const columns = ['column1', 'column2']
      const postInstance = new GenericModel(data, makeRequestCB)
      postInstance.post.call({ columns })
      expect(makeRequestCB.mock.calls.length).toBe(1)
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ columns })
    })

    describe('"headers" option', () => {
      it('is passed as is to request method when set', async () => {
        const headers = { prefer: 'custom-prefer-header', accept: 'custom-accept-header', 'x-header': 'custom-x-header' }
        const postInstance = new GenericModel(data, makeRequestCB)
        postInstance.post.call({ headers })
        expect(makeRequestCB.mock.calls.length).toBe(1)
        expect(makeRequestCB.mock.calls[0][2].headers).toEqual(headers)
      })
    })
  })

  describe('Reset method', () => {
    it('resets the changes on the instance data object', async () => {
      const patchInstance = new GenericModel(data, makeRequestCB, ['id'])
      patchInstance.data.name = 'client321'
      await patchInstance.$nextTick()
      expect(patchInstance.data.name).toBe('client321')
      patchInstance.reset()
      expect(patchInstance.data.name).toBe('client123')
    })
  })

  describe('reacts to data changes', () => {
    it('by setting the instance prop "isDirty" correctly', async () => {
      const updateInstance = new GenericModel(data, makeRequestCB, ['id'])
      expect(updateInstance.isDirty).toBe(false)
      updateInstance.data.name = 'client321'
      await updateInstance.$nextTick()
      expect(updateInstance.isDirty).toBe(true)
      updateInstance.data.name = data.name
      await updateInstance.$nextTick()
      expect(updateInstance.isDirty).toBe(false)
    })
  })

  describe('Patch method', () => {
    it('parses "return" option correctly', async () => {
      const patchInstance = new GenericModel(data, makeRequestCB, ['id'])

      patchInstance.data.name = 'client321'
      await patchInstance.$nextTick()
      await patchInstance.patch.call({}, {}, false)
      expect(makeRequestCB.mock.calls[0][2].return).toBe(undefined)

      patchInstance.data.name = 'client1234'
      await patchInstance.$nextTick()
      await patchInstance.patch.call({}, { return: 'representation' })
      expect(makeRequestCB.mock.calls[1][2].return).toBe('representation')

      patchInstance.data.name = 'client4321'
      await patchInstance.$nextTick()
      await patchInstance.patch.call({}, { return: 'minimal' }, false)
      expect(makeRequestCB.mock.calls[2][2].return).toBe('minimal')

      patchInstance.data.name = 'client12345'
      await patchInstance.$nextTick()
      await patchInstance.patch.call({}, { return: 'minimal' })
      expect(makeRequestCB.mock.calls[3][2].return).toBe('representation')
    })

    it('sets select part of query if sync is true', async () => {
      const select = ['id', 'name']
      const patchInstance = new GenericModel(data, makeRequestCB, ['id'], select)
      patchInstance.data.name = 'client321'
      await patchInstance.$nextTick()
      await patchInstance.patch.call()
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ id: 'eq.' + data.id, select, columns: ['name'] })
    })

    it('does not set select part of query if sync is false', async () => {
      const select = ['id', 'name']
      const patchInstance = new GenericModel(data, makeRequestCB, ['id'], select)
      patchInstance.data.name = 'client321'
      await patchInstance.$nextTick()
      await patchInstance.patch.call({}, {}, false)
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ id: 'eq.' + data.id, columns: ['name'] })
    })

    it('sets select part of query if return is "representation"', async () => {
      const select = ['id', 'name']
      const patchInstance = new GenericModel(data, makeRequestCB, ['id'], select)
      patchInstance.data.name = 'client321'
      await patchInstance.$nextTick()
      await patchInstance.patch.call({}, { return: 'representation' })
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ id: 'eq.' + data.id, select, columns: ['name'] })
    })

    it('does not set select part of query if select is undefined', async () => {
      const patchInstance = new GenericModel(data, makeRequestCB, ['id'])
      patchInstance.data.name = 'client321'
      await patchInstance.$nextTick()
      await patchInstance.patch.call()
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ id: 'eq.' + data.id, columns: ['name'] })
    })

    it('does not set columns part of query if columns is specified as undefined', async () => {
      const patchInstance = new GenericModel(data, makeRequestCB, ['id'])
      patchInstance.data.name = 'client321'
      await patchInstance.$nextTick()
      await patchInstance.patch.call({}, { columns: undefined })
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ id: 'eq.' + data.id })
    })

    it('sets columns part of query to patched columns if option "columns" is undefined', async () => {
      const patchInstance = new GenericModel(data, makeRequestCB, ['id'])
      patchInstance.data.name = 'client321'
      await patchInstance.$nextTick()
      await patchInstance.patch.call()
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ id: 'eq.' + data.id, columns: ['name'] })
    })

    it('sets columns part of query to user-defined columns if option "columns" is specified', async () => {
      const columns = ['column1']
      const patchInstance = new GenericModel(data, makeRequestCB, ['id'])
      patchInstance.data.name = 'client321'
      await patchInstance.$nextTick()
      await patchInstance.patch.call({}, { columns })
      expect(makeRequestCB.mock.calls.length).toBe(1)
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ id: 'eq.' + data.id, columns })
    })

    describe('"headers" option', () => {
      it('is passed as is to request method when set', async () => {
        const headers = { prefer: 'custom-prefer-header', accept: 'custom-accept-header', 'x-header': 'custom-x-header' }
        const patchInstance = new GenericModel(data, makeRequestCB, ['id'])
        patchInstance.data.name = 'client321'
        await patchInstance.$nextTick()
        patchInstance.patch.call({}, { headers })
        expect(makeRequestCB.mock.calls[0][2].headers).toEqual(headers)
      })
    })

    describe('called without argument', () => {
      it('does not send a patch request if data was not changed', async () => {
        const patchInstance = new GenericModel(data, makeRequestCB, ['id'])
        await patchInstance.patch.call()
        expect(makeRequestCB.mock.calls.length).toBe(0)

        const patchInstance2 = new GenericModel(data, makeRequestCB, ['id'])
        patchInstance2.name = 'client321'
        patchInstance2.name = 'client123'
        await patchInstance.$nextTick()
        await patchInstance2.patch.call()
        expect(makeRequestCB.mock.calls.length).toBe(0)
      })

      describe('sends a patch request for the specified entity to the relevant endpoint for changed', () => {
        it('simple data fields', async () => {
          const patchInstance = new GenericModel(data, makeRequestCB, ['id'])
          patchInstance.data.name = 'client321'
          await patchInstance.$nextTick()
          await patchInstance.patch.call()
          expect(makeRequestCB.mock.calls.length).toBe(1)
          expect(makeRequestCB.mock.calls[0][1]).toEqual({ id: 'eq.' + data.id, columns: ['name'] })
          expect(makeRequestCB.mock.calls[0][0]).toBe('PATCH')
          expect(makeRequestCB.mock.calls[0][3]).toEqual({
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
              nestedField: cloneDeep(nestedField)
            }, makeRequestCB, ['id'])
            const newNestedField = {
              newParent: {
                newChild: 'new'
              },
              newSibling: 'new'
            }
            patchInstance.data.nestedField = cloneDeep(newNestedField)
            await patchInstance.$nextTick()
            await patchInstance.patch.call()
            expect(makeRequestCB.mock.calls.length).toBe(1)
            expect(makeRequestCB.mock.calls[0][3]).toEqual({
              nestedField: newNestedField
            })
          })

          it('of whom only a subfield is changed', async () => {
            const patchInstance = new GenericModel({
              ...data,
              nestedField: cloneDeep(nestedField)
            }, makeRequestCB, ['id'])
            patchInstance.data.nestedField.parent.child = 'new'
            await patchInstance.$nextTick()
            await patchInstance.patch.call()
            expect(makeRequestCB.mock.calls.length).toBe(1)
            expect(makeRequestCB.mock.calls[0][3]).toEqual({
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
            }, makeRequestCB, ['id'])
            patchInstance.data.nestedField[0] = 2
            patchInstance.data.nestedField.push(20)
            await patchInstance.$nextTick()
            await patchInstance.patch.call()
            expect(makeRequestCB.mock.calls.length).toBe(1)
            expect(makeRequestCB.mock.calls[0][3]).toEqual({ nestedField: [2, 5, 10, 20] })
          })

          it('with nested values', async () => {
            const patchInstance = new GenericModel({
              ...data,
              nestedField: [{
                child: 'old'
              }, 5, 10]
            }, makeRequestCB, ['id'])
            patchInstance.data.nestedField[0].child = 'new'
            await patchInstance.$nextTick()
            await patchInstance.patch.call()
            expect(makeRequestCB.mock.calls.length).toBe(1)
            expect(makeRequestCB.mock.calls[0][3]).toEqual({
              nestedField: [{
                child: 'new'
              }, 5, 10]
            })
          })
        })
      })
    })

    describe('called with argument', () => {
      it('throws if argument is not an object', async () => {
        const patchInstance = new GenericModel(data, makeRequestCB, ['id'])
        await expect(patchInstance.patch.call(1)).rejects.toThrow()
        await expect(patchInstance.patch.call([])).rejects.toThrow()
      })

      describe('sends a patch request for the specified entity to the relevant endpoint for changed', () => {
        it('data fields, merged with argument (takes precedence)', async () => {
          const patchInstance = new GenericModel(data, makeRequestCB, ['id'])
          patchInstance.data.name = 'client321'
          patchInstance.data.age = 66
          await patchInstance.$nextTick()
          await patchInstance.patch.call({
            name: 'client 222',
            newField: true
          })
          expect(makeRequestCB.mock.calls.length).toBe(1)
          expect(makeRequestCB.mock.calls[0][1]).toEqual({ id: 'eq.' + data.id, columns: ['name', 'age', 'newField'] })
          expect(makeRequestCB.mock.calls[0][0]).toBe('PATCH')
          expect(makeRequestCB.mock.calls[0][3]).toEqual({
            name: 'client 222',
            age: 66,
            newField: true
          })
        })
      })
    })

    it('updates the patched instance when arg "sync" is true', async () => {
      const patchInstance = new GenericModel(data, makeRequestCB, ['id'])
      patchInstance.data.name = 'client321'
      await patchInstance.$nextTick()
      makeRequestCB.mockReturnValueOnce({
        body: [{
          ...data,
          name: 'client321'
        }]
      })
      await patchInstance.patch.call()
      expect(makeRequestCB.mock.calls.length).toBe(1)
      patchInstance.reset()
      expect(patchInstance.data).toEqual({
        ...data,
        name: 'client321'
      })
    })

    it('resets the patched instance when arg "sync" is false', async () => {
      const patchInstance = new GenericModel(data, makeRequestCB, ['id'])
      patchInstance.data.name = 'client321'
      await patchInstance.$nextTick()
      await patchInstance.patch.call({}, {}, false)
      expect(makeRequestCB.mock.calls.length).toBe(1)
      expect(patchInstance.data).toEqual({
        ...data,
        name: 'client123'
      })
    })

    it('returns the requests return value', async () => {
      const patchInstance = new GenericModel(data, makeRequestCB, ['id'])
      patchInstance.data.name = 'client321'
      await patchInstance.$nextTick()
      const mockReturn = {
        body: [{
          ...data,
          name: 'client321'
        }]
      }
      makeRequestCB.mockReturnValueOnce(mockReturn)
      const ret = await patchInstance.patch.call()
      expect(ret).toEqual(mockReturn)
    })
  })

  describe('Delete method', () => {
    it('sends a delete request for the specified entity to the relevant endpoint', async () => {
      const deleteInstance = new GenericModel(data, makeRequestCB, ['id'])
      await deleteInstance.delete.call()
      expect(makeRequestCB.mock.calls.length).toBe(1)
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ id: 'eq.' + data.id })
      expect(makeRequestCB.mock.calls[0][0]).toBe('DELETE')

      const deleteInstance2 = new GenericModel(data, makeRequestCB, ['name', 'age'])
      await deleteInstance2.delete.call()
      expect(makeRequestCB.mock.calls.length).toBe(2)
      expect(makeRequestCB.mock.calls[1][1]).toEqual({
        name: 'eq.' + data.name,
        age: 'eq.' + data.age
      })
      expect(makeRequestCB.mock.calls[1][0]).toBe('DELETE')
    })

    it('parses "return" option correctly', async () => {
      const deleteInstance = new GenericModel(data, makeRequestCB, ['id'])
      await deleteInstance.$nextTick()
      await deleteInstance.delete.call()
      expect(makeRequestCB.mock.calls[0][2].return).toBe(undefined)
      await deleteInstance.delete.call({ return: 'representation' })
      expect(makeRequestCB.mock.calls[1][2].return).toBe('representation')
      await deleteInstance.delete.call({ return: 'minimal' })
      expect(makeRequestCB.mock.calls[2][2].return).toBe('minimal')
    })

    it('sets select part of query if return is "representation"', async () => {
      const select = ['id', 'name']
      const deleteInstance = new GenericModel(data, makeRequestCB, ['id'], select)
      await deleteInstance.$nextTick()
      await deleteInstance.delete.call({ return: 'representation' })
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ id: 'eq.' + data.id, select })
    })

    it('does not set select part of query if return is not "representation"', async () => {
      const select = ['id', 'name']
      const deleteInstance = new GenericModel(data, makeRequestCB, ['id'], select)
      await deleteInstance.$nextTick()
      await deleteInstance.delete.call({ return: 'minimal' })
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ id: 'eq.' + data.id })
      await deleteInstance.delete.call()
      expect(makeRequestCB.mock.calls[1][1]).toEqual({ id: 'eq.' + data.id })
    })

    describe('"headers" option', () => {
      it('is passed as is to request method when set', async () => {
        const headers = { prefer: 'custom-prefer-header', accept: 'custom-accept-header', 'x-header': 'custom-x-header' }
        const deleteInstance = new GenericModel(data, makeRequestCB, ['id'])
        await deleteInstance.$nextTick()
        deleteInstance.delete.call({ headers })
        expect(makeRequestCB.mock.calls[0][2].headers).toEqual(headers)
      })
    })

    it('returns the requests return value', async () => {
      const deleteInstance = new GenericModel(data, makeRequestCB, ['id'])
      const mockReturn = {
        body: [{
          ...data,
          name: 'client321',
          id: 321
        }]
      }
      makeRequestCB.mockReturnValueOnce(mockReturn)
      const ret = await deleteInstance.delete.call()
      expect(ret).toEqual(mockReturn)
    })
  })
})
