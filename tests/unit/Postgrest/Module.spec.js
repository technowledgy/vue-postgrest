import { createLocalVue, shallowMount } from '@vue/test-utils'
import Postgrest from '@/Postgrest'

describe('Module', () => {
  describe('Mounting the component', () => {
    it('fails silently if no slot content is provided', () => {
      expect(() => {
        shallowMount(Postgrest, {
          propsData: {
            route: '',
            query: {}
          }
        })
      }).not.toThrow()
    })
  })

  describe('Slot scope', () => {
    it('provides GET function if prop QUERY is set', () => {
      expect.assertions(1)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          route: '',
          query: {}
        },
        scopedSlots: {
          default (props) {
            expect(typeof props.get).toBe('function')
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

    it('provides "pagination" if prop "query" is set and prop "single" is not set', () => {
      expect.assertions(4)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          route: '',
          query: {}
        },
        scopedSlots: {
          default (props) {
            expect(typeof props.pagination).toBe('object')
            expect(typeof props.pagination.totalCount).toBe('number')
            expect(typeof props.pagination.from).toBe('number')
            expect(typeof props.pagination.to).toBe('number')
          }
        }
      })
    })

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
  })
})
