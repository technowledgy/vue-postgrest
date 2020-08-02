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

When installed, the plugin registers the `postgrest` component globally on your vue instance for use in your templates, as well as several instance methods on `vm.$postgrest`. The most convenient way is to use the `pg` mixin, though.

::: warning
You have to install the plugin, even if you only use the mixin in your components!
:::

## Retrieving Data

To use the mixin, provide a `pgConfig` object on your component instance with the `route` option set to the table/view you want to query:

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

### Column Filtering

To access the data sent by the server, use `pg.items`, which is an array holding the server response by default.

``` vue
<template>
  <ul>
    <li v-for="hero in pg.items" :key="hero.id">{{ hero.name }}</li>
  </ul>
</template>
```

Using the mixin option `accept = 'single'` will set the `Accept` header to tell postgREST to return a single item unenclosed by an array. If `accept === 'single'` you can use `pg.item` to access the returned item.

**Note:** The `accept` option can be set to `'text'` or `'binary'` as well, which are shortcuts to setting the appropriate header to tell postgREST to return text or binary data. If setting 'text' or 'binary' the response data will be available via `pg.data` or the slot prop `data`, respectively.

The mixin option `query` is used to construct the postgREST query string. Use `query.select` for column filtering like this:

``` vue
<script>
...
  pgConfig: {
    query: {
      select: ['id', 'name']
    }
  }
...
</script>
```

The select key alternatively accepts an object with column names as keys. You can use aliasing and casting like this:

``` vue
<script>
...
  pgConfig: {
    query: {
      select: {
        id: true,
        'fullName:name': true,
        'age::text': true
      }
    }
  }
...
</script>
```

### Ordering

To order your response, you can either pass an array of strings or an object to `pgConfig.order`. E.g.:

``` vue
<script>
...
    query: {
      select: ['*'],
      order: ['id.asc', 'name.desc']
    }
...
</script>

// or

<script>
...
    query: {
      select: ['*'],
      order: {
        id: 'asc',
        name: 'desc'
      }
    }
...
</script>
```

### Row Filtering

The `query` constructs column conditions from it's keys. Operators are dot-appendend to the key.
E.g. to use multiple conditions on one column:

``` vue
<script>
...
    query: {
      select: ['*'],
      'id.in': [1, 2, 3],
      'age.gte': 50
      }
    }
...
</script>
```

