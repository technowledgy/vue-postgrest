import Vue from 'vue'

// configure the mock api for the example
import request from 'superagent'
import config from './MockApi.config'
import mock from 'superagent-mock'

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
mock(request, config(mockData))

// eslint-disable-next-line
import Postgrest from '@/index'
// eslint-disable-next-line
import Example from './Example'

Vue.config.productionTip = false

Vue.use(Postgrest, {
  apiRoot: '/api/'
})

new Vue({
  render: h => h(Example)
}).$mount('#app')
