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
    it('provides GET function if prop QUERY is set', async () => {
      expect.assertions(4)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: '',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                expect(typeof props.get).toBe('object')
                expect(typeof props.get.call).toBe('function')
                expect(typeof props.get.isPending).toBe('boolean')
                expect(typeof props.get.hasError).toBe('boolean')
                resolve()
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
      wrapper.destroy()
    })

    it('does not provide GET function if prop QUERY is not set', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: ''
          },
          scopedSlots: {
            default (props) {
              try {
                expect(props.get).toBe(undefined)
                resolve()
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
      wrapper.destroy()
    })

    it('provides "items" if prop "query" is set and prop "single" is not set', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: '',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                expect(Array.isArray(props.items)).toBe(true)
                resolve()
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
      wrapper.destroy()
    })

    it('provides "item" if prop "query" is set and prop "single" is true', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: '',
            query: {},
            single: true
          },
          scopedSlots: {
            default (props) {
              try {
                expect(typeof props.item).toBe('object')
                resolve()
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
      wrapper.destroy()
    })

    it('does not provide "item" or "items" if prop "query" is not set', async () => {
      expect.assertions(2)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: ''
          },
          scopedSlots: {
            default (props) {
              try {
                expect(props.items).toBe(undefined)
                expect(props.item).toBe(undefined)
                resolve()
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
      wrapper.destroy()
    })

    it('provides "newItem" if prop "create" is set', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: '',
            create: {}
          },
          scopedSlots: {
            default (props) {
              try {
                expect(typeof props.newItem).toBe('object')
                resolve()
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
      wrapper.destroy()
    })

    it('does not provide "newItem" if prop "create" is not set', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: ''
          },
          scopedSlots: {
            default (props) {
              try {
                expect(props.newItem).toBe(undefined)
                resolve()
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
      wrapper.destroy()
    })

    // slot-prop "range" is tested in Get.spec, since setting it should be invoked by api response headers

    it('does not provide "pagination" if prop "query" is not set', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: ''
          },
          scopedSlots: {
            default (props) {
              try {
                expect(props.pagination).toBe(undefined)
                resolve()
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
      wrapper.destroy()
    })

    it('does not provide "pagination" if prop "query" is set and prop "single" is true', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: '',
            query: {},
            single: true
          },
          scopedSlots: {
            default (props) {
              try {
                expect(props.pagination).toBe(undefined)
                resolve()
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
      wrapper.destroy()
    })

    it('provides a function "rpc"', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: '',
            query: {},
            single: true
          },
          scopedSlots: {
            default (props) {
              try {
                expect(typeof props.rpc).toBe('function')
                resolve()
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
      wrapper.destroy()
    })

    it('does not provide "resetNewItem" if "create" is not set', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: '',
            query: {},
            single: true
          },
          scopedSlots: {
            default (props) {
              try {
                expect(typeof props.resetNewItem).toBe('undefined')
                resolve()
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
      wrapper.destroy()
    })

    it('provides a function "resetNewItem" if "create" is set', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: '',
            query: {},
            single: true,
            create: {}
          },
          scopedSlots: {
            default (props) {
              try {
                expect(typeof props.resetNewItem).toBe('function')
                resolve()
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
      wrapper.destroy()
    })
  })

  describe('resetNewItem', () => {
    it('resets newItem data to provided template', async () => {
      expect.assertions(3)
      const create = {
        id: 123,
        name: 'client123'
      }
      const wrapper = shallowMount(Postgrest, {
        propsData: {
          route: '',
          create
        },
        scopedSlots: {
          default (props) {}
        }
      })
      expect(wrapper.vm.newItem.data.name).toBe(create.name)
      wrapper.vm.newItem.data.name = 'client321'
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.newItem.data.name).toBe('client321')
      wrapper.vm.resetNewItem()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.newItem.data).toEqual(create)
      wrapper.destroy()
    })
  })

  describe('newItem', () => {
    it('is a GenericModel', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: '',
            create: {}
          },
          scopedSlots: {
            default (props) {
              try {
                expect(props.newItem instanceof GenericModel).toBeTruthy()
                resolve()
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
      wrapper.destroy()
    })

    it('has its data set to the template provided by "create" prop', async () => {
      expect.assertions(1)
      const create = {
        id: 123,
        name: 'client 123'
      }
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: '',
            create
          },
          scopedSlots: {
            default (props) {
              try {
                expect(props.newItem.data).toEqual(create)
                resolve()
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
      wrapper.destroy()
    })
  })
})
