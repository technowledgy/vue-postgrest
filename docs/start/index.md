# Quick Start

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
  <template #default="items">
    {{ items }}
  </template>
</postgrest>
```

Use the `pg` mixin:

``` vue
<template>
  <div>{{ items }}</div>
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
    },
    items () {
      return this.pg
    }
  }
}
</script>
```

Or you can directly use the instance method provided on your Vue instance:

``` javascript
this.$postgrest.ROUTE.get()
```

For in depth documentation see the [API](../api) and [Query](../query) documentation.