When passing arrays, the resulting query string is constructed based on the used operator! See [Arrays]((/query/#arrays)). Furthermore, `undefined` values will exclude the column condition from the query string - this can be useful if you create your query object dynamically.


::: tip
For convenient creation of range objects see [Range Objects](/query/range-objects)!
:::

### Embedding

PostgREST offers an easy way to handle relationships between tables/views. You can leverage this by using the embed syntax in your queries. The syntax to filter, order or select embeds corresponds to the root level of the query object: 

``` vue
<script>
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
</script>
```

**Important:** If you omit the `select` key in an embed object, it is assumed that you want to access a JSON-field instead of embedding a resource! See [JSON Columns](/query/#json-columns) for details.

### Loading / Refreshing

For monitoring the current status of the request, you can use `vm.pg.get` which is an [ObservableFunction](/api/#observable-function). `pg.get.isPending` tells you, if a request is still pending:

``` vue
<template>
  <loading-spinner v-if="pg.get.isPending"/>
  <ul v-else>
    <li v-for="hero in pg.items" :key="hero.id">{{ hero.name }}</li>
  </ul>
</template>
```

You can call the `get` function to rerun the get request, e.g. if you need to refresh your data manually.

**Note:** The `get` function also exposes getters for information about failed requests, see [error handling](./#error-handling).

### Pagination

Server side pagination can be achieved by setting the mixin options `limit` and `offset`. When used as a mixin option (or component prop), these options set the appropriate request headers automatically. When used inside a query object, limit and offset will be appended to the query string.

**Range**
To get information about the paginated response, the mixin provides the `pg.range` object, based on the response's `Content-Range` header. To get the total count of available rows, use the mixin option `count = 'exact'` which sets the corresponding `Prefer` header.

``` vue
<template>
...
  <span>Displaying hero no. {{ pg.range.first }} to {{ pg.range.last }} of {{ pg.range.totalCount }} total Heroes</span>
  <button @click="offset += 20">Next 20 Heroes</button>
  <button @click="offset -= 20" :disabled="offset - 20 < 0">Previous 20 Heroes</button>
...
</template>

<script>
...
  data () {
    return {
      offset: 0
    }
  },
  computed: {
    pgConfig () {
      return {
        route: 'heroes',
        query: {
          select: ['*'],
          vehicles: {
            select: ['*'],
            limit: 5
          }
        },
        limit: 20,
        offset: this.offset
      }
    }
  }
}
</script>
```

### Multiple Requests

Sometimes it may be neccessary to access multiple tables/views or query the same route twice the from the same component. You can use the `postgrest` component for this.

The component takes the same options as the `pg` mixin as props and provides it's scope as slot props, so you can use it in your template like this:

``` vue
<template>
  <!-- fetch and display the latest entries -->
  <div class="heroes-list">
    <postgrest
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
```

**Note:** If you encounter situations where it is more convenient to do this programmatically, you can also use instance methods! The `vm.$postgrest` exposes a [Route](/api/#postgrest-route) for each table/view that is available in your schema. We could then rewrite the above example like this:

``` vue
<template>
  <div class="heroes-list">
    <!-- display the latest entries -->
    <div v-if="latestHeroes.length">
      Our new heroes are {{ latestHeroes[0].name }} and {{ latestHeroes[1].name }}!
    </div>
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

Each item provided by the mixin or the component is a [Generic Model](/api/#genericmodel), which is a wrapper for the entity received from the server with some added methods and getters. 

Getting an item, modifying it's data and patching it on the server can be as simple as:

``` vue
<template>
...
  <input type="text" v-model="hero.name" @blur="hero.$patch"/>
...
</template>

<script>
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
</script>
```

::: warning
The instance methods `$postgrest.ROUTE.METHOD` do not wrap the response in GenericModels but return the fetch `Response` directly.
:::

### Model State

Just like the mixin method `pg.get`, the request-specific methods provided by a GenericModel are [ObservableFunctions](/api/#observablefunction). This means, you can check on the status of pending requests or errors via the respective getters. In addition, GenericModels provide the getter `item.$isDirty`, which indicates if the item's data changed from it's initial state, as well as a `$reset` method, which resets the data to it's initial state.

**Note:** The model is updated after $patch requests by default and `initial state` is set to the updated data. If you don't want to update the model, e.g. when doing a partial patch, set the `$patch` option `return='minimal'`.

The optional first argument to the `item.$patch` method is an object with patch data. The second argument to `$patch` is an options object.See [$patch](/api/#patch-data-options) for details.

A more extensive example could look like this:

``` vue
<template>
...
  <div v-if="hero in heroes" :key="hero.id">
    <input :class="{ dirty: hero.$isDirty }" type="text" v-model="hero.name"/>
    <button @click="powerUp(hero)">Make Superhero!</button>
    <button @click="patch(hero)">Update</button>
    <button @click="delete(hero)">Delete</button>
    <button @click="hero.$reset">Reset</button>
  </div>
...
</template>

<script>
...
  computed: {
    pgConfig () {
      return {
        route: 'heroes',
        query: {}
      }
    },
    heroes () {
      return this.pg.items
    },
  methods () {
    async patch (hero) {
      await hero.$patch({}, { columns: ['name'] })
    },
    async powerUp (hero) {
      await hero.$patch({ superhero: true })
    },
    async delete (hero) {
      await hero.$delete()
      // refresh the heroes list after delete
      this.pg.get()
    }
  }
...
</script>
```

Using the `postgrest` component and it's slot scope for patching:

``` vue
<template>
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
          <input :class="{ dirty: hero.$isDirty }" type="text" v-model="hero.name"/>
          <button @click="update(hero)">Update</button>
        </div>
      </div>
    </template>
  </postgrest>
...
</template>

<script>
...
  methods: {
    async update (item) {
      await item.$patch({ 'updated_by': this.$store.getters.userId })
    }
  }
...
</script>
```

**Note:** No request is sent, if `$isDirty === false` or no patch data object is passed!

## Creating Models

When the mixin option `pg.newTemplate` is set, a new [GenericModel](/api/#genericmodel) is provided on `pg.newItem` (or the `postgrest` component slot scope). You can use it's `$post` method to send a post request on the specified `route`. Creating a new item, modifying it's data and posting it to the server could look like this:

``` vue
<template>
...
  <input type="text" v-model="newItem.name"/>
  <button @click="post"/>Create new Hero</button>
...
</template>

<script>
...
  computed: {
    pgConfig () {
      return {
        route: 'heroes',
        newTemplate: {
          name: 'New Hero'
        }
      }
    }
  },
  methods: {
    async post () {
      // setting return to minimal, so the newItem is not updated with the server response and can be reset to our newTemplate later
      await this.newItem.$post({ return: 'minimal' })
      // resetting newItem to our initial template
      this.newItem.$reset()
    }
  }
...
</script>
```

### Upserts

You can do an upsert (insert or update, when it already exists) with either a `POST` or a `PUT` request. To make a `PUT` request, just call `$put()` on the model - but make sure to set the primary key on the model first.

Alternatively, you can use all options that a [route](/api/#postgrest-route) offers with `$post()`. To perform an upsert, you can pass the `resolution` option, which sets the resolution part of the `Prefer` header. To set the `on_conflict` query string parameter, see [Query](/query/#on-conflict).

Example for `$post()` upsert:

``` vue
<template>
...
  <input type="text" v-model="hero.name"/>
  <button @click="post"/>Create Hero</button>
...
</template>

<script>
...
  computed: {
    pgConfig () {
      return {
        route: 'heroes',
        newTemplate: {
          name: 'New Hero'
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
</script>
```

## Handling Errors

### Mixin / Component

The mixin calls the `onError` hook on your component instance whenever a [FetchError](/api/#fetcherror) or an [AuthError](/api/#autherror) is thrown. To react to errors from the `postgrest` component, use the `error` event. The error object is passed to the hook/event.

### GenericModel / Instance Methods / Stored Procedures

All request-specific methods from a [GenericModel](/api/#genericmodel), as well as the [instance methods](/api/#instancemethods) and [stored procedure calls](/api/#postgrest-rpc-function-name-options-params) throw [AuthError](/api/#autherror) and [FetchError](/api/#fetcherror).
Additionally, the generic model methods throw [PrimaryKeyError](/api/#primarykeyerror).

::: tip
You can test whether a schema was found for the base URI by catching [SchemaNotFoundError](/api/#schemanotfounderror) on [$postgrest.$ready](/api/#postgrest-ready).
:::

### Full Example

``` vue
<template>
  <div>
    <postgrest
      route="vehicles"
      query="{}"
      @error="handleError">
      <div #default="{ get, items }">
        <span v-if="get.hasErrors">Could not load vehicles...</span>
        <div v-else>
          <div v-for="item in items" :key="item.id">
            <input type="text" v-model="item.type" @blur="updateVehicle(item)"/>
          </div>
        </div>
      </div>
    </postgrest>
    <button @click="deleteHero">Delete Hero!</button>
    <button @click="destroyPlanets">Destroy all Planets!</button>
  </div>
</template>

<script>
import { pg, AuthError, FetchError } from 'vue-postgrest'

export default {
  name: 'Component',
  mixins: [pg],
  data () {
    return {
      pgConfig: {
        route: 'heroes',
        query: {
          'id.eq': 1
        }
      }
    }
  },
  // mixin hook
  onError (err) {
    this.handleError(err)
  },
  methods: {
    async destroyPlanets () {
      try {
        await this.$postgrest.rpc.destroyAllPlanets()
      } catch (e) {
        this.handleError(e)
      }
    },
    async deleteHero () {
      try {
        await this.pg.item.$delete()
      } catch (e) {
        this.handleError(e)
      }
    },
    async updateVehicle (item) {
      try {
        await item.$patch()
      } catch (e) {
        this.handleError(e)
      }
    },
    handleError (err) {
      if (err instanceof AuthError) {
        // handle token error
        // AuthError is thrown when postgREST rejects the token
      } else if (err instanceof FetchError) {
        // handle error from fetch
        // FetchError is thrown when the reponse status code is >= 400
      }
    }
  }
}
</script>
```

## Stored Procedures

For calling stored procedures, the instance method `$postgrest.rpc` is provided. On loading the schema, all available stored procedures are registered here. The stored procedure call accepts an object containing the parameters that are passed to the stored procedure and an options object. By default, RPCs are called with the request method `POST`, you can set the rpc option `get: true` if you want to call a RPC with `GET` instead. For setting the `Accept` header, use the option `accept`.

``` vue
<script>
export default {
  name: 'Component',
  methods: {
    async destroyAllPlanets () {
      // wait till schema is loaded
      await this.$postgrest.$ready
      const result = await this.$postgrest.rpc.destroyplanets({ countdown: false }, { 
        accept: 'text',
        headers: { 'Warning': 'Will cause problems!' }
      })
      if (await result.text() !== 'all gone!') {
        this.$postgrest.rpc.destroyplanets({ force: true })
      }
    }
  }
}
</script>
```

::: tip
If you want to call a RPC before the schema is loaded, you can call `$postgrest.rpc` directly by passing the name of the stored procedure that should be called as the first argument, followed by the rpc parameters and options. See [RPC](/api/#postgrest-rpc-function-name-options-params) for details.
:::

## Authentication

The most convenient way to set the `Authorization` header to include your jwt token is to use the [setDefaultToken](/api/#setdefaulttoken) method exported by the module. This method sets the token to use for all subsequent communication with the postgREST server.

``` vue
import { setDefaultToken } from 'vue-postgrest'

<script>
  name: 'App',
  mounted () {
    setDefaultToken(this.$store.getters.authToken)
  }
}
</script>
```

If you want to overwrite the token used for specific requests, you can either use the mixin option `token` or the component prop, respectively.

To handle rejected requests due to token errors, use the `AuthError` that is thrown when the server rejects your token, see [Handling Errors](./#handling-errors) for details.

::: tip
You can use the instance method `$postgrest` to create a new schema. If you set the first argument (`apiRoot`) to undefined, a new schema is created with the base URI used by the default schema. You can pass an auth token as the second argument, which will then be used for subsequent requests with the new schema.
:::