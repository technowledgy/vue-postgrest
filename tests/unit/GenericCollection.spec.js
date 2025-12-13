import { shallowMount } from '@vue/test-utils'
import GenericCollection from '@/GenericCollection'
import Schema from '@/Schema'

// mock request function with actual call included (spy)
import request from '@/request'
jest.mock('@/request', () => {
  const { default: req } = jest.requireActual('@/request')
  return {
    __esModule: true,
    default: jest.fn(req)
  }
})

const data = [{
  id: 1,
  name: 'A'
}, {
  id: 2,
  name: 'B'
}]

const mockReturn = [{
  id: 3,
  name: 'C'
}, {
  id: 4,
  name: 'D'
}]

describe('GenericCollection', () => {
  const schema = new Schema('/api')
  const route = schema.$route('clients')
  beforeAll(async () => {
    await route.$ready
  })
  beforeEach(() => {
    request.mockClear()
  })

  it('extends Array', () => {
    const collection = new GenericCollection({ route })
    expect(Array.isArray(collection)).toBe(true)
  })

  it('has length property', () => {
    const collection = new GenericCollection({ route })
    expect('length' in collection).toBe(true)
    expect(collection.length).toBe(0)
  })

  it('has GenericCollection prototype', () => {
    const collection = new GenericCollection({ route })
    expect(collection).toBeInstanceOf(GenericCollection)
  })

  it('throws when passing non objects to the constructor', () => { /* eslint-disable no-new */
    expect.assertions(2)
    try {
      new GenericCollection({ route }, 'wrong')
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
    }
    try {
      new GenericCollection({ route }, null)
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
    }
  })

  it('holds instances of GenericModel', () => {
    expect.assertions(2)
    const collection = new GenericCollection({ route }, ...data)

    collection.forEach(m => expect(m.constructor.name).toBe('GenericModel'))
  })

  it('throws when adding non objects to the array', () => {
    expect.assertions(2)
    const collection = new GenericCollection({ route })
    try {
      collection[0] = 'wrong'
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
    }
    try {
      collection.push(null)
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
    }
  })

  it('turns objects into GenericModels when manipulating', () => {
    expect.assertions(2)
    const collection = new GenericCollection({ route })
    collection[0] = data[0]
    collection.push(data[1])
    collection.forEach(m => expect(m.constructor.name).toBe('GenericModel'))
  })

  it('creates GenericModels with proper route, query and select parameters', async () => {
    const collection = new GenericCollection({ route, query: { select: 'id' } }, ...data)
    await collection[0].$get()
    expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { 'id.eq': 1, select: 'id' }, { accept: 'single', signal: expect.any(AbortSignal) })
  })

  it('allows delete on the array items', () => {
    const collection = new GenericCollection({ route }, ...data)
    expect(collection[1]).not.toBeUndefined()
    delete collection[1]
    expect(collection[1]).toBeUndefined()
  })

  it('returns regular Array on .map(..)', () => {
    const collection = new GenericCollection({ route }, ...data)
    const ids = collection.map(model => model.id)
    expect(ids).not.toBeInstanceOf(GenericCollection)
    expect(Array.isArray(ids)).toBe(true)
    expect(ids).toEqual([1, 2])
  })

  describe('Vue reacts', () => {
    const Component = {
      render () {},
      data: () => ({ collection: null }),
      mounted () {
        this.collection = new GenericCollection({ route })
      }
    }
    let wrapper

    beforeEach(() => {
      wrapper = shallowMount(Component)
    })
    afterEach(() => wrapper.unmount())

    it('to added items via push', () => {
      expect.assertions(1)
      wrapper.vm.$watch('collection', collection => {
        expect(collection.length).toBe(1)
      }, { deep: true })
      wrapper.vm.collection.push({})
    })

    it('to added items via set', () => {
      expect.assertions(1)
      wrapper.vm.$watch('collection', collection => {
        expect(collection.length).toBe(1)
      }, { deep: true })
      wrapper.vm.collection[0] = {}
    })

    it('to added items via $new', () => {
      expect.assertions(1)
      wrapper.vm.$watch('collection', collection => {
        expect(collection.length).toBe(1)
      }, { deep: true })
      wrapper.vm.collection.$new({})
    })

    it('to added items via $get', () => {
      expect.assertions(1)
      wrapper.vm.$watch('collection', collection => {
        expect(collection.length).toBe(2)
      }, { deep: true })
      request.mockReturnValueOnce({
        json: async () => mockReturn,
        headers: new Headers()
      })
      return wrapper.vm.collection.$get()
    })
  })

  describe('Get method', () => {
    it('has observable method "$get"', () => {
      const collection = new GenericCollection()
      expect(collection.$get.constructor.name).toBe('ObservableFunction')
    })

    it('property "$get" is from prototype and not configurable, writable or deletable', () => {
      const collection = new GenericCollection({ route, query: { 'id.gt': 1 } })
      expect(Reflect.getOwnPropertyDescriptor(collection, '$get')).toBeUndefined()
      expect('$get' in collection).toBe(true)
      expect(() => {
        collection.$get = 'writable'
      }).toThrow()
      expect(() => {
        Object.defineProperty(collection, '$get', { value: 'configurable' })
      }).toThrow()
      expect(() => {
        delete collection.$get
      }).toThrow()
    })

    it('sends a get request with query', async () => {
      const collection = new GenericCollection({ route, query: { 'id.gt': 1 } })
      await collection.$get()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', { 'id.gt': 1 }, { signal: expect.any(AbortSignal) })
    })

    it('passes options except accept', async () => {
      const collection = new GenericCollection({ route, query: {} })
      const options = {
        headers: { prefer: 'custom-prefer-header', accept: 'custom-accept-header', 'x-header': 'custom-x-header' },
        accept: 'single'
      }
      await collection.$get(options)
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, { headers: options.headers, signal: expect.any(AbortSignal) })
    })

    it('returns the request\'s return value and updates collection data', async () => {
      request.mockReturnValueOnce({
        json: async () => mockReturn,
        headers: new Headers()
      })
      const collection = new GenericCollection({ route }, ...data)
      expect(collection).toMatchObject(data)
      const ret = await collection.$get()
      expect(ret).toEqual(mockReturn)
      expect(collection).toMatchObject(mockReturn)
    })

    it('passes options limit, offset and count', async () => {
      const collection = new GenericCollection({
        route,
        limit: 5,
        offset: 10,
        count: 'exact'
      })
      await collection.$get()
      expect(request).toHaveBeenLastCalledWith('/api', undefined, 'clients', 'GET', {}, {
        limit: 5,
        offset: 10,
        count: 'exact',
        signal: expect.any(AbortSignal)
      })
    })
  })

  describe('$range object', () => {
    it('exists when header set #1', async () => {
      const collection = new GenericCollection({
        route,
        limit: 2
      })
      await collection.$get()
      expect(collection.$range).toMatchObject({
        totalCount: undefined,
        first: 0,
        last: 1
      })
    })

    it('exists when header set #2', async () => {
      const collection = new GenericCollection({
        route,
        count: 'exact'
      })
      await collection.$get()
      expect(collection.$range).toMatchObject({
        totalCount: 3,
        first: 0,
        last: undefined
      })
    })
  })

  describe('New method', () => {
    it('has method "$new"', () => {
      const collection = new GenericCollection()
      expect(collection.$new).toBeInstanceOf(Function)
    })

    it('property "$new" is from prototype and not configurable, writable or deletable', () => {
      const collection = new GenericCollection({ route, query: { 'id.gt': 1 } })
      expect(Reflect.getOwnPropertyDescriptor(collection, '$new')).toBeUndefined()
      expect('$new' in collection).toBe(true)
      expect(() => {
        collection.$new = 'writable'
      }).toThrow()
      expect(() => {
        Object.defineProperty(collection, '$new', { value: 'configurable' })
      }).toThrow()
      expect(() => {
        delete collection.$new
      }).toThrow()
    })

    it('creates and returns GenericModel added to the array', () => {
      const collection = new GenericCollection({ route }, data[0])
      const model = collection.$new(data[1])
      expect(model.constructor.name).toBe('GenericModel')
      expect(model).toMatchObject(data[1])
      expect(collection[1]).toBe(model)
    })

    it('can delete "$new" records after they "$post"', async () => {
      request.mockReturnValue({
        json: async () => ({
          name: 'client 2',
          id: 2
        }),
        headers: new Headers()
      })

      const collection = new GenericCollection({ route, query: { select: { id: true, name: true } } })
      await collection.$new({ name: 'client 2' })

      const model = collection.at(-1)
      await model.$post()
      request.mockClear()

      expect(model.id).toBe(2)
      expect(model.name).toBe('client 2')

      await model.$delete()

      expect(request).toHaveBeenCalledTimes(1)
      expect(request).toHaveBeenCalledWith('/api', undefined, 'clients', 'DELETE',
        {
          'id.eq': 2,
          select: { id: true, name: true }
        },
        {
          accept: 'single',
          signal: expect.any(AbortSignal)
        })
    })
  })
})
