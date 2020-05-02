import { shallowMount } from '@vue/test-utils'
import Postgrest from '@/Postgrest'
import GenericModel from '@/GenericModel'

Postgrest.props.apiRoot.default = '/api'

describe('Module', () => {
  describe('Slot scope', () => {
    it('provides observable GET function if prop QUERY is set', async () => {
      expect.assertions(5)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: 'missing',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                expect(typeof props.get).toBe('function')
                expect(typeof props.get.__ob__).toBe('object')
                expect(typeof props.get.call).toBe('function') // backwards compatibility
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
            route: 'missing'
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

    it('provides "items" if prop "query" is set and prop "accept" is not set', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: 'missing',
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

    it('provides "items" if prop "query" is set and prop "accept" is undefined', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: 'missing',
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

    it('provides "item" if prop "query" is set and prop "accept" is "single"', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: 'missing',
            query: {},
            accept: 'single'
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

    it('provides "data" if prop "query" is set and prop "accept" is "text/plain"', async () => {
      expect.assertions()
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: 'missing',
            query: {},
            accept: 'text/plain'
          },
          scopedSlots: {
            default (props) {
              try {
                expect(props.data === undefined).toBe(false)
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

    it('does not provide "item", "items" or "data" if prop "query" is not set', async () => {
      expect.assertions(3)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: 'missing'
          },
          scopedSlots: {
            default (props) {
              try {
                expect(props.items).toBe(undefined)
                expect(props.item).toBe(undefined)
                expect(props.data).toBe(undefined)
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
            route: 'missing',
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
            route: 'missing'
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
            route: 'missing'
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

    it('does not provide "pagination" if prop "query" is set and prop "accept" is "single"', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: 'missing',
            query: {},
            accept: 'single'
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

    it('does not provide "resetNewItem" if "create" is not set', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            route: 'missing',
            query: {},
            accept: 'single'
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
            route: 'missing',
            query: {},
            accept: 'single',
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
          route: 'missing',
          create
        },
        scopedSlots: {
          default (props) {}
        }
      })
      expect(wrapper.vm.newItem.name).toBe(create.name)
      wrapper.vm.newItem.name = 'client321'
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.newItem.name).toBe('client321')
      wrapper.vm.resetNewItem()
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.newItem).toEqual(create)
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
            route: 'missing',
            create: {}
          },
          scopedSlots: {
            default (props) {
              try {
                expect(props.newItem).toBeInstanceOf(GenericModel)
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
            route: 'missing',
            create
          },
          scopedSlots: {
            default (props) {
              try {
                expect(props.newItem).toEqual(create)
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

  it('reacts to dynamic change of prop "token"', async () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiamRvZSIsImV4cCI6MTQ3NTUxNjI1MH0.GYDZV3yM0gqvuEtJmfpplLBXSGYnke_Pvnl0tbKAjB'
    expect.assertions(4)
    let wrapper
    await new Promise((resolve, reject) => {
      let propsChanged = false
      wrapper = shallowMount(Postgrest, {
        propsData: {
          route: 'clients',
          query: {}
        },
        scopedSlots: {
          default (props) {
            try {
              if (!props.get.isPending && !propsChanged) {
                expect(fetch.mock.calls.filter(args => args[0] === 'http://localhost/api/clients')).toBeTruthy()
                expect(fetch.mock.calls.filter(args => args[0] === 'http://localhost/api/clients')[1]).toBe(undefined)
                fetch.mockClear()
                wrapper.setProps({ token })
                propsChanged = true
              } else if (!props.get.isPending && propsChanged) {
                expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')).toBeTruthy()
                expect(fetch.mock.calls.find(args => args[0] === 'http://localhost/api/clients')[1].headers.get('Authorization')).toBe(`Bearer ${token}`)
                resolve()
              }
            } catch (e) {
              reject(e)
            }
          }
        }
      })
    })
    wrapper.destroy()
  })

  it('emits "token-error" when server sets appropriate header', async () => {
    expect.assertions(1)
    let wrapper
    await new Promise(resolve => {
      wrapper = shallowMount(Postgrest, {
        propsData: {
          route: 'clients',
          query: {},
          token: 'expired-token'
        },
        listeners: {
          'token-error': evt => {
            expect(evt).toMatchObject({ error: 'invalid_token', error_description: 'JWT expired' })
            resolve()
          }
        },
        scopedSlots: {
          default () {}
        }
      })
    })
    wrapper.destroy()
  })

  describe('Request errors', () => {
    it('set hasError to true', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api',
            route: '404',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending) {
                  expect(props.get.hasError).toBe(true)
                  resolve()
                }
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
      wrapper.destroy()
    })
    it('emits a "get-error" event', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise(resolve => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api',
            route: '404',
            query: {}
          },
          listeners: {
            'get-error': evt => {
              expect(evt).toMatchObject({ status: 404 })
              resolve()
            }
          },
          scopedSlots: {
            default () {}
          }
        })
      })
      wrapper.destroy()
    })
  })
})
