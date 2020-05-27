# Guide

## Installation

To get started, install vue-postgrest via your package manager:

``` bash
yarn add vue-postgrest
```

``` bash
npm install vue-postgrest
```

The default export provides the plugin to use in your `main.js`. When installing the plugin, you can pass the root URI of your postgREST server as a plugin option. All requests to the API made by the mixin, component or instance methods will use this URI as base.

``` js
import Vue from 'vue'
import VuePostgrest from 'vue-postgrest'

Vue.use(VuePostgrest, {
  apiRoot:  '/api/v1/'
})
```

When installed, the plugin registers a global `postgrest` component on your vue instance for use in your templates, as well as several instance methods on `vm.$postgrest`.

## Retrieving Data

To use the `pg` mixin, provide a `pgConfig` object on your component instance with the `route` option set to the table/view you want to query:

``` vue
<script>
import { pg } from 'vue-postgrest'

export default {
  name: 'HeroesList',
  mixins: [pg],
  data () {
    return {
      pgConfig: {
        route: 'heroes'
      }
    }
  }
}
</script>
```

When loaded, the mixin will send a GET request to your postgREST server. You can change the base URI the mixin uses, without affecting the URI set via the apiRoot plugin option:

``` vue
...
      pgConfig: {
        apiRoot: '/api/v2/',
        route: 'heroes'
      }
...
```

### Column Filtering

To access the data sent by the server, use `pg.items`, which is an array holding the server response by default.

``` vue
...
<template>
  <ul>
    <li v-for="hero in pg.items" :key="hero.id">{{ hero.name }}</li>
  </ul>
</template>
...
```

Using the mixin option `accept = 'single'` will set the `Accept` header to tell postgREST to return a single item unenclosed by an array. If `accept === 'single'` you can use `pg.item` to access the returned item.

**Note:** The `accept` option can be set to `'text'` or `'binary'` as well, which are shortcuts to setting the appropriate header to tell postgREST to return text or binary data. Additionally you can set the `Accept` header directly by `accept = 'CUSTOM_HEADER_VALUE'`.

The mixin option `query` is used to construct the postgREST query string. Use `query.select` for column filtering like this:

``` vue
...
  pgConfig: {
    query: {
      select: ['id', 'name']
    }
  }
...

```

The select key alternatively accepts an object with column names as keys. You can use aliasing, hints and casting like this:

``` vue
...
  pgConfig: {
    query: {
      select: {
        id: true,
        'fullName:name': true
      }
    }
  }
...

```

### Ordering

To order your response, you can either pass an array of strings or an object to `pgConfig.order`. E.g.:

``` vue
...
    query: {
      select: ['*'],
      order: ['id.asc', 'name.desc']
    }
...

// or

...
    query: {
      select: ['*'],
      order: {
        id: 'asc',
        name: 'desc'
      }
    }
...
```

### Row Filtering

The `query` constructs column conditions from it's keys. Operators can either be dot-appendend to the key or passed via an object.
E.g. to use multiple conditions on one column:

``` vue
...
    query: {
      select: ['*'],
      'id.in': [1, 2, 3],
      age: {
        gte: 50,
        lte: 100
      }
    }
...
```

