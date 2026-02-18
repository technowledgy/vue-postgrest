# Quick Start

To get started, install vue-postgrest via your package manager:

``` bash
yarn add vue-postgrest
# OR npm install vue-postgrest
```

Import and install the Plugin in your `main.js`:

``` javascript
import { createApp } from 'vue'
import Postgrest from 'vue-postgrest'

createApp(...).use(Postgrest)
```

You can use the `<postgrest>` component:

``` vue
<postgrest route="ROUTE" query={}>
  <template #default="items">
    {{ items }}
  </template>
</postgrest>
```

Use the `usePg` composable in `setup()`:

``` vue
<template>
  <ul>
    <li v-for="item in items" :key="item.id">{{ item.name }}</li>
  </ul>
</template>

<script>
import { reactive } from 'vue'
import { usePg } from 'vue-postgrest'

export default {
  setup () {
    const pgConfig = reactive({
      route: 'ROUTE',
      query: {}
    })

    const { pg } = usePg(pgConfig, {
      onError: (err) => console.error(err)
    })

    return { items: pg }
  }
}
</script>
```

Or use the `pg` mixin:

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

For in depth documentation see the [API](../api/index) and [Query](../query/index) documentation.
