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

    fdescribe('set without conditions', () => {
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

    // TODO: limit and offset as props, test if range is set when reponse has certain headers
    describe('set with condition(s)', () => {
      it('"limit" returns limited list of entities and correctly sets "range"', () => {
        expect.assertions(1)
      })

      it('"offset" returns correct range of entities and correctly set "range"', () => {
        expect.assertions(1)
      })
    })
  })

  describe('Prop "route"', () => {
    it('queries the specified table/view', () => {
      expect.assertions(1)
    })

    it('queries the correct table/view when prop "api-root" is set', () => {
      expect.assertions(1)
    })

    it('reacts to "route" and "api-root" changes', () => {

    })
  })
})
