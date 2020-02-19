import PrimaryKeyError from '@/errors/PrimaryKeyError'
import FieldNotExistsError from '@/errors/FieldNotExistsError'
import GenericModel from '@/models/GenericModel'

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

  const instance = new GenericModel(data, primaryKeys, makeRequestCB)

  describe('Instance', () => {
    it('sets the data field getters and setters on instance property "data"', () => {
      for (let prop in data) {
        expect(instance.data[prop]).toBe(data[prop])
        instance.data[prop] = 'test'
        expect(instance.data[prop]).toBe('test')
      }
    })

    it('sets the second constructor argument to instance property "primaryKeys"', () => {
      expect(instance.primaryKeys).toBe(primaryKeys)
    })

    it('throws "PrimaryKeyError" if primary key is not valid', async () => {
      expect.assertions(1)
      try {
        new GenericModel(data, ['not-existing'], makeRequestCB)
      } catch (e) {
        expect(e instanceof PrimaryKeyError).toBeTruthy()
      }
    })

    it('sets the third constructor argument to instance method "request"', () => {
      expect(instance.request).toEqual(makeRequestCB)
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
      const patchInstance = new GenericModel(data, ['id'], makeRequestCB)
      patchInstance.data.name = 'client321'
      expect(patchInstance.data.name).toBe('client321')
      patchInstance.reset()
      expect(patchInstance.data.name).toBe('client123')
    })
  })

  describe('Patch method', () => {
    describe('called without argument', () => {
      it('does not send a patch request if data was not changed', async () => {
        const patchInstance = new GenericModel(data, ['id'], makeRequestCB)
        await patchInstance.patch.call()
        expect(makeRequestCB.mock.calls.length).toBe(0)

        const patchInstance2 = new GenericModel(data, ['id'], makeRequestCB)
        patchInstance2.name = 'client321'
        patchInstance2.name = 'client123'
        await patchInstance2.patch.call()
        expect(makeRequestCB.mock.calls.length).toBe(0)
      })

      describe('sends a patch request for the specified entity to the relevant endpoint for changed', () => {
        it('simple data fields', async () => {
          const patchInstance = new GenericModel(data, ['id'], makeRequestCB)
          patchInstance.data.name = 'client321'
          await patchInstance.patch.call()
          expect(makeRequestCB.mock.calls.length).toBe(1)
          expect(makeRequestCB.mock.calls[0][1]).toEqual({ id: 'eq.' + data.id })
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
              nestedField
            }, ['id'], makeRequestCB)
            const newNestedField = {
              newParent: {
                newChild: 'new'
              },
              newSibling: 'new'
            }
            patchInstance.data.nestedField = newNestedField
            await patchInstance.patch.call()
            expect(makeRequestCB.mock.calls.length).toBe(1)
            expect(makeRequestCB.mock.calls[0][3]).toEqual({ nestedField: newNestedField })
          })

          it('of whom only a subfield is changed', async () => {
            const patchInstance = new GenericModel({
              ...data,
              nestedField
            }, ['id'], makeRequestCB)
            patchInstance.data.nestedField.parent.set('child', 'new')
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
            }, ['id'], makeRequestCB)
            patchInstance.data.nestedField.set(0, 2)
            patchInstance.data.nestedField.push(20)
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
            }, ['id'], makeRequestCB)
            patchInstance.data.nestedField[0].set('child', 'new')
            await patchInstance.patch.call()
            expect(makeRequestCB.mock.calls.length).toBe(1)
            expect(makeRequestCB.mock.calls[0][3]).toEqual({ nestedField: [{
              child: 'new'
            }, 5, 10] })
          })
        })
      })
    })

    describe('called with argument', () => {
      it('throws if argument is not an object', async () => {
        const patchInstance = new GenericModel(data, ['id'], makeRequestCB)
        await expect(patchInstance.patch.call(1)).rejects.toThrow()
        await expect(patchInstance.patch.call([])).rejects.toThrow()
      })

      describe('sends a patch request for the specified entity to the relevant endpoint for changed', () => {
        it('data fields, merged with argument (takes precedence)', async () => {
          const patchInstance = new GenericModel(data, ['id'], makeRequestCB)
          patchInstance.data.name = 'client321'
          patchInstance.data.age = 66
          await patchInstance.patch.call({
            name: 'client 222',
            newField: true
          })
          expect(makeRequestCB.mock.calls.length).toBe(1)
          expect(makeRequestCB.mock.calls[0][1]).toEqual({ id: 'eq.' + data.id })
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
      const patchInstance = new GenericModel(data, ['id'], makeRequestCB)
      patchInstance.data.name = 'client321'
      makeRequestCB.mockReturnValueOnce({ body: [{
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
      const patchInstance = new GenericModel(data, ['id'], makeRequestCB)
      patchInstance.data.name = 'client321'
      await patchInstance.patch.call({}, { sync: false })
      expect(makeRequestCB.mock.calls.length).toBe(1)
      expect(patchInstance.data).toEqual({
        ...data,
        name: 'client123'
      })
    })
  })

  describe('Delete method', () => {
    it('sends a delete request for the specified entity to the relevant endpoint', async () => {
      const deleteInstance = new GenericModel(data, ['id'], makeRequestCB)
      await deleteInstance.delete.call()
      expect(makeRequestCB.mock.calls.length).toBe(1)
      expect(makeRequestCB.mock.calls[0][1]).toEqual({ id: 'eq.' + data.id })
      expect(makeRequestCB.mock.calls[0][0]).toBe('DELETE')

      const deleteInstance2 = new GenericModel(data, ['name', 'age'], makeRequestCB)
      await deleteInstance2.delete.call()
      expect(makeRequestCB.mock.calls.length).toBe(2)
      expect(makeRequestCB.mock.calls[1][1]).toEqual({
        name: 'eq.' + data.name,
        age: 'eq.' + data.age
      })
      expect(makeRequestCB.mock.calls[1][0]).toBe('DELETE')
    })
  })

  describe('Reset method', () => {})
})
