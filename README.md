<div align="center">

[![Travis (.org)](https://img.shields.io/travis/technowledgy/vue-postgrest)](https://travis-ci.org/technowledgy/vue-postgrest)
[![Coveralls github](https://img.shields.io/coveralls/github/technowledgy/vue-postgrest)](https://coveralls.io/github/technowledgy/vue-postgrest)
[![Depfu](https://img.shields.io/depfu/technowledgy/vue-postgrest)](https://depfu.com/repos/github/technowledgy/vue-postgrest)
[![NPM](https://img.shields.io/npm/l/vue-postgrest)](https://github.com/technowledgy/vue-postgrest/blob/master/LICENSE)
[![npm](https://img.shields.io/npm/v/vue-postgrest)](https://www.npmjs.com/package/vue-postgrest)

</div>

# vue-postgrest
Vue.js Component providing PostgREST integration

## Docs

[See the official documentation](https://technowledgy.github.io/vue-postgrest/)

## Quick Start

To get started, install vue-postgrest via your package manager:

``` bash
yarn add vue-postgrest
# OR npm install vue-postgrest
```

Import and install the Plugin in your `main.js`:

``` javascript
import Vue from 'vue'
import Postgrest from 'vue-postgrest'

Vue.use(Postgrest)
```

You can use the `<postgrest>` component:

``` html
<postgrest route="ROUTE" query={}>
  <template #default="{ items }">
    {{ items }}
  </template>
</postgrest>
```

Use the `pg` mixin:

``` vue
<template>
  <div>{{ pg.items }}</div>
</template>

<script>
import { pg } from 'vue-postgrest'

export default {
  mixins: [pg],
  computed: {
    pgConfig () {
      return {
        route: 'ROUTE',
        query: {}
      }
    }
  }
}
</script>
```

Or you can directly use the instance method provided on your Vue instance:

``` javascript
this.$postgrest.ROUTE.get()
```
