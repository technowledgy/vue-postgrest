# API

## Module Exports

The `vue-postgrest` module exports a plugin, a mixin and several helper functions and classes.

### VuePostgrest - Plugin

- **Type:** `VuePlugin`

- **Usage:**
  
  Installing the plugin registers the instance method $postgrest on your Vue instance. See available [plugin options](./#plugin-options).

  ::: warning
  You have to install the plugin in any case, even if you only use the mixin in your components!
  :::

- **Example:**

  ``` js
  import Vue from 'vue'
  import VuePostgrest from 'vue-postgrest'

  Vue.use(VuePostgrest)
  ```

### pg - Mixin

- **Type:** `VueMixin`

- **Usage:**

  Import the `pg` mixin and include it in your component's `mixin` attribute. The component has to provide a `pgConfig` object specifying the [mixin options](./#mixin-options).

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'Component',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'inhabitants',
          query: {
            select: ['id' 'name', 'age']
          }
        }
      }
    },
    onError (err) {
      console.log(err)
    }
  }
  ```

### setDefaultToken(token)

- **Type:** `Function`

- **Arguments:**
  - `{string} token`

- **Returns:** `undefined`

- **Usage:**

  Set the default access token used for all authentication with the API. Sets the appropriate `Authorization` header.

  ::: tip
  You can override the token locally by setting the corresponding [component prop](./#component-props) or [mixin option](./#token).
  :::

- **Example:**

  ``` js
  import { setDefaultToken } from 'vue-postgrest'

  export default {
    name: 'App',
    async mounted: {
      // authenticate by calling a stored procedure
      const resp = await this.$postgrest.rpc('authenticate')
      // parsing fetch response body to json
      const token = await resp.json()
      // setting default access token globally
      setDefaultToken(token)
    }
  }
  ```

### AuthError

Instances of AuthError are thrown when the server rejects the authentication token.

### SchemaNotFoundError

Instances of SchemaNotFoundError are thrown, when there is no valid postgrest schema at the base URI.

### FetchError

Instances of FetchError are thrown on generic errors from Fetch that don't trigger the throw of more specific errors.

### PrimaryKeyError

Instances of PrimaryKeyError are thrown, when no primary keys are found for the specified `route` on the schema or no valid primary key is found on a [GenericModel](./#genericmodel).

## Plugin Options

Global options can be set when initializing Vue-Postgrest with `Vue.use`.

### apiRoot

- **Type:** `String`

- **Default:** `''`

- **Details:**

  The URI used as the base for all requests to the API by the mixin, global and local components, as well as the global vue-postgrest instance. This should be the URI to your PostgREST installation.

  ::: tip
  You can override the base URI locally by setting the [component prop](./#component-props) or [mixin option](./#apiroot-2).
  :::

- **Example:**

  ``` js
  import VuePostgrest from 'vue-postgrest'

  Vue.use(VuePostgrest, {
    apiRoot: '/api/'
  })
  ```

## Mixin Options

Mixin options are set in the component using the `pg` mixin by setting the `pgConfig` object on the component instance.

### apiRoot

- **Type:** `String`

- **Default:** Global [plugin option](./#plugin-options)

- **Details:**

  The URI used as the base for all requests to the API by the mixin, global and local components, as well as the global vue-postgrest instance. This should be the URI to your PostgREST installation.

  ::: tip
  This overrides the global [plugin option](./#apiroot)!
  :::

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'Component',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          apiRoot: '/another-api/'
        }
      }
    }
  }
  ```

### route <Badge text="required" type="error"/>

- **Type:** `String`

- **Details:**

  The table/view that is queried.

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'Component',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'clients'
        }
      }
    }
  }
  ```

### token

- **Type:** `String`

- **Default:** `undefined`

- **Details:**

  The access token used for authorizing the connection to the API. This options sets the `Authorization` header for all requests.

  See also [Client Auth](http://postgrest.org/en/latest/auth.html#client-auth) in the PostgREST documentation.

  ::: tip
  You can set this globally with the [setDefaultToken method](./#setdefaulttoken-token)!
  :::

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'Component',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'inhabitants',
          token: 'YOUR_API_TOKEN'
        }
      }
    }
  }
  ```

### query

- **Type:** `Object`

