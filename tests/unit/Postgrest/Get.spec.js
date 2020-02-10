import request from 'superagent'
import config from './Get.MockApi.config'
import mock from 'superagent-mock'

const superagentMock = mock(request, config)

import { createLocalVue, shallowMount } from '@vue/test-utils'
import PostgrestPlugin from '@/index'
import Postgrest from '@/Postgrest'

describe('Get', () => {
  afterAll(() => {
    superagentMock.unset()
  })

  describe('Prop "route"', () => {
    it('queries the specified table/view', () => {
      expect.assertions(1)
    })

    it('queries the correct table/view when prop "api-root" is set', () => {
      expect.assertions(1)
    })
  })

  describe('Prop "query"', () => {
    describe('set without conditions', () => {
      it('returns complete list of entities if prop "single" is false', () => {
        expect.assertions(1)
      })

      it('returns single entity if prop "single" is true', () => {
        expect.assertions(1)
      })
    })

    describe('set with condition(s)', () => {
      it('"limit" returns limited list of entities and correctly sets "pagination.pagination"', () => {
        expect.assertions(1)
      })

      it('"offset" returns correct range of entities and correctly sets "pagination.range"', () => {
        expect.assertions(1)
      })
    })
  })
})
