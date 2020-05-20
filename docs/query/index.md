# Query

The `Query` class converts an input object into a PostgREST query string.

By default, all values are converted to their appropriate representation for PostgREST query strings.

## Values & Operators

### Undefined

Undefined values are excluded from the query string.

``` js
const query = {
    'age.lt': 13,
    'grade.gte': undefined
  }
}
```

### Arrays

Arrays are parsed depending on the used operator.

``` js
const query = {
    'id.in': [1, 2, 3]
  }
}
```

``` js
const query = {
    'tags.cs': ['example', 'new']
  }
}
```

### Range Objects

``` js
const query = {
    'range.sl': { lower: 1, upper: 10}
  }
}
```

``` js
const query = {
    'range.sl': { lower: 1, includeLower: false, upper: 10, includeUpper: true }
  }
}
```

## [Horizontal Filtering (Rows)](http://postgrest.org/en/v7.0.0/api.html#horizontal-filtering-rows)

### Column Conditions

``` js
const query = {
  'age.lt': 13
}
```

### Logical Conjoining

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

### Full-Text Search

``` js
const query = {
  'my_tsv.fts(french)': 'amusant'
}
```

## [Vertical Filtering (Columns)](http://postgrest.org/en/v7.0.0/api.html#vertical-filtering-columns)

### Selecting

``` js
const query = {
  select: '*'
}
````

``` js
const query = {
  select: 'first_name,age'
}
````

``` js
const query = {
  select: ['first_name', 'age']
}
````

``` js
const query = {
  select: {
    first_name: true,
    // NOTE: falsy values are ignored!
    age: 0
  }
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
  select: {
    id: true,
    json_data: {
      blood_type: true,
      phones: true
    }
  }
}
```

``` js
const query = {
  select: {
    id: true,
    json_data: {
      phones: [
        {
          number: true
        }
      ]
    }
  }
}
```

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

## Ordering

``` js
const query = {
  order: 'age.desc,height.asc'
}
```


``` js
const query = {
  order: ['age.desc', 'height.asc']
}
```

``` js
const query = {
  order: [
    ['age', 'desc'],
    ['height', 'asc']
  ]
}
```


``` js
const query = {
  order: {
    age: 'desc',
    height: 'asc.nullslast'
  }
}
```

``` js
const query = {
  order: {
    age: true
  }
}
```

## Limits and Pagination

``` js
const query = {
  limit: 1,
  offset: 10
}
```

## Resource Embedding

**Simple**

``` js
const query = {
  select: {
    title: true,
    directors: {
      select: {
        id: true,
        last_name: true
      }
    }
  }
}
```

**Aliases**

``` js
const query = {
  select: {
    title: true,
    'director:directors': {
      select: {
        id: true,
        last_name: true
      }
    }
  }
}
```

**Full Example**

``` js
const query = {
  select: {
    '*': true,
    actors: {
      select: '*',
      order: ['last_name', 'first_name'],
      'character.in': ['Chico', 'Harpo', 'Groucho'],
      limit: 10,
      offset: 2
    },
    '91_comps:competitions': {
      select: 'name',
      'year.eq': 1991
    },
    'central_addresses!billing_address': {
      select: '*'
    }
  }
}
```

## Insertions / Updates

### Columns

``` js
const query = {
  columns: 'source,publication_date,figure'
}
```

``` js
const query = {
  columns: ['source', 'publication_date', 'figure']
}
```

### On Conflict

``` js
const query = {
  on_conflict: 'source'
}
```

``` js
const query = {
  on_conflict: ['source', 'publication_date', 'figure']
}
```