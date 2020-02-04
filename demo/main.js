// file only for dev. purposes
import Vue from 'vue'
import Postgrest from '@/index'
import Demo from './Demo'

Vue.config.productionTip = false

Vue.use(Postgrest, {
  apiRoot: 'api/'
})

new Vue({
  render: h => h(Demo)
}).$mount('#app')
