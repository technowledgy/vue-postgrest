# Quick Start

Install it:

``` bash
yarn add vue-postgrest
# OR npm install -g vuepress
```

Load it:

``` javascript
import Vue from 'vue'
import Postgrest from 'vue-postgrest'

Vue.use(Postgrest)
```

Use as component:

``` html
<postgrest route="ROUTE">
  <template #default="{ items }">
    {{ items }}
  </template>
</postgrest>
```

Use as mixin:

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
        route: 'ROUTE'
      }
    }
  }
}
</script>
```

As instance method:

``` javascript
this.$postgrest.ROUTE.get()
```