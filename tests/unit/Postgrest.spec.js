import { mount } from '@vue/test-utils'
import Postgrest from '@/Postgrest'
import request from 'superagent'
import config from '../mock-api-config'
import mock from 'superagent-mock'

mock(request, config)

describe('Postgrest', () => {
  describe('Component definition', () => {
    let wrapper;
    beforeAll(() => {
      wrapper = mount(Postgrest, {
        propsData: {
          route: 'test',
          query: 'test',
          single: true
        }
      })
    })

    it('has prop "route"', () => {
      expect(wrapper.props().route).toBeTruthy()
    })

    it('has prop "query"', () => {
      expect(wrapper.props().query).toBeTruthy()
    })

    it('has prop "single"', () => {
      expect(wrapper.props().single).toBeTruthy()
    })
  })
})
