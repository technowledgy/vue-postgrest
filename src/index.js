import Plugin from './Plugin'

// Auto-install when vue is found (eg. in browser via <script> tag)
if (typeof globalThis !== 'undefined' && globalThis.Vue) {
  globalThis.Vue.use(Plugin)
}

export default Plugin
