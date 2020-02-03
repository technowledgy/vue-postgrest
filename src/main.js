import Vue from 'vue'
import VuePostgrest from './VuePostgrest.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(VuePostgrest)
}).$mount('#app')
