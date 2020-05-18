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

Instances of AuthError are thrown when authentication fails.

### SchemaNotFoundError

Instances of SchemaNotFoundError are thrown, when there is no valid postgrest schema at the base URI.

### FetchError

Instances of FetchError are thrown on generic errors from Fetch that don't trigger the throw of more specific errors.

### PrimaryKeyError

Instances of PrimaryKeyError are thrown, when no primary keys are found for the specified `route`.

## Plugin Options

Global options can be set when initializing Vue-Postgrest with `Vue.use`.

### apiRoot

- **Type:** `String`

- **Default:** `''`

- **Details:**

  The URI used as the base for all requests to the API by the mixin, global and local components, as well as the global vue-postgrest instance. This should be the URI to your postgREST installation.

  ::: tip
  <!-- TODO: add proper links to anchors here with markdown.slugify config or by splitting into seperate files -->
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

<!-- TODO: is this correct or should we say: set in data or computed? -->
Mixin options are set in the component using the `pg` mixin by setting the `pgConfig` object on the component instance.

### apiRoot

- **Type:** `String`

- **Default:** Global [plugin option](./#plugin-options)

- **Details:**

  The URI used as the base for all requests to the API by the mixin, global and local components, as well as the global vue-postgrest instance. This should be the URI to your postgREST installation.

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

  The query sent to the API is constructed from this option. See the [Query API](/query) for more details.

  ::: warning
  If this option is undefined, the instance will not provide methods and items related to get/patch/delete requests. Set query to `{}`
  if you want to make requests without parameters.
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

  Accept header to set or one of the options 'single', 'binary' or 'text', which set the correct headers automatically. Default header is set to 'application/json'.

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

  Limits the count of response items.

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

  Offset the response items, useful e.g. for pagination.

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

  If set to `'exact'`, we request the total amount of items in the database that fit the filter query (disabled by default due to performance considerations).

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

- **Details:**

  Called when an error occurs. The Hook gets passed the error object.

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

### pg.get

- **Type:** `ObservableFunction`

- **Provided if:** `query !== undefined`

- **Details:**

  An [ObservableFunction](./#observablefunction) for the get request.

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
    updated () {
      if (this.pg.get.isPending) {
        console.log('Get still pending...')
      } else {
        console.log('Fetched inhabitants: ', this.pg.items)
      }
    }
  }
  ```

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

### pg.$ready

### pg.$route

### pg.rpc

### pg.$get

## Instance Methods

### $postgrest.$ready

### $postgrest.$route

### $postgrest.rpc

## Component Props

The postgrest component accepts all [mixin options](./#mixin-options) as props, see above for details.

## Component Slot-scope

## Component Events

## GenericModel

## ObservableFunction