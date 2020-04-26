import GenericModel from '@/GenericModel'
import request from 'superagent'
import config from './MockApi.config'
import mock from 'superagent-mock'

import { shallowMount } from '@vue/test-utils'
import Postgrest from '@/Postgrest'

const mockData = {
  data: {
    '/clients': {
      get: [{
        id: 1,
        name: 'Test Client 1'
      },
      {
        id: 2,
        name: 'Test Client 2'
      },
      {
        id: 3,
        name: 'Test Client 3'
      }
      ]
    }
  }
}
const requestLogger = jest.fn((log) => {})
const superagentMock = mock(request, config(mockData), requestLogger)

describe('Get', () => {
  afterAll(() => {
    superagentMock.unset()
  })

  beforeEach(() => {
    requestLogger.mockReset()
  })

  describe('"_get" function', () => {
    it('returns request return value', async () => {
      expect.assertions(1)
      const wrapper = shallowMount(Postgrest, {
        propsData: {
          apiRoot: '/api/',
          route: 'clients',
          query: {}
        },
        scopedSlots: {
          default () {}
        }
      })
      const ret = await wrapper.vm._get()
      expect(ret.body).toBe(mockData.data['/clients'].get)
    })

    it('sets the correct headers for prop count undefined', async () => {
      expect.assertions(1)
      const wrapper = shallowMount(Postgrest, {
        propsData: {
          apiRoot: '/api/',
          route: 'clients',
          query: {}
        },
        scopedSlots: {
          default () {}
        }
      })
      await wrapper.vm._get()
      const headers = requestLogger.mock.calls.filter(c => c[0].url === 'http://localhost/api/clients')[0][0].headers
      expect(!headers.prefer ? false : headers.prefer.includes('count=exact')).toBe(false)
    })

    it('sets the correct headers for prop count is "exact"', async () => {
      expect.assertions(1)
      const wrapper = shallowMount(Postgrest, {
        propsData: {
          apiRoot: '/api/',
          route: 'clients',
          query: {},
          count: 'exact'
        },
        scopedSlots: {
          default () {}
        }
      })
      await wrapper.vm._get()
      const headers = requestLogger.mock.calls.filter(c => c[0].url === 'http://localhost/api/clients')[0][0].headers
      expect(headers.prefer.includes('count=exact')).toBe(true)
    })
  })

  describe('Prop "query"', () => {
    it('sets "get.isPending" correctly', async () => {
      expect.assertions(2)
      let wrapper
      await new Promise((resolve, reject) => {
        let renders = 0
        let finished = false
        let started = false
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                if (props.get.isPending && !finished && !started) {
                  started = true
                  expect(true).toBe(true)
                } else if (!props.get.isPending && !finished && started) {
                  expect(true).toBe(true)
                  finished = true
                  resolve()
                }
                renders = renders + 1
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
      wrapper.destroy()
    })

    describe('set without conditions', () => {
      it('returns list of entities if prop "accept" is not set', async () => {
        expect.assertions(4)
        let wrapper
        await new Promise((resolve, reject) => {
          wrapper = shallowMount(Postgrest, {
            propsData: {
              apiRoot: '/api/',
              route: 'clients',
              query: {}
            },
            scopedSlots: {
              default (props) {
                try {
                  if (!props.get.isPending) {
                    expect(props.items.length).toBe(mockData.data['/clients'].get.length)
                    expect(props.items[0].data.id).toBe(mockData.data['/clients'].get[0].id)
                    expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients').length).toBe(1)
                    expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[0][0].headers.accept).toBe('application/json')
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

      it('returns single entity if prop "accept" is "single"', async () => {
        expect.assertions(3)
        let wrapper
        await new Promise((resolve, reject) => {
          wrapper = shallowMount(Postgrest, {
            propsData: {
              apiRoot: '/api/',
              route: 'clients',
              query: {},
              accept: 'single'
            },
            scopedSlots: {
              default (props) {
                try {
                  if (!props.get.isPending) {
                    expect(props.item.data.id).toBe(mockData.data['/clients'].get[0].id)
                    expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients').length).toBe(1)
                    expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[0][0].headers.accept).toBe('application/vnd.pgrst.object+json')
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

      it('returns data if prop "accept" is "text/plain"', async () => {
        expect.assertions(3)
        let wrapper
        await new Promise((resolve, reject) => {
          wrapper = shallowMount(Postgrest, {
            propsData: {
              apiRoot: '/api/',
              route: 'clients',
              query: {},
              accept: 'text/plain'
            },
            scopedSlots: {
              default (props) {
                try {
                  if (!props.get.isPending) {
                    expect(props.item).toBe(undefined)
                    expect(props.items).toBe(undefined)
                    expect(typeof props.data).toBe('string')
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

      it('returns generic models with correct properties', async () => {
        expect.assertions(4)
        let wrapper
        await new Promise((resolve, reject) => {
          wrapper = shallowMount(Postgrest, {
            propsData: {
              apiRoot: '/api/',
              route: 'clients',
              query: {},
              accept: 'single'
            },
            scopedSlots: {
              default (props) {
                try {
                  if (!props.get.isPending) {
                    expect(props.item instanceof GenericModel).toBe(true)
                    expect(typeof props.item.request).toBe('function')
                    expect(props.item.data).toEqual(mockData.data['/clients'].get[0])
                    // primary keys as defined by docs above
                    expect(props.item.primaryKeys).toEqual(['id'])
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
    })

    describe('set with conditions', () => {
      it('sets the request params correctly', async () => {
        expect.assertions(1)
        let wrapper
        await new Promise((resolve, reject) => {
          wrapper = shallowMount(Postgrest, {
            propsData: {
              apiRoot: '/api/',
              route: 'clients',
              query: { 'id.eq': 1 }
            },
            scopedSlots: {
              default (props) {
                try {
                  if (!props.get.isPending) {
                    expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients?id=eq.1').length).toBe(1)
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
    })

    it('reacts to dynamic changes', async () => {
      expect.assertions(3)
      let wrapper
      await new Promise((resolve, reject) => {
        let propsChanged = false
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending && !propsChanged) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients').length).toBe(1)
                  wrapper.setProps({ query: { 'id.eq': 1 } })
                  propsChanged = true
                } else if (!props.get.isPending && propsChanged) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients').length).toBe(1)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients?id=eq.1').length).toBe(1)
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
  })

  describe('Prop "route"', () => {
    it('sets the request url correctly', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients').length).toBe(1)
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

    it('reacts to dynamic changes', async () => {
      expect.assertions(3)
      let wrapper
      await new Promise((resolve, reject) => {
        let propsChanged = false
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending && !propsChanged) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients').length).toBe(1)
                  wrapper.setProps({ route: 'users' })
                  propsChanged = true
                } else if (!props.get.isPending && propsChanged) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients').length).toBe(1)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/users').length).toBe(1)
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
  })

  describe('Prop "api-root"', () => {
    it('sets the request url correctly', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/another-api/',
            route: 'clients',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/another-api/clients').length).toBe(1)
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

    it('sets the request url correctly without / at the end', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/another-api',
            route: 'clients',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/another-api/clients').length).toBe(1)
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

    it('reacts to dynamic changes', async () => {
      expect.assertions(3)
      let wrapper
      await new Promise((resolve, reject) => {
        let propsChanged = false
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending && !propsChanged) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients').length).toBe(1)
                  wrapper.setProps({ apiRoot: '/another-api/' })
                  propsChanged = true
                } else if (!props.get.isPending && propsChanged) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients').length).toBe(1)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/another-api/clients').length).toBe(1)
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
  })

  describe('Prop "limit"', () => {
    it('does not set headers when undefined', async () => {
      expect.assertions(3)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients').length).toBe(1)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[0][0].headers['range-unit']).toBe(undefined)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[0][0].headers.range).toBe(undefined)
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

    it('sets the correct request headers for value 1', async () => {
      expect.assertions(3)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {},
            limit: 1
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients').length).toBe(1)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[0][0].headers['range-unit']).toBe('items')
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[0][0].headers.range).toBe('0-0')
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

    it('sets the correct request headers for value > 1', async () => {
      expect.assertions(3)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {},
            limit: 10
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients').length).toBe(1)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[0][0].headers['range-unit']).toBe('items')
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[0][0].headers.range).toBe('0-9')
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

    it('reacts to dynamic changes', async () => {
      expect.assertions(6)
      let wrapper
      await new Promise((resolve, reject) => {
        let propsChanged = false
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {},
            limit: 10
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending && !propsChanged) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients').length).toBe(1)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[0][0].headers['range-unit']).toBe('items')
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[0][0].headers.range).toBe('0-9')
                  wrapper.setProps({ limit: 20 })
                  propsChanged = true
                } else if (!props.get.isPending && propsChanged) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients').length).toBe(2)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[1][0].headers['range-unit']).toBe('items')
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[1][0].headers.range).toBe('0-19')
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
  })

  describe('Prop "offset"', () => {
    it('sets the correct request headers for open range with offset', async () => {
      expect.assertions(3)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {},
            offset: 5
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients').length).toBe(1)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[0][0].headers['range-unit']).toBe('items')
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[0][0].headers.range).toBe('5-')
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

    it('sets the correct request headers for closed range with offset', async () => {
      expect.assertions(3)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {},
            offset: 5,
            limit: 10
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients').length).toBe(1)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[0][0].headers['range-unit']).toBe('items')
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[0][0].headers.range).toBe('5-14')
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

    it('sets the correct request headers for limit of value 1 and with offset', async () => {
      expect.assertions(3)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {},
            offset: 5,
            limit: 1
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients').length).toBe(1)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[0][0].headers['range-unit']).toBe('items')
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[0][0].headers.range).toBe('5-5')
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

    it('reacts to dynamic changes', async () => {
      expect.assertions(6)
      let wrapper
      await new Promise((resolve, reject) => {
        let propsChanged = false
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {},
            offset: 5
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending && !propsChanged) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients').length).toBe(1)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[0][0].headers['range-unit']).toBe('items')
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[0][0].headers.range).toBe('5-')
                  wrapper.setProps({ offset: 10 })
                  propsChanged = true
                } else if (!props.get.isPending && propsChanged) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients').length).toBe(2)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[1][0].headers['range-unit']).toBe('items')
                  expect(requestLogger.mock.calls.filter(call => call[0].url === 'http://localhost/api/clients')[1][0].headers.range).toBe('10-')
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
  })

  describe('Pagination response headers', () => {
    describe('set the slot-prop "range" correctly if available', () => {
      it('with prop "count" undefined', async () => {
        expect.assertions(4)
        let wrapper
        await new Promise((resolve, reject) => {
          wrapper = shallowMount(Postgrest, {
            propsData: {
              apiRoot: '/api/',
              route: 'clients',
              query: {},
              limit: 2
            },
            scopedSlots: {
              default (props) {
                try {
                  if (!props.get.isPending) {
                    expect(typeof props.range).toBe('object')
                    expect(typeof props.range.totalCount).toBe('undefined')
                    expect(props.range.first).toBe(0)
                    expect(props.range.last).toBe(1)
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

      it('with prop "count" is "exact"', async () => {
        expect.assertions(4)
        let wrapper
        await new Promise((resolve, reject) => {
          wrapper = shallowMount(Postgrest, {
            propsData: {
              apiRoot: '/api/',
              route: 'clients',
              query: {},
              limit: 2,
              count: 'exact'
            },
            scopedSlots: {
              default (props) {
                try {
                  if (!props.get.isPending) {
                    expect(typeof props.range).toBe('object')
                    expect(props.range.totalCount).toBe(3)
                    expect(props.range.first).toBe(0)
                    expect(props.range.last).toBe(1)
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
    })

    it('do not set the slot-prop "range" if not available', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending) {
                  expect(typeof props.range).toBe('undefined')
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
  })

  describe('Request errors', () => {
    it('set hasError to true', async () => {
      expect.assertions(1)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
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

    it('emit a "get-error" event', async () => {
      expect.assertions(4)
      let wrapper
      await new Promise((resolve, reject) => {
        wrapper = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: '404',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending) {
                  expect(props.get.hasError).toBe(true)
                  expect(wrapper.emitted()['get-error']).toBeTruthy()
                  expect(wrapper.emitted()['get-error'].length).toBe(1)
                  expect(wrapper.emitted()['get-error'][0][0].message).toEqual('404')
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
  })
})
