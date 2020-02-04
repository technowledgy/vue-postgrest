import { createLocalVue, mount } from '@vue/test-utils'
import Postgrest from '@/index'
import request from 'superagent'
import config from '../mock-api-config'
import mock from 'superagent-mock'

mock(request, config)

describe('Postgrest', () => {
  describe('Plugin installation', () => {

    it('registers a global component', () => {
      const localVue = createLocalVue()
      expect(localVue.options.components.postgrest).toBe(undefined)
      localVue.use(Postgrest)
      expect(localVue.options.components.postgrest).toBeTruthy()
    })

    it('uses api root path set in install options', () => {
      const localVue = createLocalVue()
      localVue.use(Postgrest, {
        apiRoot: 'global-root/'
      })
      expect(localVue.options.components.postgrest.options.props.apiRoot.default).toBe('global-root/')
    })

  })
})
