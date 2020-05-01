import Plugin from './Plugin'

// Auto-install when vue is found (eg. in browser via <script> tag)
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(Plugin)
}

export default Plugin
