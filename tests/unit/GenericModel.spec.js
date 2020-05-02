import Vue from 'vue'
import GenericModel from '@/GenericModel'
import Schema from '@/Schema'
import ObservableFunction from '@/ObservableFunction'

import request from '@/request'
jest.mock('@/request')

const data = {
  id: 123,
  name: 'client123',
  age: 50,
  level: 10
}

const mockReturn = {
  ...data,
  name: 'client321',
  id: 321,
  obj: { test: 'test' }
}

request.mockReturnValue({
  json: async () => mockReturn
})

describe('GenericModel', () => {
  const schema = new Schema('/api')
  const route = schema.$route('clients')
  beforeAll(async () => {
    await route.$ready
  })
  beforeEach(() => {
    request.mockClear()
  })

  describe('Data', () => {
    it('sets the data field getters and setters on property "data"', () => {
      const model = new GenericModel(data, { route })
      for (const prop in data) {
        expect(model[prop]).toBe(data[prop])
        model[prop] = 'test'
        expect(model[prop]).toBe('test')
      }
    })

    it('has property "$isDirty" which defaults to false', () => {
      const model = new GenericModel(data, { route })
      expect(model.$isDirty).toBe(false)
    })

    it('sets prop "$isDirty" correctly', async () => {
      const model = new GenericModel(data, { route })
      expect(model.$isDirty).toBe(false)
      model.name = 'client321'
      await Vue.nextTick()
      expect(model.$isDirty).toBe(true)
      model.name = data.name
      await Vue.nextTick()
      expect(model.$isDirty).toBe(false)
    })
  })

  describe('Reset method', () => {
    it('has method "reset"', () => {
      const model = new GenericModel(data, { route })
      expect(model.$reset).toBeInstanceOf(Function)
    })

    it('resets changes', async () => {
      const model = new GenericModel(data, { route })
      model.name = 'client321'
      await Vue.nextTick()
      expect(model.name).toBe('client321')
      model.$reset()
      expect(model.name).toBe('client123')
    })
  })

  describe('Get method', () => {
    it('has observable method "get"', () => {
      const model = new GenericModel(data, { route })
      expect(model.$get).toBeInstanceOf(Function)
    })

    it('throws for invalid route', async () => {
      const route = schema.$route('not-existing')
      const model = new GenericModel(data, { route })
      await expect(model.$get()).rejects.toThrow()
    })

    it('throws for route without pks', async () => {
      const route = schema('/pk-api').$route('no_pk')
      const model = new GenericModel(data, { route })
      await expect(model.$get()).rejects.toThrow()
    })

    it('throws if primary keys not available in data', async () => {
      const model = new GenericModel({
        name: 'client123',
        age: 50,
        level: 10
      }, { route })
      await expect(model.$get()).rejects.toThrow()
    })

    it('sends a get request', async () => {
      const model = new GenericModel(data, { route })
      await model.$get()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { 'id.eq': 123 }, { accept: 'single' })
    })

    it('passes options except accept and keepChanges', async () => {
      const model = new GenericModel(data, { route })
      const options = {
        headers: { prefer: 'custom-prefer-header', accept: 'custom-accept-header', 'x-header': 'custom-x-header' },
        keepChanges: false,
        accept: 'multiple'
      }
      await model.$get(options)
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { 'id.eq': 123 }, { headers: options.headers, accept: 'single' })
    })

    it('sets select part of query', async () => {
      const select = ['id', 'name']
      const model = new GenericModel(data, { route, select })
      await model.$get()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { 'id.eq': 123, select }, { accept: 'single' })
    })

    it('returns the request\'s return value and updates model data', async () => {
      const model = new GenericModel(data, { route })
      expect(model).toMatchObject(data)
      const ret = await model.$get()
      expect(ret).toEqual(mockReturn)
      expect(model).toMatchObject(mockReturn)
    })

    it('overwrites changes to the item data if option "keepChanges" is not set', async () => {
      const model = new GenericModel(data, { route })
      model.name = 'localName'
      await Vue.nextTick()
      await model.$get()
      expect(model.name).toBe(mockReturn.name)
    })

    it('overwrites changes to the item data if option "keepChanges" is false', async () => {
      const model = new GenericModel(data, { route })
      model.name = 'localName'
      await Vue.nextTick()
      await model.$get({ keepChanges: false })
      expect(model.name).toBe(mockReturn.name)
    })

    it('does not overwrite changes to the item data if option "keepChanges" is true', async () => {
      const model = new GenericModel(data, { route })
      model.name = 'localName'
      await Vue.nextTick()
      expect(model.name).toBe('localName')
      expect(model.id).toBe(123)
      await model.$get({ keepChanges: true })
      expect(model.name).toBe('localName')
      expect(model.id).toBe(321)
    })
  })

  describe('Post method', () => {
    it('has observable method "post"', () => {
      const model = new GenericModel(data, { route })
      expect(model.$post).toBeInstanceOf(ObservableFunction)
    })

    it('sends a post request', async () => {
      const model = new GenericModel(data, { route })
      model.$post()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', { columns: ['id', 'name', 'age', 'level'] }, { return: 'representation', accept: 'single' }, data)
    })

    it('sends a post request with changed data included', async () => {
      const model = new GenericModel(data, { route })
      model.name = 'client321'
      await Vue.nextTick()
      model.$post()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', { columns: ['id', 'name', 'age', 'level'] }, { return: 'representation', accept: 'single' }, {
        ...data,
        name: 'client321'
      })
    })

    it('passes options except accept', async () => {
      const model = new GenericModel(data, { route })
      const options = {
        return: 'minimal',
        headers: { prefer: 'custom-prefer-header', accept: 'custom-accept-header', 'x-header': 'custom-x-header' },
        accept: 'multiple'
      }
      await model.$post(options)
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', { columns: ['id', 'name', 'age', 'level'] }, { ...options, accept: 'single' }, data)
    })

    it('returns the request\'s return value', async () => {
      const model = new GenericModel(data, { route })
      const ret = await model.$post()
      expect(ret).toEqual(mockReturn)
    })

    it('updates data after request', async () => {
      const model = new GenericModel(data, { route })
      model.name = 'client321'
      await Vue.nextTick()
      await model.$post()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', { columns: ['id', 'name', 'age', 'level'] }, { return: 'representation', accept: 'single' }, {
        ...data,
        name: 'client321'
      })
      expect(model).toMatchObject(mockReturn)
    })

    it('sets select part of query if return is "representation"', async () => {
      const select = ['id', 'name']
      const model = new GenericModel(data, { route, select })
      model.$post({ return: 'representation' })
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', { columns: ['id', 'name', 'age', 'level'], select }, { return: 'representation', accept: 'single' }, data)
    })

    it('does not set select part of query if return is "minimal"', async () => {
      const select = ['id', 'name']
      const model = new GenericModel(data, { route, select })
      await model.$post({ return: 'minimal' })
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', { columns: ['id', 'name', 'age', 'level'] }, { return: 'minimal', accept: 'single' }, data)
    })

    it('does not set columns part of query if option "columns" is set to undefined', async () => {
      const model = new GenericModel(data, { route })
      await model.$post({ columns: undefined })
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', {}, { return: 'representation', accept: 'single' }, data)
    })

    it('sets columns part of query to posted columns if option "columns" is not set', async () => {
      const model = new GenericModel(data, { route })
      await model.$post()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', { columns: ['id', 'name', 'age', 'level'] }, { return: 'representation', accept: 'single' }, data)
    })

    it('sets columns part of query to user-defined columns if option "columns" is set', async () => {
      const model = new GenericModel(data, { route })
      await model.$post({ columns: ['age'] })
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', { columns: ['age'] }, { return: 'representation', accept: 'single' }, data)
    })
  })

  describe('Patch method', () => {
    it('has observable method "patch"', () => {
      const model = new GenericModel(data, { route })
      expect(model.$patch).toBeInstanceOf(ObservableFunction)
    })

    it('throws for invalid route', async () => {
      const route = schema.$route('not-existing')
      const model = new GenericModel(data, { route })
      await expect(model.$patch()).rejects.toThrow()
    })

    it('throws for route without pks', async () => {
      const route = schema('/pk-api').$route('no_pk')
      const model = new GenericModel(data, { route })
      await expect(model.$patch()).rejects.toThrow()
    })

    it('throws if primary keys not available in data', async () => {
      const model = new GenericModel({
        name: 'client123',
        age: 50,
        level: 10
      }, { route })
      await expect(model.$patch()).rejects.toThrow()
    })

    describe('called without data', () => {
      it('does not send a patch request if no data was changed', async () => {
        const model = new GenericModel(data, { route })
        await model.$patch()
        expect(request).not.toHaveBeenCalled()
      })

      it('sends a patch request with simple data fields', async () => {
        const model = new GenericModel(data, { route })
        model.name = 'client321'
        await Vue.nextTick()
        await model.$patch()
        expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123, columns: ['name'] }, { return: 'representation', accept: 'single' }, {
          name: 'client321'
        })
      })

      describe('sends a patch request with nested data fields', () => {
        const nestedField = {
          parent: {
            child: 'old'
          },
          sibling: 'old'
        }

        it('that are changed as a whole', async () => {
          const model = new GenericModel({
            ...data,
            nestedField: nestedField
          }, { route })
          const newNestedField = {
            newParent: {
              newChild: 'new'
            },
            newSibling: 'new'
          }
          model.nestedField = newNestedField
          await Vue.nextTick()
          await model.$patch()
          expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123, columns: ['nestedField'] }, { return: 'representation', accept: 'single' }, { nestedField: newNestedField })
        })

        it('of whom only a subfield is changed', async () => {
          const model = new GenericModel({
            ...data,
            nestedField
          }, { route })
          model.nestedField.parent.child = 'new'
          await Vue.nextTick()
          await model.$patch()
          expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123, columns: ['nestedField'] }, { return: 'representation', accept: 'single' }, {
            nestedField: {
              parent: {
                child: 'new'
              },
              sibling: 'old'
            }
          })
        })
      })

      describe('sends a patch request with array data fields', () => {
        it('with primitive values', async () => {
          const model = new GenericModel({
            ...data,
            nestedField: [1, 5, 10]
          }, { route })
          model.nestedField[0] = 2
          model.nestedField.push(20)
          await Vue.nextTick()
          await model.$patch()
          expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123, columns: ['nestedField'] }, { return: 'representation', accept: 'single' }, {
            nestedField: [2, 5, 10, 20]
          })
          expect(request.mock.calls.length).toBe(1)
        })

        it('with nested values', async () => {
          const model = new GenericModel({
            ...data,
            nestedField: [{ child: 'old' }, 5, 10]
          }, { route })
          model.nestedField[0].child = 'new'
          await Vue.nextTick()
          await model.$patch()
          expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123, columns: ['nestedField'] }, { return: 'representation', accept: 'single' }, {
            nestedField: [{ child: 'new' }, 5, 10]
          })
        })
      })
    })

    describe('called with data', () => {
      it('throws if argument is not an object', async () => {
        const model = new GenericModel(data, { route })
        await expect(model.$patch(null)).rejects.toThrow()
        await expect(model.$patch(1)).rejects.toThrow()
      })

      it('sends a patch request with argument', async () => {
        const model = new GenericModel(data, { route })
        await model.$patch({
          name: 'client 222',
          newField: true
        })
        expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123, columns: ['name', 'newField'] }, { return: 'representation', accept: 'single' }, {
          name: 'client 222',
          newField: true
        })
      })

      it('does not send a patch request for keys with value undefined', async () => {
        const model = new GenericModel(data, { route })
        await model.$patch({ key: undefined })
        expect(request).not.toHaveBeenCalled()
      })

      it('merges argument with changed data fields', async () => {
        const model = new GenericModel(data, { route })
        model.name = 'client321'
        model.age = 66
        await Vue.nextTick()
        await model.$patch({
          name: 'client 222',
          newField: true
        })
        expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123, columns: ['name', 'age', 'newField'] }, { return: 'representation', accept: 'single' }, {
          name: 'client 222',
          age: 66,
          newField: true
        })
      })
    })

    describe('options', () => {
      it('passes options except accept', async () => {
        const model = new GenericModel(data, { route })
        model.name = 'client321'
        await Vue.nextTick()
        const options = {
          return: 'minimal',
          headers: { prefer: 'custom-prefer-header', accept: 'custom-accept-header', 'x-header': 'custom-x-header' },
          accept: 'multiple'
        }
        await model.$patch({}, options)
        expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123, columns: ['name'] }, { ...options, accept: 'single' }, {
          name: 'client321'
        })
      })

      it('sets select part of query if return is "representation"', async () => {
        const select = ['id', 'name']
        const model = new GenericModel(data, { route, select })
        model.name = 'client321'
        await Vue.nextTick()
        await model.$patch({}, { return: 'representation' })
        expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123, columns: ['name'], select }, { return: 'representation', accept: 'single' }, {
          name: 'client321'
        })
      })

      it('does not set select part of query if return is "minimal"', async () => {
        const select = ['id', 'name']
        const model = new GenericModel(data, { route, select })
        model.name = 'client321'
        await Vue.nextTick()
        await model.$patch({}, { return: 'minimal' })
        expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123, columns: ['name'] }, { return: 'minimal', accept: 'single' }, {
          name: 'client321'
        })
      })

      it('does not set columns part of query if option "columns" is set to undefined', async () => {
        const model = new GenericModel(data, { route })
        model.name = 'client321'
        await Vue.nextTick()
        await model.$patch({}, { columns: undefined })
        expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123 }, { return: 'representation', accept: 'single' }, {
          name: 'client321'
        })
      })

      it('sets columns part of query to patched columns if option "columns" is not set', async () => {
        const model = new GenericModel(data, { route })
        model.name = 'client321'
        await Vue.nextTick()
        await model.$patch()
        expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123, columns: ['name'] }, { return: 'representation', accept: 'single' }, {
          name: 'client321'
        })
      })

      it('sets columns part of query to user-defined columns if option "columns" is set', async () => {
        const model = new GenericModel(data, { route })
        model.name = 'client321'
        await Vue.nextTick()
        await model.$patch({}, { columns: ['age'] })
        expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123, columns: ['age'] }, { return: 'representation', accept: 'single' }, {
          name: 'client321'
        })
      })

      it('updates model when return is "representation"', async () => {
        const model = new GenericModel(data, { route })
        model.name = 'client321'
        await Vue.nextTick()
        await model.$patch({}, { return: 'representation' })
        expect(request).toHaveBeenCalled()
        model.$reset()
        expect(model).toMatchObject(mockReturn)
      })

      it('resets model when return is "minimal"', async () => {
        const model = new GenericModel(data, { route })
        model.name = 'client321'
        await Vue.nextTick()
        await model.$patch({}, { return: 'minimal' })
        expect(request).toHaveBeenCalled()
        expect(model).toMatchObject(data)
      })
    })

    it('returns the request\'s return value', async () => {
      const model = new GenericModel(data, { route })
      model.name = 'client321'
      await Vue.nextTick()
      const ret = await model.$patch()
      expect(ret).toEqual(mockReturn)
    })
  })

  describe('Delete method', () => {
    it('has observable method "delete"', () => {
      const model = new GenericModel(data, { route })
      expect(model.$delete).toBeInstanceOf(ObservableFunction)
    })

    it('throws for invalid route', async () => {
      const route = schema.$route('not-existing')
      const model = new GenericModel(data, { route })
      await expect(model.$delete()).rejects.toThrow()
    })

    it('throws for route without pks', async () => {
      const route = schema('/pk-api').$route('no_pk')
      const model = new GenericModel(data, { route })
      await expect(model.$delete()).rejects.toThrow()
    })

    it('throws if primary keys not available in data', async () => {
      const model = new GenericModel({
        name: 'client123',
        age: 50,
        level: 10
      }, { route })
      await expect(model.$delete()).rejects.toThrow()
    })

    it('sends a delete request', async () => {
      const model = new GenericModel(data, { route })
      await model.$delete()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'DELETE', { 'id.eq': 123 }, { accept: 'single' })
    })

    it('passes options except accept', async () => {
      const model = new GenericModel(data, { route })
      const options = {
        return: 'representation',
        headers: { prefer: 'custom-prefer-header', accept: 'custom-accept-header', 'x-header': 'custom-x-header' },
        accept: 'multiple'
      }
      await model.$delete(options)
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'DELETE', { 'id.eq': 123 }, { ...options, accept: 'single' })
    })

    it('sets select part of query if return is "representation"', async () => {
      const select = ['id', 'name']
      const model = new GenericModel(data, { route, select })
      await model.$delete({ return: 'representation' })
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'DELETE', { 'id.eq': 123, select }, { return: 'representation', accept: 'single' })
    })

    it('does not set select part of query if return is not "representation"', async () => {
      const select = ['id', 'name']
      const model = new GenericModel(data, { route, select })
      await model.$delete({ return: 'minimal' })
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'DELETE', { 'id.eq': 123 }, { return: 'minimal', accept: 'single' })
      await model.$delete()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'DELETE', { 'id.eq': 123 }, { accept: 'single' })
    })

    it('returns the request\'s return value', async () => {
      const model = new GenericModel(data, { route })
      const ret = await model.$delete()
      expect(ret).toEqual(mockReturn)
    })
  })
})
