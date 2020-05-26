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

The `pg` mixin is an easy way to equip your components with the power to communicate with your postgREST API. First, let's import it and add it to the component's mixins:

``` vue
<script>
import { pg } from 'vue-postgrest'

export default {
  name: 'HerosList',
  mixins: [pg]
}
</script>
```

### Querying

We have to tell the mixin, what table/view it should query. For configuration, your component has to provide an object called `pgConfig`. For now, let's provide this via `data`:

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

When our `HeroesList` component is loaded, the mixin will send a GET request to `/api/v2/heroes`, since we specified `'/api/v1/'` as our base URI when installing the plugin. What if we want to use the next API-version to fetch our heroes without changing the base URI for the rest of the app? No problem, we specify the apiRoot option here and it will change the baseUri for this specific component only:

``` vue
...
      pgConfig: {
        apiRoot: '/api/v2/'
        route: 'heroes'
      }
...
```

### Filtering & Accessing Response Data

We can access the data that returned by the server via the `pg` attribute that the mixin added to our component instance. By default, an array of response items is provided in `pg.items`. Let's render a list with the names of all our heros:

``` vue
...
<template>
  <ul>
    <li v-for="hero in pg.items" :key="hero.id">{{ hero.name }}</li>
  </ul>
</template>
...
```

Nice! Now, let's add a profile component for our heroes. To filter rows in our DB, we have to tell postgREST about column conditions. We do this by providing the mixin option `query`. Let's fetch the hero with `id === 1` by using the postgREST operator `eq`:

``` vue
<template>
  <h1>{{ pg.items[0].name }}</h1>
  <span>{{ pg.items[0].id }}</span>
  <ul>
    <li v-for="superpower in pg.items[0].superpowers" :key="superpower">{{ superpower }}</li>
  </ul>
</template>

<script>
import { pg } from 'vue-postgrest'

export default {
  name: 'HeroProfile',
  mixins: [pg],
  data () {
    return {
      pgConfig: {
        apiRoot: '/api/v2/'
        route: 'heroes',
        query: {
          'id.eq': 1
        }
      }
    }
  }
}
</script>
```

If we want to request a single hero, we can tell postgREST to directly return an object instead of the array via `pgConfig.accept = 'single'`. While we are at it, let's query the server only for columns that we need for our profile and clean up our template a bit. Our hero profile now looks like this:

``` vue
<template>
  <h1>{{ hero.name }}</h1>
  <span>{{ hero.id }}</span>
  <ul>
    <li v-for="superpower in hero.superpowers" :key="superpower">{{ superpower }}</li>
  </ul>
</template>

<script>
import { pg } from 'vue-postgrest'

export default {
  name: 'HeroProfile',
  mixins: [pg],
  data () {
    return {
      pgConfig: {
        apiRoot: '/api/v2/'
        route: 'heroes',
        query: {
          select: ['id', 'name', 'superpowers'],
          'id.eq': 1
        },
        accept: 'single'
      }
    }
  },
  computed: {
    hero () {
      return this.pg.item
    }
  }
}
</script>
```

**Note:** When using `accept: 'single'`, the server reponse is provided via the `vm.pg.item` (instead of `vm.pg.items`).

### Request State

Back to our list of heroes. Retrieving data from the server is an async operation, so we should wait for the request to finish before using the reponse. For this, we can use `vm.pg.get` which is an [ObservableFunction](/api/#observable-function) representing the GET request. Let's add a loading spinner to our component, so the user knows that the heroes are on their way.

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

### Advanced Filtering & Pagination

Say we have a lot of heroes in our DB - we want to tell the server to filter the results based on some more advanced conditions and limit the response to only 20 heroes at once, while giving the user the possibility to choose a offset.

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
          'alive.is': true
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

::: tip
See [Query](/query) for the available query syntax!
:::

### Embedding

PostgREST offers an easy way to handle relationships between tables/views. We can leverage this by using the embed syntax in our queries. In our case, the `vehicles` table has a column `hero_id` which references our hero and one hero can have many vehicles (1:N). To embed the data from the `vehicles` table that belongs to our hero, we can modify our query like this:

``` js
query: {
  select: ['id', 'name', 'superpowers', 'vehicles(*)'],
  'id.eq': 1
},
```

This query embeds all rows in `vehicles` referenced by the hero's id and returns them as entries in the `vehicles` array in our response. To be able to filter the vehicles for our hero, we modify our query syntax a little bit:


``` js
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
},
```

### Multiple Requests

Sometimes it may be neccessary to access multiple tables/views or query the same route twice the from the same component. In our case, we want to show the two latest entries to our heroes table on top of our list of heroes while still letting the server handle the pagination. Since this a very simple request, we don't want to create another component with another `pg` mixin, but handle this in our `HeroesList` component directly. Let's see how we can use the `postgrest` component to solve this.

The `postgrest` component takes the same options as the `pg` mixin as props and provides its scope as slot props, so wen can use it in our template like this:

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

**Note:** If you encounter situations where it is more convenient to do this programmatically, you can also use instance methods! The `vm.$postgrest` exposes a `Route` for each table/view that is available in your schema. We could rewrite the above example like this:

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
    this.latestHeroes = resp.json()
  }
}
</script>
....
```

## Modifying Data

how to work with the models, modifying data and patching, resetting, isDirty

## Creating Models

creating newTemplates and posting etc.

## Handling Errors

catching component events and the onError hook, what kind of errors are emitted and when to use them

## Stored Procedures

how to call stored procedures and their return values

## Authentication

how to work with token, setDefaultToken, AuthError

## Full Example

a full example, demonstrating the single steps