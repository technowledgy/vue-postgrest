# vue-postgrest
Vue.js Component providing PostgREST integration

## Installation

### With module loader

`npm install vue-postgrest`

or

`yarn add vue-postgrest`

in main.js:
```
import VuePostgrest from 'vue-postgrest'

Vue.use(VuePostgrest, pluginOptions)
```

available pluginOptions are:

|option |default |type  |description |
|-------|--------|------|------------|
|apiRoot|''      |String|api base URI|

### With script tag
Include `<script src="https://unpkg.com/vue-postgrest"></script>`

## Usage
Component "postgrest" is registered globally on your Vue instance.

### Quick example
```
<postgrest
    api-root="api/"
    route="users"
    :query="{}"
    :create="{}">
      <template v-slot:default="{ get, items, range, newItem }">
      </template>
</postgrest>
```

#### Component props
|Prop      |Required|Default  |Type  |Description                        |
|----------|--------|---------|------|-----------------------------------|
|route     |yes     |-        |String|The table/view that is queried     |
|query     |no      |undefined|Object|The postgrest query                |
|single    |no      |false    |Bool  |Request a single entity            |
|create    |no      |undefined|Object|Template for a entity to be created|
|limit     |no      |-        |Number|Limit the count of response entities|
|offset    |no      |-        |Number|Offset the response entities|
|exactCount|no      |false    |Bool  |Request the total amount of entities in DB (disabled by default due to performance considerations)|

#### Slot-scope
The api-response and following methods are available via slot-props:

|Slot-prop            |Type/Model    |Provided if                     |Description                            |
|---------------------|--------------|--------------------------------|---------------------------------------|
|items                |[Entity]      |query && !single                |An array of existing data entities     |
|item                 |Entity        |query && single                 |A single existing data entity          |
|newItem              |Entity        |create                          |The data entity to create              |
|get                  |Utility       |query                           |Utility for get requests      |
|range                |Range         |API returns Content-Range header|Information on server-side pagination of results|

#### Models
##### Utility
|Property             |Type          |Description             |
|---------------------|--------------|------------------------|
|call                 |Function      |Call the utility function|
|isPending            |Bool          |Request is pending      |
|hasError             |Bool          |Request failed with error      |

##### Range
|Property       |Type          |Description             |
|---------------|--------------|------------------------|
|totalCount     |Number        |Total count of entities in DB (undefined if exactCount is false)|
|first          |Number        |First retrieved entity|
|last           |Number        |Last retrieved entity|

##### Entity

|Property             |Type          |Description             |
|---------------------|--------------|------------------------|
|data                 |Object        |The entity's data object|
|post                 |Utility       |Send a post request with the entity's data|
|patch                |Utility       |Send a patch request with the entity's data|
|delete               |Utility       |Send request to delete the entity|
|reset                |Function      |Reset the entity's data object to initial state|

### Querys

The query prop accepts an object with keys of column conditions and values of query string parameters.

#### Examples

To get all users with age greater than 21 and active true:

```
<postgrest
    route="users"
    :query="{ age: 'gt.21', active: 'is.true'}">
</postgrest>
```

For available conditions see [the Postgrest docs](https://postgrest.org/en/v4.1/api.html#horizontal-filtering-rows).

