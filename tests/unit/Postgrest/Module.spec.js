import { shallowMount } from '@vue/test-utils'

import request from 'superagent'
import config from './MockApi.config'
import mock from 'superagent-mock'

import Postgrest from '@/Postgrest'
import GenericModel from '@/models/GenericModel'

const mockData = {}
const superagentMock = mock(request, config(mockData))

Postgrest.props.apiRoot.default = '/api/'

describe('Module', () => {
  afterAll(() => {
    superagentMock.unset()
  })

  describe('Slot scope', () => {
    it('provides GET function if prop QUERY is set', () => {
      expect.hasAssertions()
      shallowMount(Postgrest, {
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
      expect.hasAssertions()
      shallowMount(Postgrest, {
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
      expect.hasAssertions()
      shallowMount(Postgrest, {
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
      expect.hasAssertions()
      shallowMount(Postgrest, {
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
      expect.hasAssertions()
      shallowMount(Postgrest, {
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
      expect.hasAssertions()
      shallowMount(Postgrest, {
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
      expect.hasAssertions()
      shallowMount(Postgrest, {
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
      expect.hasAssertions()
      shallowMount(Postgrest, {
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
      expect.hasAssertions()
      shallowMount(Postgrest, {
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
      expect.hasAssertions()
      shallowMount(Postgrest, {
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

    it('does not provide "resetNewItem" if "create" is not set', () => {
      expect.hasAssertions()
      shallowMount(Postgrest, {
        propsData: {
          route: '',
          query: {},
          single: true
        },
        scopedSlots: {
          default (props) {
            expect(typeof props.resetNewItem).toBe('undefined')
          }
        }
      })
    })

    it('provides a function "resetNewItem" if "create" is set', () => {
      expect.hasAssertions()
      shallowMount(Postgrest, {
        propsData: {
          route: '',
          query: {},
          single: true,
          create: {}
        },
        scopedSlots: {
          default (props) {
            expect(typeof props.resetNewItem).toBe('function')
          }
        }
      })
    })
  })

  describe('resetNewItem', () => {
    it('resets newItem data to provided template', async () => {
      expect.assertions(3)
      const create = {
        id: 123,
        name: 'client123'
      }
      const instance = shallowMount(Postgrest, {
        propsData: {
          route: '',
          create
        },
        scopedSlots: {
          default (props) {}
        }
      })
      expect(instance.vm.newItem.data.name).toBe(create.name)
      instance.vm.newItem.data.name = 'client321'
      await instance.vm.$nextTick()
      expect(instance.vm.newItem.data.name).toBe('client321')
      instance.vm.resetNewItem()
      await instance.vm.$nextTick()
      expect(instance.vm.newItem.data).toEqual(create)
    })
  })

  describe('newItem', () => {
    it('is a GenericModel', () => {
      expect.hasAssertions()
      shallowMount(Postgrest, {
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
      expect.hasAssertions()
      const create = {
        id: 123,
        name: 'client 123'
      }
      shallowMount(Postgrest, {
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
