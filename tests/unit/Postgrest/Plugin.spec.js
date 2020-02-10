import { createLocalVue, shallowMount } from '@vue/test-utils'
import PostgrestPlugin from '@/index'

describe('Plugin', () => {
  describe('Plugin installation', () => {

    it('registers a global component', () => {
      const localVue = createLocalVue()
      expect(localVue.options.components.postgrest).toBe(undefined)
      localVue.use(PostgrestPlugin)
      expect(localVue.options.components.postgrest).toBeTruthy()
    })

    it('uses api root path set in install options', () => {
      const localVue = createLocalVue()
      localVue.use(PostgrestPlugin, {
        apiRoot: 'global-root/'
      })
      expect(localVue.options.components.postgrest.options.props.apiRoot.default).toBe('global-root/')
    })

  })
})
