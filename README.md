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
|accept    |no      |'multiple'|String|Accept header to set or one of the options 'single', 'multiple' or 'binary', which set the correct headers automatically|
|create    |no      |undefined|Object|Template for a entity to be created|
|limit     |no      |-        |Number|Limit the count of response entities|
|offset    |no      |-        |Number|Offset the response entities|
|count     |no      |undefined    |String|If set to "single", we request the total amount of entities in DB (disabled by default due to performance considerations)|
|token     |no      |undefined|String|JWT token that is sent as authentication bearer with DB requests.|

#### Slot-scope
The api-response and following methods are available via slot-props:

|Slot-prop            |Type/Model    |Provided if                     |Description                            |
|---------------------|--------------|--------------------------------|---------------------------------------|
|items                |[Entity]      |query && !single                |An array of existing data entities     |
|item                 |Entity        |query && single                 |A single existing data entity          |
|newItem              |Entity        |create                          |The data entity to create              |
|resetNewItem         |Function      |create                          |Reset newItem to provided create template.|
|get                  |Utility       |query                           |Utility for get requests      |
|range                |Range         |API returns Content-Range header|Information on server-side pagination of results|
|rpc                  |Function      |                                |Call a stored procedure.|

#### Events

|Event                |Description             |
|---------------------|------------------------|
|get-error            |fires on error from get-requests|
|token-error          |fires on token errors from requests|

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
|isDirty              |Bool          |Indicates wether data differs from initial state|

Note: "patch" and "delete" methods are only provided, if the schema provides primary keys for the entity.

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

### Patching

You can edit the data fields of an entity directly:

```
item.data.name = 'John Doe'
```

Calling the entities' patch function, sends the corresponding patch request. The patch function also accepts an object as first argument with fields that should be patched, properties declared in this object take precedence over fields changed on the data object directly.

E.g.

```
item.data.name = 'John Doe'
item.data.age = 70
item.patch.call({
  name: 'Jane Doe',
  newField: true
})
```

sends a patch request with the following data:

```
{
  name: 'Jane Doe',
  age: 70,
  newField: true
}
```

#### Nested fields

The data argument to patch () is not merged deep. So, when passing a object with nested fields, the whole nested field will be replaced by the value in the argument object, even if only a sub-field was changed.

Subfields of nested fields on the data object can't be set directly - the nodes of a subfield expose a .set() method for this purpose.

E.g.

```
item.data = {
  nestedField: {
    key1: 'val1',
    key2: 'val2'
  }
}

item.data.nestedField.set('key1', 'newValue')

item.patch.call()
```

sends a patch request with the following data:

```
{
  nestedField: {
    key1: 'newValue',
    key2: 'val2'
  }
}
```
#### Patch options

The (optional) second argument to the patch function is a object with the following options:

|Property             |Type     |Default  |Description    |
|---------------------|---------|---------|---------------|
|columns              |Array    |keys of patch object     |Sets columns param on request to improve performance of updates/inserts, set manually for partial patches|
|return               |String   |undefined|Add return=[value] header to request. Possible values are 'representation' and 'minimal'. Defaults to 'representation' when sync option is True|
|headers              |Object   |undefined|Properties of this object overwrite the specified header fields of the request. Keys are header field names, values are strings.|

The (optional) third argument to the patch function is a Bool, if set to true it requests the server to return the patched entity and update the local state accordingly.

### Posting

```
<postgrest
  route="users"
  :query="{}"
  :create="{
    name: 'Johne Doe',
    age: 50
  }">
</postgrest>
```

When passing a template object to "create" prop, slot scope provides "newItem", on which you can call the post function. To change entity data afterwards you have to alter entity data as shown above - the create prop is not reactive.

Example:

```
newItem.data.name = 'Jane Doe'
newItem.post.call()
```

All entities provide the post function, so it would be equally possible to alter a entity you requested from the serve, change its data and post it as a new item.

#### Post options

The (optional) first argument to the post function is a object with the following options:

|Property             |Type     |Default  |Description    |
|---------------------|---------|---------|---------------|
|columns              |Array    |keys of patch object     |Sets columns param on request to improve performance of updates/inserts, set manually for partial patches|
|return               |String   |undefined|Add return=[value] header to request. Possible values are 'representation' and 'minimal'. Defaults to 'representation' when sync option is True|
|headers              |Object   |undefined|Properties of this object overwrite the specified header fields of the request. Keys are header field names, values are strings.|

The (optional) second argument to the post function is a Bool, if set to true it requests the server to return the posted entity and update the local state accordingly.

### Deleting

```
item.delete.call()
```

#### Delete options

The (optional) first argument to the delete function is a object with the following options:

|Property             |Type     |Default  |Description    |
|---------------------|---------|---------|---------------|
|return               |String   |undefined|Add return=[value] header to request. Possible values are 'representation' and 'minimal'.|
|headers              |Object   |undefined|Properties of this object overwrite the specified header fields of the request. Keys are header field names, values are strings.|

### RPC (function-name, options)

The rpc function accepts the following arguments:

|Argument             |Type          |Default |Description             |
|---------------------|--------------|--------|----------------|
|function-name        |String        |        |The name of the stored procedure to call|
|options              |Object        |{}      |Options (see below)|

Options: 

|Property             |Type          |Default |Description             |
|---------------------|--------------|--------|-------------------------|
|method               |String        |'POST'  |The method with which to request the stored procedure. Postgrest accepts 'POST' and 'GET'|
|params                 |Object        |{}      |The stored procedure arguments|
|accept               |BString       |'multiple'   |Accept header to set or one of the options 'single', 'multiple' or 'binary', which set the correct headers automatically|