- **Default:** `undefined`

- **Details:**

  The query sent to the API is constructed from this option. See the [Query API](/query) as well as [API](http://postgrest.org/en/latest/api.html) in the PostgREST documentation for more details.

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'Component',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'inhabitants',
          query: {
            select: ['id', 'name', 'address'],
            and: {
              'name.not.eq': 'Tion Medon',
              'city.eq': 'Pau City',
              'age.gt': 150
            }
          }
        }
      }
    }
  }
  ```

### accept

- **Type:** `String`

- **Default:** `undefined`

- **Details:**

  Accept header to set or one of the options 'single', 'binary' or 'text', which set the correct headers automatically. Default header is set to 'application/json'. If setting 'text' or 'binary' the response data will be available via `pg.data` or the slot prop `data`, respectively.

  See also [Response Format](http://postgrest.org/en/latest/api.html#response-format) in the PostgREST documentation.

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'Component',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'inhabitants',
          query: {
            'id.eq': 1
          },
          accept: 'single'
        }
      }
    }
  }
  ```

### limit

- **Type:** `Number`

- **Default:** `undefined`

- **Details:**

  Limits the count of response items by setting `Range-Unit` and `Range` headers.

  See also [Limits and Pagination](http://postgrest.org/en/latest/api.html#limits-and-pagination) in the PostgREST documentation.

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'Component',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'inhabitants',
          query: {
            'age.gt': 150
          },
          // get the first 10 inhabitants that pass the filter query
          limit: 10
        }
      }
    }
  }
  ```


### offset

- **Type:** `Number`

- **Default:** `undefined`

- **Details:**

  Offset the response items, useful e.g. for pagination, by setting `Range-Unit` and `Range` headers.

  See also [Limits and Pagination](http://postgrest.org/en/latest/api.html#limits-and-pagination) in the PostgREST documentation.

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'Component',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'inhabitants',
          query: {
            'age.gt': 150
          },
          // get all inhabitants that pass the filter query, starting from no. 5
          offset: 5
        }
      }
    }
  }
  ```

### count

- **Type:** `String`

- **Default:** `undefined`

- **Details:**

  If set to `'exact'`, we request the total amount of items in the database that fit the filter query (disabled by default due to performance considerations) by setting the `Prefer` header accordingly.

  See also [Limits and Pagination](http://postgrest.org/en/latest/api.html#exact-count) in the PostgREST documentation.

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'Component',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'inhabitants',
          query: {
            'age.gt': 150
          },
          count: 'exact'
        }
      }
    }
  }
  ```

### newTemplate

- **Type:** `Object`

- **Default:** `undefined`

- **Details:**

  If this option is set, the instance provides a `newItem` item with it's data set to the passed template. 

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'Component',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'inhabitants',
          newTemplate: {
            age: 0,
            name: 'Newborn',
            city: 'Pau City'
          }
        }
      }
    }
  }
  ```

## Mixin Hooks

Hooks are called on the component instance that uses the `pg` mixin.

### onError

- **Type:** `Function`

- **Arguments:** 
  
  - `{FetchError | AuthError} error`

- **Details:**

  Called when a FetchError or AuthError occurs. The Hook gets passed the error object.

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'Component',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'inhabitants',
          query: {}
        }
      }
    },
    onError (err) {
      // an error occured!
      console.log(err)
    }
  }
  ```

## Mixin Properties

Using the `pg` mixin exposes `vm.pg` with the following properties.

### pg.items

- **Type:** `Array<GenericModel>`

- **Provided if:** `query !== undefined && accept !== 'single'`

- **Details:**

  An array of [GenericModels](./#genericmodel) created from the API response.

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'Component',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'inhabitants',
          query: {}
        }
      }
    },
    computed: {
      inhabitants () {
        return this.pg.items
      }
    }
  }
  ```

### pg.item

- **Type:** `GenericModel`

- **Provided if:** `query !== undefined && accept === 'single'`

