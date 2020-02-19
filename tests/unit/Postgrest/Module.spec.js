import { createLocalVue, shallowMount } from '@vue/test-utils'
import Postgrest from '@/Postgrest'
import GenericModel from '@/models/GenericModel'

describe('Module', () => {
  describe('Mounting the component', () => {

  describe('Slot scope', () => {
    it('provides GET function if prop QUERY is set', () => {
      expect.assertions(4)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          route: '',
          query: {}
        },
        scopedSlots: {
          default (props) {
            expect(typeof props.get).toBe('object')
            expect(typeof props.get.call).toBe('function')
            expect(typeof props.get.isPending).toBe('boolean')
            expect(typeof props.get.hasError).toBe('boolean')
          }
        }
      })
    })

    it('does not provide GET function if prop QUERY is not set', () => {
      expect.assertions(1)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          route: ''
        },
        scopedSlots: {
          default (props) {
            expect(props.get).toBe(undefined)
          }
        }
      })
    })

    it('provides "items" if prop "query" is set and prop "single" is not set', () => {
      expect.assertions(1)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          route: '',
          query: {}
        },
        scopedSlots: {
          default (props) {
            expect(Array.isArray(props.items)).toBe(true)
          }
        }
      })
    })

    it('provides "item" if prop "query" is set and prop "single" is true', () => {
      expect.assertions(1)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          route: '',
          query: {},
          single: true
        },
        scopedSlots: {
          default (props) {
            expect(typeof props.item).toBe('object')
          }
        }
      })
    })

    it('does not provide "item" or "items" if prop "query" is not set', () => {
      expect.assertions(2)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          route: ''
        },
        scopedSlots: {
          default (props) {
            expect(props.items).toBe(undefined)
            expect(props.item).toBe(undefined)
          }
        }
      })
    })

    it('provides "newItem" if prop "create" is set', () => {
      expect.assertions(1)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          route: '',
          create: {}
        },
        scopedSlots: {
          default (props) {
            expect(typeof props.newItem).toBe('object')
          }
        }
      })
    })

    it('does not provide "newItem" if prop "create" is not set', () => {
      expect.assertions(1)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          route: ''
        },
        scopedSlots: {
          default (props) {
            expect(props.newItem).toBe(undefined)
          }
        }
      })
    })

    // slot-prop "range" is tested in Get.spec, since setting it should be invoked by api response headers

    it('does not provide "pagination" if prop "query" is not set', () => {
      expect.assertions(1)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          route: ''
        },
        scopedSlots: {
          default (props) {
            expect(props.pagination).toBe(undefined)
          }
        }
      })
    })

    it('does not provide "pagination" if prop "query" is set and prop "single" is true', () => {
      expect.assertions(1)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          route: '',
          query: {},
          single: true
        },
        scopedSlots: {
          default (props) {
            expect(props.pagination).toBe(undefined)
          }
        }
      })
    })

    it('provides a function "rpc"', () => {
      expect.assertions(1)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          route: '',
          query: {},
          single: true
        },
        scopedSlots: {
          default (props) {
            expect(typeof props.rpc).toBe('function')
          }
        }
      })
    })
  })

  describe('newItem', () => {
    it('is a GenericModel', () => {
      expect.assertions(1)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          route: '',
          create: {}
        },
        scopedSlots: {
          default (props) {
            expect(props.newItem instanceof GenericModel).toBeTruthy()
          }
        }
      })
    })

    it('has its data set to the template provided by "create" prop', () => {
      expect.assertions(1)
      const create = {
        id: 123,
        name: 'client 123'
      }
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          route: '',
          create
        },
        scopedSlots: {
          default (props) {
            expect(props.newItem.data).toEqual(create)
          }
        }
      })
    })
  })
})
