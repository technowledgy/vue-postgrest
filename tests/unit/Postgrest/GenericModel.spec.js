import GenericModel from '@/models/GenericModel'

describe('GenericModel', () => {
  describe('Instantiation', () => {
    const data = {
      key1: 'value1'
    }

    it('sets the first constructor argument to instance property "data"', () => {
      const instance = new GenericModel(data)
      expect(instance.data).toEqual(data)
    })

  })
})
