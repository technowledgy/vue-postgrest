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
    <template v-slot:default="{ get, items, totalCount, newItem }">
    </template>
</postgrest>
```

### In depth

Available component props are:

|Prop   |Required|Default  |Type  |Description                        |
|-------|--------|---------|------|-----------------------------------|
|route  |yes     |-        |String|The table/view that is queried     |
|query  |no      |undefined|Object|The postgrest query                |
|single |no      |false    |Bool  |Request a single entity            |
|create |no      |undefined|Object|Template for a entity to be created|

The api-response and following methods are available via slot-props:

|Slot-prop            |Type    |Provided if     |Description                            |
|---------------------|--------|----------------|---------------------------------------|
|items                |Array   |query && !single|An array of existing data entities     |
|item                 |Object  |query && single |A single existing data entity          |
|newItem              |Object  |create          |The data entity to create              |
|get                  |Function|query           |Utility function for get requests      |
|pagination           |Object  |query && !single|Information on server-side pagination of results|
|pagination.totalCount|Number  |query && !single|Total count of entities in DB|
|pagination.from      |Number  |query && !single|First retrieved entity|
|pagination.to        |Number  |query && !single|Last retrieved entity|