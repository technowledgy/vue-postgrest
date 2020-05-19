# Query

The `Query` class converts an input object into a postgREST query string.

## [Horizontal Filtering (Rows)](http://postgrest.org/en/v7.0.0/api.html#horizontal-filtering-rows)

### Column Conditions

``` js
const query = {
  'age.lt': 13
}
```

### Logical Conjoinig

``` js
const query = {
  'age.lt': 13,
  'student.is': true
}
```

``` js
const query = {
  'grade.gte': 90,
  'age.not.eq': 14
}
```

### Logical Disjoining

``` js
const query = {
  or: {
    'grade.gte': 90,
    'student.is': true,
    or: {
      'age.gte': 14,
      'age.is': null
    }
  }
}
```

// TODO: full text search?

## [Vertical Filtering (Columns)](http://postgrest.org/en/v7.0.0/api.html#vertical-filtering-columns)

### Selecting

``` js
const query = {
  select: ['first_name', 'age']
}
````

### Renaming Columns

``` js
const query = {
  select: ['firstName:first_name', 'age']
}
```

### Casting Columns

``` js
const query = {
  select: ['full_name', 'salary::text']
}
```

### JSON Columns

``` js
const query = {
  select: ['id', 'json_data->>blood_type', 'json_data->phones']
}
```

``` js
const query = {
  select: ['id', 'json_data->>blood_type', 'json_data->phones'],
  'json_data->>blood_type.eq': 'A-',
  'json_data->age.gte': 20
}
```