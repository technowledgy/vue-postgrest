import GenericModel from '@/models/GenericModel'
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
  },
  docs: {
    definitions: {
      clients: {
        properties: {
          id: {
            type: 'integer',
            description: 'Note:\nThis is a Primary Key.<pk/>'
          }
        }
      }
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

  describe('Prop "query"', () => {
    it('sets "get.isPending" correctly', async () => {
      expect.assertions(2)
      return new Promise((resolve, reject) => {
        let renders = 0
        let finished = false
        let started = false
        shallowMount(Postgrest, {
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
    })

    describe('set without conditions', () => {
      it('returns list of entities if prop "single" is false', async () => {
        expect.assertions(4)
        return new Promise((resolve, reject) => {
          shallowMount(Postgrest, {
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
                    expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients').length).toBe(1)
                    expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients')[0][0].headers.Accept).toBe('application/json')
                    resolve()
                  }
                } catch (e) {
                  reject(e)
                }
              }
            }
          })
        })
      })

      it('returns single entity if prop "single" is true', async () => {
        expect.assertions(3)
        return new Promise((resolve, reject) => {
          shallowMount(Postgrest, {
            propsData: {
              apiRoot: '/api/',
              route: 'clients',
              query: {},
              single: true
            },
            scopedSlots: {
              default (props) {
                try {
                  if (!props.get.isPending) {
                    expect(props.item.data.id).toBe(mockData.data['/clients'].get[0].id)
                    expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients').length).toBe(1)
                    expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients')[0][0].headers.Accept).toBe('application/vnd.pgrst.object+json')
                    resolve()
                  }
                } catch (e) {
                  reject(e)
                }
              }
            }
          })
        })
      })

      it('returns generic models with correct properties', async () => {
        expect.assertions(4)
        return new Promise((resolve, reject) => {
          shallowMount(Postgrest, {
            propsData: {
              apiRoot: '/api/',
              route: 'clients',
              query: {},
              single: true
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
      })
    })

    describe('set with conditions', () => {
      it('sets the request params correctly', async () => {
        expect.assertions(1)
        return new Promise((resolve, reject) => {
          shallowMount(Postgrest, {
            propsData: {
              apiRoot: '/api/',
              route: 'clients',
              query: { id: 'eq.1' }
            },
            scopedSlots: {
              default (props) {
                try {
                  if (!props.get.isPending) {
                    expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients?id=eq.1').length).toBe(1)
                    resolve()
                  }
                } catch (e) {
                  reject(e)
                }
              }
            }
          })
        })
      })
    })

    it('reacts to dynamic changes', async () => {
      expect.assertions(3)
      return new Promise((resolve, reject) => {
        let propsChanged = false
        const postgrest = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending && !propsChanged) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients').length).toBe(1)
                  postgrest.setProps({ query: { id: 'eq.1' } })
                  propsChanged = true
                } else if (!props.get.isPending && propsChanged) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients').length).toBe(1)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients?id=eq.1').length).toBe(1)
                  resolve()
                }
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
    })
  })

  describe('Prop "route"', () => {
    it('sets the request url correctly', async () => {
      expect.assertions(1)
      return new Promise((resolve, reject) => {
        shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients').length).toBe(1)
                  resolve()
                }
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
    })

    it('reacts to dynamic changes', async () => {
      expect.assertions(3)
      return new Promise((resolve, reject) => {
        let propsChanged = false
        const postgrest = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending && !propsChanged) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients').length).toBe(1)
                  postgrest.setProps({ route: 'users' })
                  propsChanged = true
                } else if (!props.get.isPending && propsChanged) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients').length).toBe(1)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/users').length).toBe(1)
                  resolve()
                }
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
    })
  })

  describe('Prop "api-root"', () => {
    it('sets the request url correctly', async () => {
      expect.assertions(1)
      return new Promise((resolve, reject) => {
        shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/another-api/',
            route: 'clients',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/another-api/clients').length).toBe(1)
                  resolve()
                }
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
    })

    it('reacts to dynamic changes', async () => {
      expect.assertions(3)
      return new Promise((resolve, reject) => {
        let propsChanged = false
        const postgrest = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending && !propsChanged) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients').length).toBe(1)
                  postgrest.setProps({ apiRoot: '/another-api/' })
                  propsChanged = true
                } else if (!props.get.isPending && propsChanged) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients').length).toBe(1)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/another-api/clients').length).toBe(1)
                  resolve()
                }
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
    })
  })

  describe('Prop "limit"', () => {
    it('does not set headers when undefined', async () => {
      expect.assertions(3)
      return new Promise((resolve, reject) => {
        shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {}
          },
          scopedSlots: {
            default (props) {
              try {
                if (!props.get.isPending) {
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients').length).toBe(1)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients')[0][0].headers['Range-Unit']).toBe(undefined)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients')[0][0].headers.Range).toBe(undefined)
                  resolve()
                }
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
    })

    it('sets the correct request headers', async () => {
      expect.assertions(3)
      return new Promise((resolve, reject) => {
        shallowMount(Postgrest, {
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
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients').length).toBe(1)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients')[0][0].headers['Range-Unit']).toBe('items')
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients')[0][0].headers.Range).toBe('0-10')
                  resolve()
                }
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
    })
  })

  describe('Prop "offset"', () => {
    it('sets the correct request headers for open range with offset', async () => {
      expect.assertions(3)
      return new Promise((resolve, reject) => {
        shallowMount(Postgrest, {
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
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients').length).toBe(1)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients')[0][0].headers['Range-Unit']).toBe('items')
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients')[0][0].headers.Range).toBe('5-')
                  resolve()
                }
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
    })

    it('sets the correct request headers for closed range with offset', async () => {
      expect.assertions(3)
      return new Promise((resolve, reject) => {
        shallowMount(Postgrest, {
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
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients').length).toBe(1)
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients')[0][0].headers['Range-Unit']).toBe('items')
                  expect(requestLogger.mock.calls.filter(call => call[0].url === '/api/clients')[0][0].headers.Range).toBe('5-15')
                  resolve()
                }
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
    })
  })

  describe('Pagination response headers', () => {
    describe('set the slot-prop "range" correctly if available', () => {
      it('with prop "exact-count" false', async () => {
        expect.assertions(4)
        return new Promise((resolve, reject) => {
          shallowMount(Postgrest, {
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
                    expect(props.range.last).toBe(2)
                    resolve()
                  }
                } catch (e) {
                  reject(e)
                }
              }
            }
          })
        })
      })

      it('with prop "exact-count" true', async () => {
        expect.assertions(4)
        return new Promise((resolve, reject) => {
          shallowMount(Postgrest, {
            propsData: {
              apiRoot: '/api/',
              route: 'clients',
              query: {},
              limit: 2,
              exactCount: true
            },
            scopedSlots: {
              default (props) {
                try {
                  if (!props.get.isPending) {
                    expect(typeof props.range).toBe('object')
                    expect(props.range.totalCount).toBe(3)
                    expect(props.range.first).toBe(0)
                    expect(props.range.last).toBe(2)
                    resolve()
                  }
                } catch (e) {
                  reject(e)
                }
              }
            }
          })
        })
      })
    })

    it('do not set the slot-prop "range" if not available', async () => {
      expect.assertions(1)
      return new Promise((resolve, reject) => {
        shallowMount(Postgrest, {
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
    })
  })

  describe('Request errors', () => {
    it('set hasError to true', async () => {
      expect.assertions(1)
      return new Promise((resolve, reject) => {
        shallowMount(Postgrest, {
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
    })

    it('emit a "get-error" event', () => {
      expect.assertions(4)
      return new Promise((resolve, reject) => {
        const postgrest = shallowMount(Postgrest, {
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
                  expect(postgrest.emitted()['get-error']).toBeTruthy()
                  expect(postgrest.emitted()['get-error'].length).toBe(1)
                  expect(postgrest.emitted()['get-error'][0][0].message).toEqual('404')
                  resolve()
                }
              } catch (e) {
                reject(e)
              }
            }
          }
        })
      })
    })
  })
})
