import Query from '@/Query'

// helper function for simple input-output testcases
function itt (desc, inputObject, expectedResult) {
  it(desc, () => {
    expect(decodeURIComponent((new Query('/api', 'test', inputObject)).searchParams.toString())).toBe(expectedResult)
  })
}

describe('Query', () => {
  it('implements URL interface', () => {
    // eslint-disable-next-line no-prototype-builtins
    expect(URL.isPrototypeOf(Query)).toBe(true)
  })

  itt('returns empty query string without input', undefined, '')

  itt('returns empty query string with empty input', {}, '')

  it('returns path of URI properly', () => {
    // jsdom is configured in jest.config to have globalThis.location at localhost/nested/path
    expect((new Query('api', 'test', {})).toString()).toBe('http://localhost/nested/api/test')
    expect((new Query('/api', 'test', {})).toString()).toBe('http://localhost/api/test')
    expect((new Query('/api/', 'test', {})).toString()).toBe('http://localhost/api/test')
    expect((new Query('/api', 'rpc/test', {})).toString()).toBe('http://localhost/api/rpc/test')
    expect((new Query('/api', '/rpc/test', {})).toString()).toBe('http://localhost/api/rpc/test')
    expect((new Query('http://example.com/api', '/rpc/test', {})).toString()).toBe('http://example.com/api/rpc/test')
    expect((new Query('http://example.com/api/', '/rpc/test', {})).toString()).toBe('http://example.com/api/rpc/test')
  })

  describe('arguments', () => {
    itt('sets string', { str: 'test' }, 'str=test')

    itt('sets empty string', { str: '' }, 'str=')

    itt('ignores undefined values', { str: undefined }, '')

    itt('represents integer as string', { int: 1 }, 'int=1')

    itt('quotes float', { pi: 3.14 }, 'pi="3.14"')

    itt('quotes values with reserved postgrest characters', { str: 'test.test' }, 'str="test.test"')

    itt('represents null as string', { null: null }, 'null=null')

    itt('quotes string null', { str: 'null' }, 'str="null"')

    itt('represents true as string', { bool: true }, 'bool=true')

    itt('quotes string true', { str: 'true' }, 'str="true"')

    itt('represents false as string', { bool: false }, 'bool=false')

    itt('quotes string false', { str: 'false' }, 'str="false"')

    itt('supports arguments with array values', { arr: [1, 2, 3] }, 'arr={1,2,3}')
  })

  describe('horizontal filtering', () => {
    itt('sets single condition', { 'id.eq': 1 }, 'id=eq.1')

    itt('quotes only value and not operator', { 'pi.eq': 3.14 }, 'pi=eq."3.14"')

    itt('sets multiple conditions', {
      'id.eq': 1,
      'name.eq': 'test'
    }, 'id=eq.1&name=eq.test')

    itt('supports multiple operators', { 'id.not.eq': 1 }, 'id=not.eq.1')

    it('throws when using logical operator without object', () => {
      expect(() => new Query('/api', 'test', { or: true })).toThrow()
      expect(() => new Query('/api', 'test', { and: null })).toThrow()
      expect(() => new Query('/api', 'test', { 'not.or': '' })).toThrow()
      expect(() => new Query('/api', 'test', { 'not.and': [] })).toThrow()
      expect(() => new Query('/api', 'test', { or: 1 })).toThrow()
    })

    itt('ignores logical operators set to undefined', { and: undefined }, '')

    itt('supports logical disjoining with "or" object', {
      or: {
        'id.eq': 1,
        'name.eq': 'test'
      }
    }, 'or=(id.eq.1,name.eq.test)')

    itt('supports logical disjoining with aliased keys', {
      or: {
        'f:nb.is': false,
        'n:nb.is': null
      }
    }, 'or=(nb.is.false,nb.is.null)')

    itt('supports complex logical operations', {
      and: {
        'grade.gte': 90,
        'student.is': true,
        or: {
          'age.gte': 14,
          'age.is': null
        }
      }
    }, 'and=(grade.gte.90,student.is.true,or(age.gte.14,age.is.null))')

    itt('supports negated logical operators', {
      'not.and': {
        'grade.gte': 91,
        'student.is': false,
        'not.or': {
          'age.gte': 15,
          'age.not.is': null
        }
      }
    }, 'not.and=(grade.gte.91,student.is.false,not.or(age.gte.15,age.not.is.null))')

    itt('ignores empty logical operator', {
      and: {},
      or: {}
    }, '')

    itt('supports full-text search operator options in key', { 'my_tsv.fts(french)': 'amusant' }, 'my_tsv=fts(french).amusant')

    itt('supports "in" operator with array', { 'id.in': [1, 2, 3] }, 'id=in.(1,2,3)')

    itt('supports other operators with arrays', { 'tags.cs': ['example', 'new'] }, 'tags=cs.{example,new}')

    itt('supports range operators with objects', { 'range.sl': { lower: 1, upper: 10 } }, 'range=sl.[1,10)')

    itt('supports range operators with objects and non-default include settings', { 'range.sl': { lower: 1, includeLower: false, upper: 10, includeUpper: true } }, 'range=sl.(1,10]')

    itt('supports nested filter on json field', {
      json_data: {
        'blood_type.eq': 'A-',
        'age.gt': 20
      }
    }, 'json_data->>blood_type=eq.A-&json_data->age=gt.20')

    it('throws when using logical operator nested in json field', () => {
      expect(() => new Query('/api', 'test', {
        json_field: {
          or: {}
        }
      })).toThrow()
    })
  })

  describe('vertical filtering', () => {
    itt('single column as string', { select: '*' }, 'select=*')

    itt('multiple columns as string', { select: 'id,name' }, 'select=id,name')

    itt('single column in array', { select: ['id'] }, 'select=id')

    itt('multiple columns in array', { select: ['id', 'name'] }, 'select=id,name')

    itt('single column in object', { select: { id: true } }, 'select=id')

    itt('multiple columns in object with truthy values', { select: { id: 1, name: {} } }, 'select=id,name')

    itt('ignore columns with falsy values', {
      select: {
        id: true,
        ignore1: false,
        ignore2: 0,
        ignore3: '',
        ignore4: null
      }
    }, 'select=id')

    itt('renames column in key', { select: { 'alias:id': {} } }, 'select=alias:id')

    itt('casts column from string', { select: { full_name: true, salary: 'text' } }, 'select=full_name,salary::text')

    itt('casts type from object', { select: { full_name: true, salary: { '::': 'text' } } }, 'select=full_name,salary::text')

    itt('uses json operators for nested objects', {
      select: {
        id: true,
        json_data: {
          blood_type: true,
          phones: true
        }
      }
    }, 'select=id,json_data->blood_type,json_data->phones')

    itt('uses json operators for nested arrays', {
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
    }, 'select=id,json_data->phones->0->number')

    itt('both json_data and subfield at the same time', {
      select: {
        id: true,
        'jd:json_data': {
          'bt:blood_type': true
        }
      }
    }, 'select=id,jd:json_data,bt:json_data->blood_type')

    itt('renames json_data in key, uses subfield and casts properly', {
      select: {
        id: true,
        'jd:json_data': {
          '::': 'text',
          'bt:blood_type': 'integer'
        }
      }
    }, 'select=id,jd:json_data::text,bt:json_data->blood_type::integer')
  })

  describe('ordering', () => {
    itt('with string', { order: 'age.desc,height.asc' }, 'order=age.desc,height.asc')

    itt('with array of strings', { order: ['age.desc', 'height.asc'] }, 'order=age.desc,height.asc')

    itt('with array of arrays', { order: [['age', 'desc'], ['height', 'asc']] }, 'order=age.desc,height.asc')

    itt('with object', {
      order: {
        age: 'desc',
        height: 'asc.nullslast'
      }
    }, 'order=age.desc,height.asc.nullslast')

    itt('with object and defaults', {
      order: {
        age: true
      }
    }, 'order=age')
  })

  describe('pagination', () => {
    itt('sets limit', { limit: 1 }, 'limit=1')

    itt('sets offset', { offset: 1 }, 'offset=1')
  })

  describe('columns', () => {
    itt('sets string', { columns: 'source,publication_date,figure' }, 'columns=source,publication_date,figure')

    itt('sets from array', { columns: ['source', 'publication_date', 'figure'] }, 'columns=source,publication_date,figure')
  })

  describe('on_conflict', () => {
    itt('sets string', { on_conflict: 'source' }, 'on_conflict=source')

    itt('sets from array', { on_conflict: ['source', 'publication_date', 'figure'] }, 'on_conflict=source,publication_date,figure')
  })

  describe('embedding resources', () => {
    itt('simple form', {
      select: {
        title: true,
        directors: {
          select: {
            id: true,
            last_name: true
          }
        }
      }
    }, 'select=title,directors(id,last_name)')

    itt('nested', {
      select: {
        title: true,
        directors: {
          select: {
            id: true,
            last_name: true,
            awards: {
              select: '*'
            }
          }
        }
      }
    }, 'select=title,directors(id,last_name,awards(*))')

    itt('with alias', {
      select: {
        title: true,
        'director:directors': {
          select: {
            id: true,
            last_name: true
          }
        }
      }
    }, 'select=title,director:directors(id,last_name)')

    itt('with order', {
      select: {
        '*': true,
        actors: {
          select: '*',
          order: ['last_name', 'first_name']
        }
      }
    }, 'select=*,actors(*)&actors.order=last_name,first_name')

    itt('with filters', {
      select: {
        '*': true,
        roles: {
          select: '*',
          'character.in': ['Chico', 'Harpo', 'Groucho']
        }
      }
    }, 'select=*,roles(*)&roles.character=in.(Chico,Harpo,Groucho)')

    itt('with complex filter', {
      select: {
        '*': true,
        roles: {
          select: '*',
          or: {
            '0:character.eq': 'Gummo',
            '1:character.eq': 'Zeppo'
          }
        }
      }
    }, 'select=*,roles(*)&roles.or=(character.eq.Gummo,character.eq.Zeppo)')

    itt('with pagination', {
      select: {
        '*': true,
        actors: {
          select: '*',
          limit: 10,
          offset: 2
        }
      }
    }, 'select=*,actors(*)&actors.limit=10&actors.offset=2')

    itt('with alias and filters', {
      select: {
        '*': true,
        '90_comps:competitions': {
          select: 'name',
          'year.eq': 1990
        },
        '91_comps:competitions': {
          select: 'name',
          'year.eq': 1991
        }
      }
    }, 'select=*,90_comps:competitions(name),91_comps:competitions(name)&90_comps.year=eq.1990&91_comps.year=eq.1991')

    itt('multiple', {
      select: {
        rank: true,
        competitions: {
          select: ['name', 'year']
        },
        films: {
          select: 'title'
        }
      },
      'rank.eq': 5
    }, 'select=rank,competitions(name,year),films(title)&rank=eq.5')

    itt('with hint', {
      select: {
        '*': true,
        'central_addresses!billing_address': {
          select: '*'
        }
      }
    }, 'select=*,central_addresses!billing_address(*)')
  })
})