When passing arrays, the resulting query string is constructed based on the used operator! See [Arrays]((/query/#arrays)). Furthermore, `undefined` values will exclude the column condition from the query string - this can be useful if you create your query object dynamically.


::: tip
For convenient creation of range objects see [Range Objects](/query/range-objects)!
:::

### Embedding

PostgREST offers an easy way to handle relationships between tables/views. You can leverage this by using the embed syntax in your queries. The syntax to filter, order or select embeds corresponds to the root level of the query object: 

``` vue
...
    query: {
      select: {
        id: true,
        name: true,
        superpowers: true,
        'cars:vehicles': {
          select: '*',
          'type.eq': 'car'
        },
      'id.eq': 1
    }
...
```

**Important:** If you omit the `select` key in an embed object, it is assumed that you want to access a JSON-field instead of embedding a resource! See [JSON Columns](/query/#json-columns) for details.

### Loading / Refreshing

For monitoring the current status of the request, you can use `vm.pg.get` which is an [ObservableFunction](/api/#observable-function). `pg.get.isPending` tells you, if a request is still pending:

``` vue
...
<template>
  <loading-spinner v-if="pg.get.isPending"/>
  <ul v-else>
    <li v-for="hero in pg.items" :key="hero.id">{{ hero.name }}</li>
  </ul>
</template>
...
```

You can call the `get` function to rerun the get request, e.g. if you need to refresh your data manually. The current number of pending requests is stored in `pg.get.nPending`.

**Note:** The `get` function also exposes getters for information about failed requests, see [error handling](./#error-handling).

### Pagination

Server side pagination can be achieved by setting the mixin options `limit` and `offset`. When used on the query object root level, these options set the appropriate request headers automatically. When used inside an embed object, limit and offset will be appended to the query string.

``` vue
<template>
  <loading-spinner v-if="pg.get.isPending"/>
  <button @click="offset += 20">Next 20 Heroes</button>
  <button @click="offset -= 20" :disabled="offset - 20 < 0">Previous 20 Heroes</button>
  <ul v-else>
    <li v-for="hero in heroes" :key="hero.id">{{ hero.name }}</li>
  </ul>
</template>

<script>
import { pg } from 'vue-postgrest'
import LoadingSpinner from '@/components/LoadingSpinner'

export default {
  name: 'HeroesList',
  mixins: [pg],
  components: {
    LoadingSpinner
  },
  data () {
    return {
      offset: 0
    }
  },
  computed: {
    pgConfig () {
      return {
        apiRoot: '/api/v2/'
        route: 'heroes',
        query: {
          select: ['id', 'name', 'superpowers', 'age', 'alive'],
          'superpowers.in': ['fly', 'invisible'],
          age: {
            or: {
              gte: 100,
              lte: 200
            }
          },
          'alive.is': true,
          vehicles: {
            select: ['*'],
            'type.eq': 'car',
            limit: 5
          }
        },
        limit: 20,
        offset: this.offset
      }
    },
    heroes () {
      return this.pg.items
    }
  }
}
</script>
```

**Range**

To get information about the paginated response, the mixin provides the `pg.range` object, based on the response's `Content-Range` header. To get the total count of available rows, use the mixin option `count = 'exact'` which sets the corresponding `Prefer` header.

``` vue
...
  computed: {
    firstItem () {
      // the first retrieved item
      return this.pg.range.first
    },
    lastItem () {
      // the last retrieved item
      return this.pg.range.last
    },
    totalCount () {
      //
      return this.pg.range.totalCount
    }
  }
...
```

### Multiple Requests

Sometimes it may be neccessary to access multiple tables/views or query the same route twice the from the same component. You can use the `postgrest` component for this.

The component takes the same options as the `pg` mixin as props and provides it's scope as slot props, so you can use it in your template like this:

``` vue
<template>
  <!-- fetch and display the latest entries -->
  <div class="heroes-list">
    <postgrest
      api-root="/api/v2/"
      route="heroes"
      query = "{
        select: ['name'],
        order: {
          'created_at': 'desc'
        }
      }"
      :limit="2"
      />
      <template #default="{ get, items: heroes }">
        <loading-spinner v-if="get.isPending"/>
        <div v-else>
          Our new heroes are {{ heroes[0].name }} and {{ heroes[1].name }}!
        </div>
      </template>
    </postgrest>
    <!-- display the heroes list fetched by the mixin -->
    <loading-spinner v-if="pg.get.isPending"/>
    <ul v-else>
      <li v-for="hero in pg.items" :key="hero.id">{{ hero.name }}</li>
    </ul>
  </div>
</template>

....
```

**Note:** If you encounter situations where it is more convenient to do this programmatically, you can also use instance methods! The `vm.$postgrest` exposes a `Route` for each table/view that is available in your schema. We could then rewrite the above example like this:

``` vue
<template>
  <div class="heroes-list">
    <!-- display the latest entries -->
    <div v-if="latestHeroes.length">
      Our new heroes are {{ latestHeroes[0].name }} and {{ latestHeroes[1].name }}!
    </div>
    </postgrest>
    <!-- display the heroes list fetched by the mixin -->
    ...
  </div>
</template>

<script>
...
  data () {
    return {
      latestHeroes: []
    }
  },
  computed: {
    pgConfig () {
      ...
    },
    heroes () {
      return this.pg.items
    }
  },
  async mounted () {
    // wait for schema to be loaded, so the routes are available
    await this.$postgrest.$ready
    // fetch the latest two new heroes
    const resp = await this.$postgrest.heroes.get({
      select: ['name'],
      order: {
        'created_at': 'desc'
      }
    }, {
      limit: 2
    })
    // convert fetch response to json
    this.latestHeroes = await resp.json()
  }
}
</script>
....
```

## Modifying Data

Each item provided by the mixin or the component is a [Generic Model](/api/#genericmodel), which basically is a wrapper for the entity received from the server with some added methods and getters. 

**Note:** The instance methods do not wrap the response in GenericModels but return the fetch `Response` directly.

Getting an item, modifying it's data and patching it on the server can be as simple as:

``` vue
...
  <input type="text" v-model="hero.name" @blur="hero.$patch"/>
...
  computed: {
    pgConfig () {
      return {
        route: 'heroes',
        query: {
          'id.eq': 1
        },
        accept: 'single'
      }
    },
    hero () {
      return this.pg.item
    }
...
```

### Model State

Just like the mixin method `pg.get`, the request-specific methods provided by a GenericModel are [ObservableFunctions](/api/#observablefunction). This means, you can check on the status of pending requests or errors via the respective getters. In addition, GenericModels provide the getter `item.$isDirty`, which indicates if the item's data changed from it's initial state, as well as a `$reset` method, which resets the data to it's initial state.

**Note:** The initial state is set to the response from the server after $patch requests by default. If you want to preserve the local changes while patching, e.g. when doing a partial patch, set the $patch option `return='minimal'`.

The first argument to the `item.$patch` method is an optional object with patch data. The second argument to `$patch` is an options object. If you want to improve the performance on updates, you can set the `columns` option here. See [$patch](/api/#patch-data-options) for details.

A more extensive example could look like this:

``` vue
...
  <input type="text" v-model="hero.name"/>
  <button @click="powerUp">Make Superhero!</button>
  <button @click="patch">Update</button>
  <button @click="hero.$delete">Delete</button>
  <button @click="hero.$reset">Reset</button>
...
  computed: {
    pgConfig () {
      return {
        route: 'heroes',
        query: {
          'id.eq': 1
        },
        accept: 'single'
      }
    },
    hero () {
      return this.pg.item
    },
  methods () {
    async patch () {
      if (this.hero.$isDirty) {
        await this.hero.$patch({}, { columns: ['name'] })
      }
    },
    async powerUp () {
      await this.hero.$patch({ superhero: true })
    }
  }
...
```

Using the `postgrest` component and it's slot scope for patching:

``` vue
...
  <postgrest
    route="heroes"
    query = "{
      select: ['id', name'],
      'age.gt': 25
    }"
    />
    <template #default="{ get, items: heroes }">
      <loading-spinner v-if="get.isPending"/>
      <div v-else>
        <div v-for="hero in heroes" :key="hero.id">
          <input type="text" v-model="hero.name"/>
          <button @click="update(hero)">Update</button>
        </div>
      </div>
    </template>
  </postgrest>
...
  methods: {
    async update (item) {
      if (item.$isDirty) {
        await item.$patch({ 'updated_by': this.$store.getters.userId })
      }
    }
  }
```

## Creating Models

When the mixin option `pg.newTemplate` is set, a new [GenericModel](/api/#genericmodel) is provided on `pg.newItem` (or the `postgrest` component slot scope). You can use it's `$post` method to send a post request on the specified `route`. Creating a new item, modifying it's data and posting it to the server could look like this:

``` vue
...
  <input type="text" v-model="hero.name"/>
  <button @click="post"/>Create Hero</button>
...
  computed: {
    pgConfig () {
      return {
        route: 'heroes',
        newTemplate: {
          name: 'New Hero'
        }
      }
    },
    hero () {
      return this.pg.newItem
    }
  },
  methods: {
    async post () {
      await this.hero.$post()
    }
  }
...
```

The `$post` method accepts a options object as it's first argument to set the `columns` option as well as the `Accept` header via the `return` option. See [patching](./#modifying-data) for more details.

### Upserts

As with all GenericModel methods, you can use all options that a [route](/api/#postgrest-route) offers. To perform an upsert, you can pass the `resolution` option, which sets the resolution part of the `Prefer` header. To set the `on_conflict` querry string parameter, see [Query](/query/#on-conflict).

``` vue
...
  <input type="text" v-model="hero.name"/>
  <button @click="post"/>Create Hero</button>
...
  computed: {
    pgConfig () {
      return {
        route: 'heroes',
        newTemplate: {
          name: 'New Hero',

        },
        query: {
          'on_conflict': name
        }
      }
    },
    hero () {
      return this.pg.newItem
    }
  },
  methods: {
    async post () {
      await this.hero.$post({ resolution: 'merge-duplicates' })
    }
  }
...
```

## Handling Errors

catching component events and the onError hook, what kind of errors are emitted and when to use them

## Stored Procedures

how to call stored procedures and their return values

## Authentication

how to work with token, setDefaultToken, AuthError

## Full Example

a full example, demonstrating the single steps