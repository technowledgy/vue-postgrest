import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "vue-postgrest",
  description: "PostgREST integration for Vue.js",
  base: '/vue-postgrest/',
  host: 'localhost',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/technowledgy/vue-postgrest'
      }
    ],
    externalLinkIcon: true,
    search: {
      provider: 'local'
    },
    nav: [
      {
        text: 'Quick Start',
        link: '/start/'
      },
      {
        text: 'Guide',
        link: '/guide/'
      },
      {
        text: 'API',
        link: '/api/'
      },
      {
        text: 'Query',
        link: '/query/'
      }
    ],
    outline: {
      level: [2, 3]
    },
    editLink: {
      pattern: 'https://github.com/technowledgy/vue-postgrest/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },
    lastUpdated: {
      text: 'Last Updated'
    },
    docFooter: {
      next: false,
      prev: false
    },
    footer: {
      message: 'MIT Licensed',
      copyright: 'Copyright © 2020 Sports Technowledgy UG'
    }
  }
})
