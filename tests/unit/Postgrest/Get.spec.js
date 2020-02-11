import request from 'superagent'
import config from './MockApi.config'
import mock from 'superagent-mock'

const mockData = {
  get: {
    '/clients': [
      {
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
const requestLogger = jest.fn((log) => {})
const superagentMock = mock(request, config(mockData), requestLogger)

import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import PostgrestPlugin from '@/index'
import Postgrest from '@/Postgrest'

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
      let renders = 0
      let finished = false
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          apiRoot: '/api/',
          route: 'clients',
          query: {}
        },
        scopedSlots: {
          default (props) {
            if (renders === 0) {
              expect(props.get.isPending).toBe(true)
            } else if (!props.get.isPending && !finished) {
              expect(true).toBe(true)
              finished = true
            }
            renders = renders + 1
          }
        }
      })
    })

    describe('set without conditions', () => {
      it('returns list of entities if prop "single" is false', async () => {
        expect.assertions(4)
        const postgrest = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {}
          },
          scopedSlots: {
            default (props) {
              if (!props.get.isPending) {
                expect(props.items.length).toBe(mockData.get['/clients'].length)
                expect(props.items[0].id).toBe(mockData.get['/clients'][0].id)
                expect(requestLogger.mock.calls.length).toBe(1)
                expect(requestLogger.mock.calls[0][0].headers.Accept).toBe('application/json')
              }
            }
          }
        })
      })

      it('returns single entity if prop "single" is true', async () => {
        expect.assertions(3)
        const postgrest = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: {},
            single: true
          },
          scopedSlots: {
            default (props) {
              if (!props.get.isPending) {
                expect(props.item.id).toBe(mockData.get['/clients'][0].id)
                expect(requestLogger.mock.calls.length).toBe(1)
                expect(requestLogger.mock.calls[0][0].headers.Accept).toBe('application/vnd.pgrst.object+json')
              }
            }
          }
        })
      })
    })

    describe('set with conditions', () => {
      it('sets the request params correctly', async () => {
        expect.assertions(2)
        const postgrest = shallowMount(Postgrest, {
          propsData: {
            apiRoot: '/api/',
            route: 'clients',
            query: { id: 'eq.1' }
          },
          scopedSlots: {
            default (props) {
              if (!props.get.isPending) {
                expect(requestLogger.mock.calls.length).toBe(1)
                expect(requestLogger.mock.calls[0][0].url).toBe('/api/clients?id=eq.1')
              }
            }
          }
        })
      })
    })

    it('reacts to dynamic changes', async () => {
      expect.assertions(4)
      let propsChanged = false
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          apiRoot: '/api/',
          route: 'clients',
          query: {}
        },
        scopedSlots: {
          default (props) {
            if (!props.get.isPending && !propsChanged) {
              expect(requestLogger.mock.calls.length).toBe(1)
              expect(requestLogger.mock.calls[0][0].url).toBe('/api/clients')
              postgrest.setProps({ query: { id: 'eq.1' } })
              propsChanged = true
            } else if (!props.get.isPending && propsChanged) {
              expect(requestLogger.mock.calls.length).toBe(2)
              expect(requestLogger.mock.calls[1][0].url).toBe('/api/clients?id=eq.1')
            }
          }
        }
      })
    })
  })

  describe('Prop "route"', () => {
    it('sets the request url correctly', async () => {
      expect.assertions(2)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          apiRoot: '/api/',
          route: 'clients',
          query: {}
        },
        scopedSlots: {
          default (props) {
            if (!props.get.isPending) {
              expect(requestLogger.mock.calls.length).toBe(1)
              expect(requestLogger.mock.calls[0][0].url).toBe('/api/clients')
            }
          }
        }
      })
    })

    it('reacts to dynamic changes', async () => {
      expect.assertions(4)
      let propsChanged = false
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          apiRoot: '/api/',
          route: 'clients',
          query: {}
        },
        scopedSlots: {
          default (props) {
            if (!props.get.isPending && !propsChanged) {
              expect(requestLogger.mock.calls.length).toBe(1)
              expect(requestLogger.mock.calls[0][0].url).toBe('/api/clients')
              postgrest.setProps({ route: 'users' })
              propsChanged = true
            } else if (!props.get.isPending && propsChanged) {
              expect(requestLogger.mock.calls.length).toBe(2)
              expect(requestLogger.mock.calls[1][0].url).toBe('/api/users')
            }
          }
        }
      })
    })
  })

  describe('Prop "api-root"', () => {
    it('sets the request url correctly', async () => {
      expect.assertions(2)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          apiRoot: '/another-api/',
          route: 'clients',
          query: {}
        },
        scopedSlots: {
          default (props) {
            if (!props.get.isPending) {
              expect(requestLogger.mock.calls.length).toBe(1)
              expect(requestLogger.mock.calls[0][0].url).toBe('/another-api/clients')
            }
          }
        }
      })
    })

    it('reacts to dynamic changes', async () => {
      expect.assertions(4)
      let propsChanged = false
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          apiRoot: '/api/',
          route: 'clients',
          query: {}
        },
        scopedSlots: {
          default (props) {
            if (!props.get.isPending && !propsChanged) {
              expect(requestLogger.mock.calls.length).toBe(1)
              expect(requestLogger.mock.calls[0][0].url).toBe('/api/clients')
              postgrest.setProps({ apiRoot: '/another-api/' })
              propsChanged = true
            } else if (!props.get.isPending && propsChanged) {
              expect(requestLogger.mock.calls.length).toBe(2)
              expect(requestLogger.mock.calls[1][0].url).toBe('/another-api/clients')
            }
          }
        }
      })
    })
  })

  describe('Prop "limit"', () => {
    it('does not set headers when undefined', async () => {
      expect.assertions(3)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          apiRoot: '/api/',
          route: 'clients',
          query: {}
        },
        scopedSlots: {
          default (props) {
            if (!props.get.isPending) {
              expect(requestLogger.mock.calls.length).toBe(1)
              expect(requestLogger.mock.calls[0][0].headers['Range-Unit']).toBe(undefined)
              expect(requestLogger.mock.calls[0][0].headers.Range).toBe(undefined)
            }
          }
        }
      })
    })

    it('sets the correct request headers', async () => {
      expect.assertions(3)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          apiRoot: '/api/',
          route: 'clients',
          query: {},
          limit: 10
        },
        scopedSlots: {
          default (props) {
            if (!props.get.isPending) {
              expect(requestLogger.mock.calls.length).toBe(1)
              expect(requestLogger.mock.calls[0][0].headers['Range-Unit']).toBe('items')
              expect(requestLogger.mock.calls[0][0].headers.Range).toBe('0-10')
            }
          }
        }
      })
    })
  })

  describe('Prop "offset"', () => {
    it('sets the correct request headers for open range with offset', async () => {
      expect.assertions(3)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          apiRoot: '/api/',
          route: 'clients',
          query: {},
          offset: 5
        },
        scopedSlots: {
          default (props) {
            if (!props.get.isPending) {
              expect(requestLogger.mock.calls.length).toBe(1)
              expect(requestLogger.mock.calls[0][0].headers['Range-Unit']).toBe('items')
              expect(requestLogger.mock.calls[0][0].headers.Range).toBe('5-')
            }
          }
        }
      })
    })

    it('sets the correct request headers for closed range with offset', async () => {
      expect.assertions(3)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          apiRoot: '/api/',
          route: 'clients',
          query: {},
          offset: 5,
          limit: 10
        },
        scopedSlots: {
          default (props) {
            if (!props.get.isPending) {
              expect(requestLogger.mock.calls.length).toBe(1)
              expect(requestLogger.mock.calls[0][0].headers['Range-Unit']).toBe('items')
              expect(requestLogger.mock.calls[0][0].headers.Range).toBe('5-15')
            }
          }
        }
      })
    })
  })

  describe('Pagination response headers', () => {
    it('set the slot-prop "range" correctly', async () => {
      expect.assertions(3)
      const postgrest = shallowMount(Postgrest, {
        propsData: {
          apiRoot: '/api/',
          route: 'clients',
          query: {},
          limit: 2
        },
        scopedSlots: {
          default (props) {
            if (!props.get.isPending) {
              expect(typeof props.range).toBe('object')
              expect(props.range.totalCount).toBe(3)
              expect(props.range.first).toBe(0)
              expect(props.range.last).toBe(2)
            }
          }
        }
      })
    })
  })
})
