module.exports = { 
  base: '/vue-postgrest/',
  title: 'vue-postgrest',
  description: 'PostgREST integration for Vue.js',
  host: 'localhost',
  themeConfig: {
    repo: 'technowledgy/vue-postgrest',
    docsDir: 'docs',
    docsBranch: 'main',
    editLinks: true,
    smoothScroll: true,
    sidebarDepth: 2,
    sidebar: [ 
      '/start/',
      '/guide/',
      '/api/',
      '/query/'
    ],
    lastUpdated: 'Last Updated',
    nextLinks: false,
    prevLinks: false
  },
  plugins: [ 
    '@vuepress/active-header-links',
    '@vuepress/back-to-top'
  ],
  chainWebpack: (config) => {
    config.module
      .rule('js')
      .use('babel-loader')
      .tap(options => Object.assign(options, {
        plugins: [
          '@babel/plugin-proposal-optional-chaining',
          '@babel/plugin-proposal-nullish-coalescing-operator'
        ]
      }))
    }
}