- **Details:**

  A [GenericModel](./#genericmodel) created from the API response.

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'Component',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'inhabitants',
          query: {
            'name.eq': 'Tion Medon'
          }
        }
      }
    },
    computed: {
      tion () {
        return this.pg.item
      }
    }
  }
  ```

### pg.newItem

- **Type:** `GenericModel`

- **Provided if:** `newTemplate`

- **Details:**

  A [GenericModel](./#genericmodel) created from the `newTemplate` option.

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'Component',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'inhabitants',
          newTemplate: {
            name: 'New Inhabitant',
            age: 150
          }
        }
      }
    },
    methods: {
      async post () {
        await this.pg.newItem.post()
      }
    }
  }
  ```

### pg.range

- **Type:** `Object`

- **Provided if:** API response sets `Content-Range` header

- **Properties:**
  - `{number} first` first retrieved item

  - `{number} last` last retrieved item

  - `{number} totalCount` total number of retrieved items, undefined if `count !== 'exact'`

- **Details:**

  An object describing the result of server-side pagination.

- **Example:**

    ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'Component',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'inhabitants',
          query: {
            'age.gt': 150
          },
          offset: 5,
          limit: 10,
          count: 'exact'
        }
      }
    },
    computed: {
      firstItem () {
        // first retrieved item
        return this.pg.range.first
      },
      lastItem () {
        // last retrieved item
        return  this.pg.range.last
      },
      totalCount () {
        // total number of retrieved items, undefined if option count !== 'exact'
        return this.pg.range.totalCount
      }
    }
  }
  ```

## Mixin Methods

### pg.get()

- **Type:** `ObservableFunction`

- **Provided if:** `query !== undefined`

- **Details:**

  An [ObservableFunction](./#observablefunction) for re-sending the get request.

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'Component',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'inhabitants',
          query: {}
        }
      }
    },
    methods: {
      refresh () {
        this.pg.get()
        if (this.pg.get.isPending) {
          console.log('Get still pending...')
        } else {
          console.log('Fetched inhabitants: ', this.pg.items)
        }
      }
    }
  }
  ```

## Instance Methods

The instance method `vm.$postgrest` is available on your Vue Instance after installing the plugin.

### $postgrest

- **Type:** `Route`

- **Arguments:**
  
  - `{string} apiRoot`

  - `{string} token`

- **Returns:** `Schema`

- **Throws:** `SchemaNotFoundError`

- **Usage:**

  Used to create a new schema for the specified baseUri with the specified default auth token. If `apiRoot` is undefined, the apiRoot of the existing Schema is used.

### $postgrest[route]

- **Type:** `Route`

- **Throws:** `AuthError | FetchError`

