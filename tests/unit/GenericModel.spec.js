import Vue from 'vue'
import { shallowMount } from '@vue/test-utils'
import GenericModel from '@/GenericModel'
import ObservableFunction from '@/ObservableFunction'
import Schema from '@/Schema'
import { PrimaryKeyError } from '@/index'

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
  json: async () => mockReturn,
  headers: new Headers()
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
    it('sets the data field getters and setters', () => {
      const model = new GenericModel({ route }, data)
      for (const prop in data) {
        expect(model[prop]).toBe(data[prop])
        model[prop] = 'test'
        expect(model[prop]).toBe('test')
      }
    })

    it('resets the data fields for "delete"', () => {
      const model = new GenericModel({ route }, data)
      for (const prop in data) {
        model[prop] = 'test'
        expect(model[prop]).toBe('test')
        delete model[prop]
        expect(prop in model).toBe(true)
        expect(model[prop]).toBe(data[prop])
      }
    })

    it('adds and deletes new data fields correctly', () => {
      const model = new GenericModel({ route }, data)
      model.new = 'value'
      expect('new' in model).toBe(true)
      expect(model.new).toBe('value')
      delete model.new
      expect('new' in model).toBe(false)
      expect(model.new).toBeUndefined()
    })

    it('has property "$isDirty" which defaults to false', () => {
      const model = new GenericModel({ route }, data)
      expect(model.$isDirty).toBe(false)
    })

    it('property "$isDirty" is from prototpe and not configurable, writable or deletable', () => {
      const model = new GenericModel({ route }, data)
      expect(Reflect.getOwnPropertyDescriptor(model, '$isDirty')).toBeUndefined()
      expect('$isDirty' in model).toBe(true)
      expect(() => {
        model.$isDirty = 'writable'
      }).toThrow()
      expect(() => {
        Object.defineProperty(model, '$isDirty', { value: 'configurable' })
      }).toThrow()
      expect(() => {
        delete model.$isDirty
      }).toThrow()
    })

    it('sets prop "$isDirty" correctly', async () => {
      const model = new GenericModel({ route }, data)
      expect(model.$isDirty).toBe(false)
      model.name = 'client321'
      expect(model.$isDirty).toBe(true)
      model.name = data.name
      expect(model.$isDirty).toBe(false)
    })
  })

  describe('Vue reacts', () => {
    const Component = {
      render () {},
      data: () => ({ model: null }),
      mounted () {
        this.model = new GenericModel({ route }, data)
      }
    }
    let wrapper

    beforeEach(() => {
      wrapper = shallowMount(Component)
    })
    afterEach(() => wrapper.destroy())

    it('to changed fields', () => {
      expect.assertions(1)
      wrapper.vm.$watch('model.name', name => {
        expect(name).toBe('client321')
      })
      wrapper.vm.model.name = 'client321'
    })

    it('to new fields', () => {
      expect.assertions(1)
      wrapper.vm.$watch('model', model => {
        expect(model.new).toBe('value')
      }, {
        deep: true
      })
      wrapper.vm.$set(wrapper.vm.model, 'new', 'value')
    })

    it('to reset field via $delete', () => {
      expect.assertions(5)
      wrapper.vm.model.age += 1
      expect(wrapper.vm.model.age).toBe(51)
      expect(wrapper.vm.model.$isDirty).toBe(true)
      wrapper.vm.$watch('model', model => {
        expect('age' in model).toBe(true)
        expect(model.age).toBe(50)
        expect(model.$isDirty).toBe(false)
      }, {
        deep: true
      })
      wrapper.vm.$delete(wrapper.vm.model, 'age')
    })

    it('to reset field via $set', () => {
      expect.assertions(4)
      wrapper.vm.model.age += 1
      expect(wrapper.vm.model.age).toBe(51)
      expect(wrapper.vm.model.$isDirty).toBe(true)
      wrapper.vm.$watch('model', model => {
        expect(model.age).toBe(50)
        expect(model.$isDirty).toBe(false)
      }, {
        deep: true
      })
      wrapper.vm.$set(wrapper.vm.model, 'age', 50)
    })
  })

  describe('Reset method', () => {
    it('has method "$reset"', () => {
      const model = new GenericModel({ route }, data)
      expect(model.$reset).toBeInstanceOf(Function)
    })

    it('property "$reset" is from prototpe and not configurable, writable or deletable', () => {
      const model = new GenericModel({ route }, data)
      expect(Reflect.getOwnPropertyDescriptor(model, '$reset')).toBeUndefined()
      expect('$reset' in model).toBe(true)
      expect(() => {
        model.$reset = 'writable'
      }).toThrow()
      expect(() => {
        Object.defineProperty(model, '$reset', { value: 'configurable' })
      }).toThrow()
      expect(() => {
        delete model.$reset
      }).toThrow()
    })

    it('resets changes', async () => {
      const model = new GenericModel({ route }, data)
      model.name = 'client321'
      expect(model.name).toBe('client321')
      model.$reset()
      expect(model.name).toBe('client123')
    })

    it('resets changes to arrays', async () => {
      const model = new GenericModel({ route }, { ...data, arr: [] })
      model.arr = ['a', 'b', 'c', 'd', 'e']
      expect(model.arr).toEqual(['a', 'b', 'c', 'd', 'e'])
      model.$reset()
      expect(model.arr).toEqual([])
    })
  })

  describe('Get method', () => {
    it('has observable method "$get"', () => {
      const model = new GenericModel({ route }, data)
      expect(model.$get).toBeInstanceOf(ObservableFunction)
    })

    it('property "$get" is from prototpe and not configurable, writable or deletable', () => {
      const model = new GenericModel({ route }, data)
      expect(Reflect.getOwnPropertyDescriptor(model, '$get')).toBeUndefined()
      expect('$get' in model).toBe(true)
      expect(() => {
        model.$get = 'writable'
      }).toThrow()
      expect(() => {
        Object.defineProperty(model, '$get', { value: 'configurable' })
      }).toThrow()
      expect(() => {
        delete model.$get
      }).toThrow()
    })

    it('throws for invalid route', async () => {
      const route = schema.$route('not-existing')
      const model = new GenericModel({ route }, data)
      await expect(model.$get()).rejects.toThrow()
    })

    it('throws for route without pks', async () => {
      const route = schema('/pk-api').$route('no_pk')
      const model = new GenericModel({ route }, data)
      await expect(model.$get()).rejects.toThrow(PrimaryKeyError)
    })

    it('throws if primary keys not available in data', async () => {
      const model = new GenericModel({ route }, {
        name: 'client123',
        age: 50,
        level: 10
      })
      await expect(model.$get()).rejects.toThrow(PrimaryKeyError)
    })

    it('sends a get request with PK query', async () => {
      const model = new GenericModel({ route }, data)
      await model.$get()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { 'id.eq': 123 }, { accept: 'single', signal: expect.any(AbortSignal) })
    })

    it('sends a get request with original PK query after change', async () => {
      const model = new GenericModel({ route }, data)
      model.id = 321
      await model.$get()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { 'id.eq': 123 }, { accept: 'single', signal: expect.any(AbortSignal) })
    })

    it('passes options except accept and keepChanges', async () => {
      const model = new GenericModel({ route }, data)
      const options = {
        headers: { prefer: 'custom-prefer-header', accept: 'custom-accept-header', 'x-header': 'custom-x-header' },
        keepChanges: false,
        accept: 'multiple'
      }
      await model.$get(options)
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { 'id.eq': 123 }, { headers: options.headers, accept: 'single', signal: expect.any(AbortSignal) })
    })

    it('sets select part of query', async () => {
      const select = ['id', 'name']
      const model = new GenericModel({ route, select }, data)
      await model.$get()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { 'id.eq': 123, select }, { accept: 'single', signal: expect.any(AbortSignal) })
    })

    it('returns the request\'s return value and updates model data', async () => {
      const model = new GenericModel({ route }, data)
      expect(model).toMatchObject(data)
      const ret = await model.$get()
      expect(ret).toEqual(mockReturn)
      expect(model).toMatchObject(mockReturn)
    })

    it('overwrites changes to the item data if option "keepChanges" is not set', async () => {
      const model = new GenericModel({ route }, data)
      model.name = 'localName'
      await model.$get()
      expect(model.name).toBe(mockReturn.name)
    })

    it('overwrites changes to the item data if option "keepChanges" is false', async () => {
      const model = new GenericModel({ route }, data)
      model.name = 'localName'
      await model.$get({ keepChanges: false })
      expect(model.name).toBe(mockReturn.name)
    })

    it('does not overwrite changes to the item data if option "keepChanges" is true', async () => {
      const model = new GenericModel({ route }, data)
      model.name = 'localName'
      expect(model.name).toBe('localName')
      expect(model.id).toBe(123)
      await model.$get({ keepChanges: true })
      expect(model.name).toBe('localName')
      expect(model.id).toBe(321)
    })
  })

  describe('Post method', () => {
    it('has observable method "$post"', () => {
      const model = new GenericModel({ route }, data)
      expect(model.$post).toBeInstanceOf(ObservableFunction)
    })

    it('property "$post" is from prototpe and not configurable, writable or deletable', () => {
      const model = new GenericModel({ route }, data)
      expect(Reflect.getOwnPropertyDescriptor(model, '$post')).toBeUndefined()
      expect('$post' in model).toBe(true)
      expect(() => {
        model.$post = 'writable'
      }).toThrow()
      expect(() => {
        Object.defineProperty(model, '$post', { value: 'configurable' })
      }).toThrow()
      expect(() => {
        delete model.$post
      }).toThrow()
    })

    it('sends a post request', async () => {
      const model = new GenericModel({ route }, data)
      await model.$post()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', {}, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, data)
    })

    it('sends a post request with changed data included', async () => {
      const model = new GenericModel({ route }, data)
      model.name = 'client321'
      await model.$post()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', {}, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
        ...data,
        name: 'client321'
      })
    })

    it('sends a post request with new data included', async () => {
      const model = new GenericModel({ route }, data)
      Vue.set(model, 'new', 'value')
      await model.$post()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', {}, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
        ...data,
        new: 'value'
      })
    })

    it('passes options except accept', async () => {
      const model = new GenericModel({ route }, data)
      const options = {
        return: 'minimal',
        headers: { prefer: 'custom-prefer-header', accept: 'custom-accept-header', 'x-header': 'custom-x-header' },
        accept: 'multiple'
      }
      await model.$post(options)
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', {}, { ...options, accept: 'single', signal: expect.any(AbortSignal) }, data)
    })

    it('sets select part of query if return is "representation"', async () => {
      const select = ['id', 'name']
      const model = new GenericModel({ route, select }, data)
      await model.$post({ return: 'representation' })
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', { select }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, data)
    })

    it('does not set columns part of query if option "columns" is set to undefined', async () => {
      const model = new GenericModel({ route }, data)
      await model.$post({ columns: undefined })
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', {}, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, data)
    })

    it('sets columns part of query to user-defined columns if option "columns" is set', async () => {
      const model = new GenericModel({ route }, data)
      await model.$post({ columns: ['age'] })
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', { columns: ['age'] }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, data)
    })

    it('only sends columns that exist on the endpoint', async () => {
      const model = new GenericModel({ route }, {
        ...data,
        embedded: []
      })
      await model.$post()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', {}, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, data)
    })

    it('understands column aliases in object select', async () => {
      const select = {
        'pk:id': true,
        'age:name': true,
        'name:age': true,
        level: false
      }
      const model = new GenericModel({ route, select }, {
        pk: 123,
        age: 'client123',
        name: 50,
        level: 10
      })
      await model.$post()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', { select }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
        id: 123,
        name: 'client123',
        age: 50,
        level: 10
      })
    })

    it('understands column aliases in string select', async () => {
      const select = 'pk:id,age:name,name:age,level'
      const model = new GenericModel({ route, select }, {
        pk: 123,
        age: 'client123',
        name: 50,
        level: 10
      })
      await model.$post()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', { select }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
        id: 123,
        name: 'client123',
        age: 50,
        level: 10
      })
    })

    it('still sends all columns if endpoint not known', async () => {
      const route = schema.$route('unknown')
      const model = new GenericModel({ route }, {
        ...data,
        embedded: []
      })
      await model.$post({ columns: ['age', 'embedded'] })
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'unknown', 'POST', { columns: ['age', 'embedded'] }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
        ...data,
        embedded: []
      })
    })

    it('updates data after request', async () => {
      const model = new GenericModel({ route }, data)
      model.name = 'client321'
      await model.$post()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'POST', {}, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
        ...data,
        name: 'client321'
      })
      expect(model).toMatchObject(mockReturn)
    })

    it('keeps data when return is "minimal"', async () => {
      request.mockReturnValueOnce({
        json: async () => { throw new Error() },
        headers: new Headers()
      })
      const model = new GenericModel({ route }, data)
      model.name = 'client321'
      await model.$post({ return: 'minimal' })
      expect(request).toHaveBeenCalled()
      expect(model).toMatchObject({
        ...data,
        name: 'client321'
      })
    })

    it('returns the request\'s return value', async () => {
      const model = new GenericModel({ route }, data)
      const ret = await model.$post()
      expect(ret).toEqual(mockReturn)
    })

    it('returns the request\'s location header data with return=minimal', async () => {
      request.mockReturnValueOnce({
        json: async () => { throw new Error() },
        headers: new Headers({
          Location: '/clients?id=eq.321'
        })
      })
      const model = new GenericModel({ route }, data)
      const ret = await model.$post({ return: 'minimal' })
      expect(ret).toEqual({ id: '321' })
    })

    it('doesn\'t return the request\'s return value for return=minimal without Location header', async () => {
      request.mockReturnValueOnce({
        json: async () => { throw new Error() },
        headers: new Headers()
      })
      const model = new GenericModel({ route }, data)
      const ret = await model.$post({ return: 'minimal' })
      expect(ret).toBeUndefined()
    })
  })

  describe('Put method', () => {
    it('has observable method "$put"', () => {
      const model = new GenericModel({ route }, data)
      expect(model.$put).toBeInstanceOf(ObservableFunction)
    })

    it('property "$put" is from prototpe and not configurable, writable or deletable', () => {
      const model = new GenericModel({ route }, data)
      expect(Reflect.getOwnPropertyDescriptor(model, '$put')).toBeUndefined()
      expect('$put' in model).toBe(true)
      expect(() => {
        model.$put = 'writable'
      }).toThrow()
      expect(() => {
        Object.defineProperty(model, '$put', { value: 'configurable' })
      }).toThrow()
      expect(() => {
        delete model.$put
      }).toThrow()
    })

    it('throws for invalid route', async () => {
      const route = schema.$route('not-existing')
      const model = new GenericModel({ route }, data)
      await expect(model.$put()).rejects.toThrow()
    })

    it('throws for route without pks', async () => {
      const route = schema('/pk-api').$route('no_pk')
      const model = new GenericModel({ route }, data)
      await expect(model.$put()).rejects.toThrow(PrimaryKeyError)
    })

    it('throws if primary keys not available in data', async () => {
      const model = new GenericModel({ route }, {
        name: 'client123',
        age: 50,
        level: 10
      })
      await expect(model.$put()).rejects.toThrow(PrimaryKeyError)
    })

    it('sends a put request', async () => {
      const model = new GenericModel({ route }, data)
      await model.$put()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PUT', { 'id.eq': 123 }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, data)
    })

    it('sends a put request with changed data included', async () => {
      const model = new GenericModel({ route }, data)
      model.name = 'client321'
      await model.$put()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PUT', { 'id.eq': 123 }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
        ...data,
        name: 'client321'
      })
    })

    it('sends a put request with new data included', async () => {
      const model = new GenericModel({ route }, data)
      Vue.set(model, 'new', 'value')
      await model.$put()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PUT', { 'id.eq': 123 }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
        ...data,
        new: 'value'
      })
    })

    it('passes options except accept', async () => {
      const model = new GenericModel({ route }, data)
      const options = {
        return: 'minimal',
        headers: { prefer: 'custom-prefer-header', accept: 'custom-accept-header', 'x-header': 'custom-x-header' },
        accept: 'multiple'
      }
      await model.$put(options)
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PUT', { 'id.eq': 123 }, { ...options, accept: 'single', signal: expect.any(AbortSignal) }, data)
    })

    it('sets select part of query if return is "representation"', async () => {
      const select = ['id', 'name']
      const model = new GenericModel({ route, select }, data)
      await model.$put({ return: 'representation' })
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PUT', { 'id.eq': 123, select }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, data)
    })

    it('does not set columns part of query if option "columns" is set to undefined', async () => {
      const model = new GenericModel({ route }, data)
      await model.$put({ columns: undefined })
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PUT', { 'id.eq': 123 }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, data)
    })

    it('sets columns part of query to user-defined columns if option "columns" is set', async () => {
      const model = new GenericModel({ route }, data)
      await model.$put({ columns: ['age'] })
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PUT', { 'id.eq': 123, columns: ['age'] }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, data)
    })

    it('only sends columns that exist on the endpoint', async () => {
      const model = new GenericModel({ route }, {
        ...data,
        embedded: []
      })
      await model.$put()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PUT', { 'id.eq': 123 }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, data)
    })

    it('understands column aliases in object select', async () => {
      const select = {
        'pk:id': true,
        'age:name': true,
        'name:age': true,
        level: false
      }
      const model = new GenericModel({ route, select }, {
        pk: 123,
        age: 'client123',
        name: 50,
        level: 10
      })
      await model.$put()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PUT', { 'id.eq': 123, select }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
        id: 123,
        name: 'client123',
        age: 50,
        level: 10
      })
    })

    it('understands column aliases in string select', async () => {
      const select = 'pk:id,age:name,name:age,level'
      const model = new GenericModel({ route, select }, {
        pk: 123,
        age: 'client123',
        name: 50,
        level: 10
      })
      await model.$put()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PUT', { 'id.eq': 123, select }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
        id: 123,
        name: 'client123',
        age: 50,
        level: 10
      })
    })

    it('updates data after request', async () => {
      const model = new GenericModel({ route }, data)
      model.name = 'client321'
      await model.$put()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PUT', { 'id.eq': 123 }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
        ...data,
        name: 'client321'
      })
      expect(model).toMatchObject(mockReturn)
    })

    it('keeps data when return is "minimal"', async () => {
      request.mockReturnValueOnce({
        json: async () => { throw new Error() },
        headers: new Headers()
      })
      const model = new GenericModel({ route }, data)
      model.name = 'client321'
      await model.$put({ return: 'minimal' })
      expect(request).toHaveBeenCalled()
      expect(model).toMatchObject({
        ...data,
        name: 'client321'
      })
    })

    it('returns the request\'s return value', async () => {
      const model = new GenericModel({ route }, data)
      const ret = await model.$put()
      expect(ret).toEqual(mockReturn)
    })

    it('returns the request\'s location header data with return=minimal', async () => {
      request.mockReturnValueOnce({
        json: async () => { throw new Error() },
        headers: new Headers({
          Location: '/clients?id=eq.321'
        })
      })
      const model = new GenericModel({ route }, data)
      const ret = await model.$put({ return: 'minimal' })
      expect(ret).toEqual({ id: '321' })
    })

    it('doesn\'t return the request\'s return value for return=minimal without Location header', async () => {
      request.mockReturnValueOnce({
        json: async () => { throw new Error() },
        headers: new Headers()
      })
      const model = new GenericModel({ route }, data)
      const ret = await model.$put({ return: 'minimal' })
      expect(ret).toBeUndefined()
    })
  })

  describe('Patch method', () => {
    it('has observable method "$patch"', () => {
      const model = new GenericModel({ route }, data)
      expect(model.$patch).toBeInstanceOf(ObservableFunction)
    })

    it('property "$patch" is from prototpe and not configurable, writable or deletable', () => {
      const model = new GenericModel({ route }, data)
      expect(Reflect.getOwnPropertyDescriptor(model, '$patch')).toBeUndefined()
      expect('$patch' in model).toBe(true)
      expect(() => {
        model.$patch = 'writable'
      }).toThrow()
      expect(() => {
        Object.defineProperty(model, '$patch', { value: 'configurable' })
      }).toThrow()
      expect(() => {
        delete model.$patch
      }).toThrow()
    })

    it('throws for invalid route', async () => {
      const route = schema.$route('not-existing')
      const model = new GenericModel({ route }, data)
      await expect(model.$patch()).rejects.toThrow()
    })

    it('throws for route without pks', async () => {
      const route = schema('/pk-api').$route('no_pk')
      const model = new GenericModel({ route }, data)
      await expect(model.$patch()).rejects.toThrow(PrimaryKeyError)
    })

    it('throws if primary keys not available in data', async () => {
      const model = new GenericModel({ route }, {
        name: 'client123',
        age: 50,
        level: 10
      })
      await expect(model.$patch()).rejects.toThrow(PrimaryKeyError)
    })

    describe('called without data', () => {
      it('sends a patch request with simple changed data fields', async () => {
        const model = new GenericModel({ route }, data)
        model.name = 'client321'
        await model.$patch()
        expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123 }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
          name: 'client321'
        })
      })

      it('sends a patch request with simple new data fields', async () => {
        const model = new GenericModel({ route }, data)
        model.new = 'value'
        await model.$patch()
        expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123 }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
          new: 'value'
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
          const model = new GenericModel({ route }, {
            ...data,
            nestedField: nestedField
          })
          const newNestedField = {
            newParent: {
              newChild: 'new'
            },
            newSibling: 'new'
          }
          model.nestedField = newNestedField
          await model.$patch()
          expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123 }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, { nestedField: newNestedField })
        })

        it('of whom only a subfield is changed', async () => {
          const model = new GenericModel({ route }, {
            ...data,
            nestedField
          })
          model.nestedField.parent.child = 'new'
          await model.$patch()
          expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123 }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
            nestedField: {
              parent: {
                child: 'new'
              },
              sibling: 'old'
            }
          })
        })

        it('with a new subfield', async () => {
          const model = new GenericModel({ route }, {
            ...data,
            nestedField
          })
          model.nestedField.newField = 'new'
          expect(model.nestedField.newField).toBe('new')
          await model.$patch()
          expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123 }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
            nestedField: {
              ...nestedField,
              newField: 'new'
            }
          })
        })
      })

      describe('sends a patch request with array data fields', () => {
        it('with primitive values', async () => {
          const model = new GenericModel({ route }, {
            ...data,
            nestedField: [1, 5, 10]
          })
          model.nestedField[0] = 2
          model.nestedField.push(20)
          await model.$patch()
          expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123 }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
            nestedField: [2, 5, 10, 20]
          })
          expect(request.mock.calls.length).toBe(1)
        })

        it('with nested array', async () => {
          const model = new GenericModel({ route }, {
            ...data,
            nestedField: {
              arr: [1, 5, 10]
            }
          })
          model.nestedField.arr[0] = 2
          model.nestedField.arr.push(20)
          await model.$patch()
          expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123 }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
            nestedField: {
              arr: [2, 5, 10, 20]
            }
          })
          expect(request.mock.calls.length).toBe(1)
        })

        it('with nested values', async () => {
          const model = new GenericModel({ route }, {
            ...data,
            nestedField: [{ child: 'old' }, 5, 10]
          })
          model.nestedField[0].child = 'new'
          await model.$patch()
          expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123 }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
            nestedField: [{ child: 'new' }, 5, 10]
          })
        })
      })
    })

    describe('called with data', () => {
      it('throws if argument is not an object', async () => {
        const model = new GenericModel({ route }, data)
        await expect(model.$patch({}, null)).rejects.toThrow()
        await expect(model.$patch({}, 1)).rejects.toThrow()
      })

      it('sends a patch request with argument', async () => {
        const model = new GenericModel({ route }, data)
        await model.$patch({}, {
          name: 'client 222',
          new: true
        })
        expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123 }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
          name: 'client 222',
          new: true
        })
      })

      it('merges argument with changed data fields', async () => {
        const model = new GenericModel({ route }, data)
        model.name = 'client321'
        model.age = 66
        await model.$patch({}, {
          name: 'client 222',
          new: true
        })
        expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123 }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
          name: 'client 222',
          age: 66,
          new: true
        })
      })
    })

    describe('options', () => {
      it('passes options except accept', async () => {
        const model = new GenericModel({ route }, data)
        model.name = 'client321'
        const options = {
          return: 'minimal',
          headers: { prefer: 'custom-prefer-header', accept: 'custom-accept-header', 'x-header': 'custom-x-header' },
          accept: 'multiple'
        }
        await model.$patch(options)
        expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123 }, { ...options, accept: 'single', signal: expect.any(AbortSignal) }, {
          name: 'client321'
        })
      })

      it('sets select part of query if return is "representation"', async () => {
        const select = ['id', 'name']
        const model = new GenericModel({ route, select }, data)
        model.name = 'client321'
        await model.$patch({ return: 'representation' })
        expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123, select }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
          name: 'client321'
        })
      })

      it('does not set columns part of query if option "columns" is set to undefined', async () => {
        const model = new GenericModel({ route }, data)
        model.name = 'client321'
        await model.$patch({ columns: undefined })
        expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123 }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
          name: 'client321'
        })
      })

      it('sets columns part of query to user-defined columns if option "columns" is set', async () => {
        const model = new GenericModel({ route }, data)
        model.name = 'client321'
        await model.$patch({ columns: ['age'] })
        expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123, columns: ['age'] }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
          name: 'client321'
        })
      })

      it('only sends columns that exist on the endpoint', async () => {
        const model = new GenericModel({ route }, {
          ...data,
          embedded: []
        })
        model.name = 'client321'
        model.embedded = [{ new: 'record' }]
        await model.$patch()
        expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123 }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
          name: 'client321'
        })
      })

      it('understands column aliases in array select', async () => {
        const select = ['pk:id', 'age:name', 'name:age', 'level']
        const model = new GenericModel({ route, select }, {
          pk: 123,
          age: 'client123',
          name: 50,
          level: 10
        })
        model.age = 'client321'
        await model.$patch()
        expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'PATCH', { 'id.eq': 123, select }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) }, {
          name: 'client321'
        })
      })

      it('updates model when return is "representation"', async () => {
        const model = new GenericModel({ route }, data)
        model.name = 'client321'
        await model.$patch({ return: 'representation' })
        expect(request).toHaveBeenCalled()
        model.$reset()
        expect(model).toMatchObject(mockReturn)
      })

      it('keeps data when return is "minimal"', async () => {
        request.mockReturnValueOnce({
          json: async () => { throw new Error() },
          headers: new Headers()
        })
        const model = new GenericModel({ route }, data)
        model.name = 'client321'
        await model.$patch({ return: 'minimal' })
        expect(request).toHaveBeenCalled()
        expect(model).toMatchObject({
          ...data,
          name: 'client321'
        })
      })
    })

    it('returns the request\'s return value', async () => {
      const model = new GenericModel({ route }, data)
      model.name = 'client321'
      const ret = await model.$patch()
      expect(ret).toEqual(mockReturn)
    })

    it('doesn\'t return the request\'s return value for return=minimal', async () => {
      request.mockReturnValueOnce({
        json: async () => { throw new Error() },
        headers: new Headers()
      })
      const model = new GenericModel({ route }, data)
      model.name = 'client321'
      const ret = await model.$patch({ return: 'minimal' })
      expect(ret).toBeUndefined()
    })
  })

  describe('Delete method', () => {
    it('has observable method "$delete"', () => {
      const model = new GenericModel({ route }, data)
      expect(model.$delete).toBeInstanceOf(ObservableFunction)
    })

    it('property "$delete" is from prototpe and not configurable, writable or deletable', () => {
      const model = new GenericModel({ route }, data)
      expect(Reflect.getOwnPropertyDescriptor(model, '$delete')).toBeUndefined()
      expect('$delete' in model).toBe(true)
      expect(() => {
        model.$delete = 'writable'
      }).toThrow()
      expect(() => {
        Object.defineProperty(model, '$delete', { value: 'configurable' })
      }).toThrow()
      expect(() => {
        delete model.$delete
      }).toThrow()
    })

    it('throws for invalid route', async () => {
      const route = schema.$route('not-existing')
      const model = new GenericModel({ route }, data)
      await expect(model.$delete()).rejects.toThrow()
    })

    it('throws for route without pks', async () => {
      const route = schema('/pk-api').$route('no_pk')
      const model = new GenericModel({ route }, data)
      await expect(model.$delete()).rejects.toThrow(PrimaryKeyError)
    })

    it('throws if primary keys not available in data', async () => {
      const model = new GenericModel({ route }, {
        name: 'client123',
        age: 50,
        level: 10
      })
      await expect(model.$delete()).rejects.toThrow(PrimaryKeyError)
    })

    it('sends a delete request', async () => {
      const model = new GenericModel({ route }, data)
      await model.$delete()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'DELETE', { 'id.eq': 123 }, { accept: 'single', signal: expect.any(AbortSignal) })
    })

    it('passes options except accept', async () => {
      const model = new GenericModel({ route }, data)
      const options = {
        return: 'representation',
        headers: { prefer: 'custom-prefer-header', accept: 'custom-accept-header', 'x-header': 'custom-x-header' },
        accept: 'multiple'
      }
      await model.$delete(options)
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'DELETE', { 'id.eq': 123 }, { ...options, accept: 'single', signal: expect.any(AbortSignal) })
    })

    it('sets select part of query if return is "representation"', async () => {
      const select = ['id', 'name']
      const model = new GenericModel({ route, select }, data)
      await model.$delete({ return: 'representation' })
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'DELETE', { 'id.eq': 123, select }, { return: 'representation', accept: 'single', signal: expect.any(AbortSignal) })
    })

    it('doesn\'t return the request\'s return value', async () => {
      request.mockReturnValueOnce({
        json: async () => { throw new Error() },
        headers: new Headers()
      })
      const model = new GenericModel({ route }, data)
      const ret = await model.$delete()
      expect(ret).toBeUndefined()
    })

    it('returns the request\'s return value for return=representation', async () => {
      const model = new GenericModel({ route }, data)
      const ret = await model.$delete({ return: 'representation' })
      expect(ret).toEqual(mockReturn)
    })
  })
})
