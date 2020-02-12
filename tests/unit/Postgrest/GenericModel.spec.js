import GenericModel from '@/models/GenericModel'

describe('GenericModel', () => {
  const data = {
    key1: 'value1'
  }

  const route = '/clients'
  const apiRoot = '/api/'

  const instance = new GenericModel(data, route, apiRoot)

  describe('Instance', () => {
    it('sets the first constructor argument to instance property "data"', () => {
      expect(instance.data).toEqual(data)
    })

    it('sets the second constructor argument to instance property "route"', () => {
      expect(instance.route).toBe(route)
    })

    it('sets the third constructor argument to instance property "apiRoot"', () => {
      expect(instance.apiRoot).toBe(apiRoot)
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
    it('sends a delete request for the specified entity to the relevant endpoint', () => {
      
    })
  })

  describe('Reset method', () => {})

  describe('"Route" property', () => {
    it('is reactive', () => {})
  })

  describe('"ApiRoot" property', () => {
    it('is reactive', () => {})
  })
})