- **Usage:**

  After the schema is [ready](./#postgrest-ready), all available routes are exposed on the $postgrest instance.
  The exposed `Route` accepts the following arguments:
    
    - `{string} method` one of `'OPTIONS'`, `'GET'`, `'HEAD'`, `'POST'`, `'PATCH'`, `'PUT'` or `'DELETE'`
    
    - `{object} query` see [Query](/query)

    - `{object} options` additional options, see below

    - `{object} body` payload for post/patch/put requests

  Available options are:

    - `{string} accept` `Accept` header to set or one of the options 'single', 'binary' or 'text', which set the header automatically. Default header is 'application/json'.

    - `{number} limit` Limit the response to no. of items by setting the `Range` and `Range-Unit` headers

    - `{number} offset` Offset the response by no. of items by setting the `Range` and `Range-Unit` headers

    - `{string} return` Set `return=[value]` part of `Prefer` header

    - `{string} params` Set `params=[value]` part of `Prefer` header

    - `{string} count` Set `count=[value]` part of `Prefer` header

    - `{string} resolution` Set `resolution=[value]` part of `Prefer` header

    - `{object} headers` Overwrite headers. Keys are header field names, values are strings.

  The `Route` instance provides convencience methods for calling the following HTTP requests directly, omit the `method` argument in this case:

    - `$postgrest.route.options([query, options])`

    - `$postgrest[route].get([query, options])`

    - `$postgrest[route].head([query, options])`

    - `$postgrest[route].post([query, options, body])`

    - `$postgrest[route].patch([query, options, body])`

    - `$postgrest[route].put([query, options, body])`

    - `$postgrest[route].delete([query, options])`

- **Example:**

  ``` js
  export default {
    name: 'Galaxy',
    data () {
      return {
        planets: undefined,
        cities: undefined
      }
    }
    async mounted: {
      // wait for the schema to be ready
      await this.$postgrest.$ready
      const planetsResp = await this.$postgrest.planets('GET')
      const citiesResp = await this.$postgrest.cities.get()
      this.planets = await planetsResp.json()
      this.cities = await citiesResp.json()
    }
  }
  ```

### $postgrest.$ready

- **Type:** `Promise`

- **Throws:** `SchemaNotFoundError`

- **Usage:**

  The promise resolves, when the schema was successfully loaded and rejects if no valid schema was found.

  ::: tip
  This can also be called on a [route](./#postgrest-route) or a [rpc](./#postgrest-rpc).
  :::

- **Example:**

  ``` js
  export default {
    name: 'Component',
    async mounted: {
      // wait for the schema to be ready
      try {
        await this.$postgrest.$ready 
      } catch (e) {
        console.log('Could not connect to API...')
      }
    }
  }
  ```

### $postgrest.$route(route)

- **Type:** `Function`

- **Arguments:**
  
  - `{string} route`

- **Returns:** `Route`

- **Usage:**

  Use this function, if you have to access a route, before the schema is ready and the routes have been exposed on the $postgrest instance. Returns a `Route` for the specified route.

- **Example:**

  ``` js
  export default {
    name: 'Cities',
    methods: {
      async getCities () {
        return this.$postgrest.$route('cities').get()
      },
      async addCity () {
        await this.$postgrest.$route('cities').post({}, {}, { name: 'Galactic City' })
      }
    }
  }
  ```

  - **See also:** [$postgrest[route]](./#postgrest-route)

### $postgrest.rpc[function-name]

- **Type:** `RPC`

- **Usage:**

  After the schema is [ready](./#postgrest-ready), all available stored procedures are exposed on $postgrest.rpc[function-name] and can be called like this: `$postgrest.rpc[function-name]([params, options])`.

  The `params` object contains parameters that are passed to the stored procedure.
  
  Available `options` are:

  - `{boolean} get` set request method to 'GET' if true, otherwise 'POST'

  - `{string} accept` `Accept` header to set or one of the options 'single', 'binary' or 'text', which set the header automatically. Default header is 'application/json'.

  - `{object} headers` Properties of this object overwrite the specified header fields of the request.

- **Example:**

  ``` js
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
  ```

### $postgrest.rpc(function-name[, params, options])

- **Type:** `Function`

- **Throws:** `AuthError | FetchError`

- **Arguments:**
  
  - `{string} function-name`

  - `{object} params`

  - `{object} options`

- **Returns:** API response

- **Usage:**

  Calls a stored procedure on the API. `function-name` specifies the stored procedure to call. For `params` and `options` see [$postgrest.rpc](./#postgrest-rpc)

- **Example:**

  ``` js
  export default {
    name: 'Component',
    methods: {
      async destroyAllPlanets () {
        await this.$postgrest.rpc('destroyplanets', { countdown: false }, { 
          accept: 'text',
          headers: { 'Warning': 'Will cause problems!' }
        })
      }
    }
  }
  ```

## Component Props

The `<postgrest>` component accepts all [mixin options](./#mixin-options) as props, see above for details.

- **Example**:

``` html
<template>
  <postgrest
    route="planets"
    :query="{}"
    accept="single"
    limit="10">
</template>
```

## Component Slot-scope

The `<postgrest>` component provides all [mixin properties](./#mixin-properties) as default slot scope, see above for details.

- **Example**:
  
  ``` html
  <template>
    <postgrest
      route="planets"
      :query="{}">
      <template v-slot:default={ items: planets, get }>
        <loading v-if="get.isPending"/>
        <ul v-else>
          <li v-for="planet in planets" :key="planet.id">
            {{ planet.name }}
          </li>
        </ul>
      </template>
  </template>
  ```

## Component Events

### error

- **Type:** `Event`

- **Payload:** `AuthError | FetchError`

- **Usage:**

  This event is emitted when an AuthError or FetchError occurs. 

- **Example:**
  
    ``` vue
    <template>
      <postgrest
        route="planets"
        :query="{}"
        @error="handleError">
        <template v-slot:default={ planets: items, get }>
          <loading v-if="get.isPending"/>
          <ul v-else>
            <li v-for="planet in planets" :key="planet.id">
              {{ planet.name }}
            </li>
          </ul>
        </template>
    </template>

    <script>
    import { AuthError } from 'vue-postgrest'

    export default {
      name: 'PlanetsList',
      methods: {
        handleError (e) {
          if (e instanceof AuthError) {
            console.log('Something wrong with the token!')
          } else {
            throw e
          }
        }
      }
    }
    </script>
    ```

## GenericModel

The data of a GenericModel is available directly on the instance in addition to the following methods and getters:

### $get([options])

- **Type:** `ObservableFunction`

- **Arguments:**

  - `{object} options`

- **Returns:** Response from the API

- **Throws:** `AuthError | FetchError | PrimaryKeyError`

- **Details:**

  An [ObservableFunction](./#observablefunction) for a get request. Available `options` are:

    - `{boolean} keepChanges` If true, local changes to the item are protected from being overwritten by fetched data and only unchanged fields are updated.

    - All Options described in [postgrest route](./#postgrest-route) are available here as well. **Note:** The `accept` option is not valid here - the `Accept` header will always be set to `'single'` if not overwritten via the `headers` object.

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'UserProfile',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'users',
          query: {
            'id.eq': this.$store.getters.userId
          },
          accept: 'single'
        }
      }
    },
    methods: {
      updateUser () {
        this.pg.item.$get()
      }
    }
  }
  ```

### $post([options])

- **Type:** `ObservableFunction`

- **Arguments:**

  - `{object} options`

- **Returns:** Response from the API

- **Throws:** `AuthError | FetchError`

- **Details:**

  An [ObservableFunction](./#observablefunction) for a post request. Available `options` are:

    - `{array<string>} columns` Sets `columns` parameter on request to improve performance on updates/inserts

    - `{string} return` Add `return=[value]` header to request. Possible values are `'representation'` (default) and `'minimal'`.

    - All Options described in [postgrest route](./#postgrest-route) are available here as well. **Note:** The `accept` option is not valid here - the `Accept` header will always be set to `'single'` if not overwritten via the `headers` object.

  If option `return` is set to `'representation'`, which is the default value, the item is updated with the response from the server.
  
  If option `return` is set to `'minimal'` and the `Location` header is set, the location header is returned as an object.

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'HeroesList',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'heroes',
          newTemplate: {
            name: 'Yoda',
            age: '999999999'
          }
        }
      }
    },
    methods: {
      addHero () {
        this.pg.newItem.$post()
      }
    }
  }
  ```

### $put([options])

- **Type:** `ObservableFunction`

- **Arguments:**

  - `{object} options`

- **Returns:** Response from the API

- **Throws:** `AuthError | FetchError | PrimaryKeyError`

- **Details:**

  An [ObservableFunction](./#observablefunction) for a put request. Available `options` are:

    - `{array<string>} columns` Sets `columns` parameter on request to improve performance on updates/inserts

    - `{string} return` Add `return=[value]` header to request. Possible values are `'representation'` (default) and `'minimal'`.

    - All Options described in [postgrest route](./#postgrest-route) are available here as well. **Note:** The `accept` option is not valid here - the `Accept` header will always be set to `'single'` if not overwritten via the `headers` object.

  If option `return` is set to `'representation'`, which is the default value, the item is updated with the response from the server.
  
  If option `return` is set to `'minimal'` and the `Location` header is set, the location header is returned as an object.

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'HeroesList',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'heroes',
          newTemplate: {
            name: 'Yoda',
            age: '999999999'
          }
        }
      }
    },
    methods: {
      upsertHero () {
        this.pg.newItem.$put()
      }
    }
  }
  ```

### $patch([data, options])

- **Type:** `ObservableFunction`

- **Arguments:**

  - `{object} data`

  - `{object} options`

- **Returns:** Response from the API

- **Throws:** `AuthError | FetchError | PrimaryKeyError`

- **Details:**

  An [ObservableFunction](./#observablefunction) for a patch request. The patch function also accepts an object as first argument with fields that should be patched, properties declared in this object take precedence over fields changed on the item directly. Available `options` are:

    - `{array<string>} columns` Sets `columns` parameter on request to improve performance on updates/inserts

    - `{string} return` Add `return=[value]` header to request. Possible values are `'representation'` (default) and `'minimal'`.

    - All Options described in [postgrest route](./#postgrest-route) are available here as well. **Note:** The `accept` option is not valid here - the `Accept` header will always be set to `'single'` if not overwritten via the `headers` object.

  If option `return` is set to `'representation'`, which is the default value, the item is updated with the response from the server.

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'HeroProfile',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'heroes',
          query: {
            'name.eq': 'Yoda'
          },
          accept: 'single'
        }
      }
    },
    methods: {
      updateHeroAge (age) {
        this.pg.item.age = age
        this.pg.item.$patch({ name: 'Younger Yoda '})
        // sends a patch request with the data: { age: age, name: 'Younger Yoda' }
      }
    }
  }
  ```

### $delete([options])

- **Type:** `ObservableFunction`

- **Arguments:**

  - `{object} options`

- **Returns:** Response from the API

- **Throws:** `AuthError | FetchError | PrimaryKeyError`

- **Details:**

  An [ObservableFunction](./#observablefunction) for a delete request. Available `options` are:

    - `{string} return` Add `return=[value]` header to request. Possible values are `'representation'` and `'minimal'`.

    - All Options described in [postgrest route](./#postgrest-route) are available here as well. **Note:** The `accept` option is not valid here - the `Accept` header will always be set to `'single'` if not overwritten via the `headers` object.

  If option `return` is set to `'representation'`, the item is updated with the response from the server.

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'HeroProfile',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'heroes',
          query: {
            'name.eq': 'Yoda'
          },
          accept: 'single'
        }
      }
    },
    methods: {
      deleteYoda (age) {
        // oh, no!
        this.pg.item.$delete()
      }
    }
  }
  ```

### $isDirty

- **Type:** `Boolean`

- **Details:**

  Indicating whether the item data has changed from its inital state.

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'HeroProfile',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'heroes',
          query: {
            'name.eq': 'Yoda'
          },
          accept: 'single'
        }
      }
    },
    methods: {
      updateHero () {
        if (this.pg.item.$isDirty) {
          this.pg.item.$patch()
        }
      }
    }
  }
  ```

### $reset()

- **Type:** `Function`

- **Details:**

  Reset the item data to it's initial state.

- **Example:**

  ``` js
  import { pg } from 'vue-postgrest'

  export default {
    name: 'HeroProfile',
    mixins: [pg],
    data () {
      return {
        pgConfig: {
          route: 'heroes',
          query: {
            'name.eq': 'Yoda'
          },
          accept: 'single'
        }
      }
    },
    methods: {
      changeAge (age) {
        this.item.age = age
      },
      resetHero () {
        this.item.$reset()
      }
    }
  }
  ```

## ObservableFunction

An ObservableFunction has the following Vue-reactive properties indicating it's current status.

### clear([error|index, ...])

- **Type:** `Function`

- **Arguments:**

  - any number of type `Error` or `Number`

- **Returns:** Nothing

- **Details:**

  Removes errors from the `.errors` property. `clear(error, ...)` removes specific errors by reference. `clear(index, ...)` removes specific errors by index. `clear()` removes all errors.

  ``` javascript
  try {
    this.pg.item.$delete()
  } catch (e) {
    if (e instanceof AuthError) {
      this.handleAuthError()
      this.pg.item.$delete.clear(e)
    } else {
      // error e.g. rendered in template
    }
  }
  ```

### errors

- **Type:** `Array<Error>`

- **Details:**

  An Array of Errors that are associated with this Function. This is cleared automatically upon the next successful request or manually with `ObservableFunction.clear()`.

### hasError

- **Type:** `Boolean`

- **Details:**

  Indicating whether there were errors during the request. This is cleared automatically upon the next successful request or manually with `ObservableFunction.clear()`.

### isPending

- **Type:** `Boolean`

- **Details:**

  Indicating whether there are pending calls for this Function.

### nPending

- **Type:** `Number`

- **Details:**

  The number of currently pending calls for this Function.

### pending

- **Type:** `Array<AbortController>`

- **Details:**

  This array holds an `AbortController` instance for every function call that is currently pending. Those are passed to the underlying `fetch()` call for requests and can be used to cancel the request. See [AbortController (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) for details.
