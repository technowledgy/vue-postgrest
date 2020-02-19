// file only for dev. purposes
import Vue from 'vue'
import Postgrest from '@/index'
import Example from './Example'

Vue.config.productionTip = false

Vue.use(Postgrest, {
  apiRoot: '/api/'
})

new Vue({
  render: h => h(Example)
}).$mount('#app')
