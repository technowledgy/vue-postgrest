// file only for dev. purposes
import Vue from 'vue'
import VuePostgrest from '@/Postgrest'

Vue.config.productionTip = false

new Vue({
  render: h => h(VuePostgrest)
}).$mount('#app')
