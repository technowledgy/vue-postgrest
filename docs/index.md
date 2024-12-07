---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "vue-postgrest"
  text: "PostgREST integration for Vue.js"
  tagline: Uses the Fetch API under the hood. Dependency free.
  actions:
    - theme: brand
      text: Get Started →
      link: /start/
    - theme: alt
      text: Guide
      link: /guide/
    - theme: alt
      text: API
      link: /api/
    - theme: alt
      text: Query
      link: /query/

features:
  - title: Flexible
    details: Make requests through <code>&lt;postgrest&gt;</code> components, the <code>pg</code> mixin or <code>$postgrest</code> instance methods.
  - title: Easy to use
    details: Edit items with <code>v-model</code> and persist with <code>item.$post()</code>, <code>item.$patch()</code> and <code>item.$delete()</code>.
  - title: Powerful
    details: Fully supports the PostgREST query syntax, including filtering, resource embedding and RPCs.
---
