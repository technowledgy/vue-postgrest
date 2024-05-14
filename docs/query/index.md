# Query

The `Query` class converts an input object into a PostgREST query string.

By default, all values are converted to their appropriate representation for PostgREST query strings.

## Values & Operators

### Undefined

Undefined values are excluded from the query string.

<Query>

``` js
const query = {
  'age.lt': 13,
  'grade.gte': undefined
}
```

</Query>

### Arrays

Arrays are parsed depending on the used operator.

<Query>

``` js
const query = {
  'id.in': [1, 2, 3]
}
```

</Query>

<Query>

``` js
const query = {
  'tags.cs': ['example', 'new']
}
```

</Query>

### Range Objects

<Query>

``` js
const query = {
  'range.sl': { lower: 1, upper: 10 }
}
```

</Query>

<Query>

``` js
const query = {
  'range.sl': { lower: 1, includeLower: false, upper: 10, includeUpper: true }
}
```

</Query>

## Horizontal Filtering (Rows) <PostgrestDocs href="https://postgrest.org/en/latest/api.html#horizontal-filtering-rows"/>

### Column Conditions

<Query>

``` js
const query = {
  'age.lt': 13
}
```

</Query>

### Logical Conjoining (AND)

<Query>

``` js
const query = {
  'age.lt': 13,
  'student.is': true
}
```

</Query>

<Query>

``` js
const query = {
  'grade.gte': 90,
  'age.not.eq': 14
}
```

</Query>

### Logical Disjoining (OR)

<Query>

``` js
const query = {
  or: {
    'grade.gte': 20,
    'age.lte': 30,
  }
}
```

</Query>

For setting two conditions on the same column, use aliases - these are stripped before creating the query string.

<Query>

``` js
const query = {
  or: {
    '0:grade.eq': 20,
    '1:grade.eq': 50,
  }
}
```

</Query>

Negated logical operators and nesting:

<Query>

``` js
const query = {
  and: {
    'grade.gte': 90,
    'student.is': true,
    'not.or': {
      'age.eq': 14,
      'age.not.is': null
    }
  }
}
```

</Query>

### Full-Text Search

<Query>

``` js
const query = {
  'my_tsv.fts(french)': 'amusant'
}
```

</Query>

## Vertical Filtering (Columns) <PostgrestDocs href="https://postgrest.org/en/latest/api.html#vertical-filtering-columns"/>

### Selecting

<Query>

``` js
const query = {
  select: '*'
}
```

</Query>

<Query>

``` js
const query = {
  select: 'first_name,age'
}
```

</Query>

<Query>

``` js
const query = {
  select: ['first_name', 'age']
}
```

</Query>

<Query>

``` js
const query = {
  select: {
    'first_name': true,
    // NOTE: falsy values are ignored!
    age: 0
  }
}
```

</Query>

### Renaming Columns

<Query>

``` js
const query = {
  select: ['firstName:first_name', 'age']
}
```

</Query>

<Query>

``` js
const query = {
  select: {
    'firstName:first_name': true
  }
}
```

</Query>

### Casting Columns

<Query>

``` js
const query = {
  select: ['full_name', 'salary::text']
}
```

</Query>

<Query>

``` js
const query = {
  select: {
    'full_name': true,
    salary: 'text'
  }
}
```

</Query>

<Query>

``` js
const query = {
  select: {
    'full_name': true,
    salary: {
      '::': 'text'
    }
  }
}
```

</Query>

### JSON Columns

<Query>

``` js
const query = {
  select: ['id', 'json_data->>blood_type', 'json_data->phones']
}
```

</Query>

::: tip
If a field of the `select` object has a `select` key itself, it is handled as an embed, otherwise as a JSON field.
:::

<Query>

``` js
const query = {
  select: {
    id: true,
    json_data: {
      blood_type: true,
      phones: true
    }
  },
  // Nested filter on JSON column
  json_data: {
    'age.gt': 20
  }
}
```

</Query>

<Query>

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

</Query>

If a JSON column is aliased or cast in object syntax, the json_data field is added to the query string. E.g.:

<Query>

``` js
const query = {
  select: {
    id: true,
    'jd:json_data': {
      blood_type: true,
      phones: true
    }
  }
}
```

</Query>

<Query>

``` js
const query = {
  select: {
    id: true,
    json_data: {
      '::': 'json',
      blood_type: true,
      phones: true
    }
  }
}
```

</Query>

## Ordering <PostgrestDocs href="https://postgrest.org/en/latest/api.html#ordering"/>

<Query>

``` js
const query = {
  order: 'age.desc,height.asc'
}
```

</Query>

<Query>

``` js
const query = {
  order: ['age.desc', 'height.asc']
}
```

</Query>

<Query>

``` js
const query = {
  order: [
    ['age', 'desc'],
    ['height', 'asc']
  ]
}
```

</Query>

<Query>

``` js
const query = {
  order: {
    age: 'desc',
    height: 'asc.nullslast'
  }
}
```

</Query>

<Query>

``` js
const query = {
  order: {
    age: true
  }
}
```

</Query>

## Limits and Pagination <PostgrestDocs href="https://postgrest.org/en/latest/api.html#limits-and-pagination"/>

<Query>

``` js
const query = {
  limit: 1,
  offset: 10
}
```

</Query>

## Resource Embedding <PostgrestDocs href="https://postgrest.org/en/latest/api.html#resource-embedding"/>

::: tip
If a field of the `select` object has a `select` key itself, it is handled as an embed, otherwise as a JSON field.
:::

**Simple**

<Query>

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

</Query>

**Aliases**

<Query>

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

</Query>

**Full Example**

<Query>

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
      select: 'name'
    },
    'central_addresses!billing_address': {
      select: '*'
    }
  },
  '91_comps.year.eq': 1991
}
```

</Query>

## Insertions / Updates <PostgrestDocs href="https://postgrest.org/en/latest/api.html#insertions-updates"/>

### Columns

<Query>

``` js
const query = {
  columns: 'source,publication_date,figure'
}
```

</Query>

<Query>

``` js
const query = {
  columns: ['source', 'publication_date', 'figure']
}
```

</Query>

### On Conflict

<Query>

``` js
const query = {
  on_conflict: 'source'
}
```

</Query>

<Query>

``` js
const query = {
  on_conflict: ['source', 'publication_date', 'figure']
}
```

</Query>
