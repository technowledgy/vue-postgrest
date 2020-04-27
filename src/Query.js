function isLogicalOperator (k) {
  return ['and', 'or', 'not.and', 'not.or'].includes(k)
}

function quoteValue (str) {
  str = (str || '') && str.toString()
  if ([',', '.', ':', '(', ')'].find(r => str.includes(r)) || ['null', 'true', 'false'].includes(str)) {
    return `"${str}"`
  } else {
    return str
  }
}

// conditional concat - only if str is set
function cc (prefix, str, suffix = '') {
  str = str && str.toString()
  return str ? `${prefix}${str}${suffix}` : ''
}

class Query extends URL {
  subQueries = {}
  #apiRoot

  constructor (apiRoot, route, queryObject = {}) {
    const url = (apiRoot + '/' + route).replace(/\/+/g, '/')
    super(url, window.location.href)
    this.#apiRoot = apiRoot
    const { columns, select, order, limit, offset, ...conditions } = queryObject
    if (columns) this.searchParams.append('columns', columns)
    this._appendSelect(select)
    this._appendOrder(order)
    this._appendLimit(limit)
    this._appendOffset(offset)
    this._appendConditions(conditions)
    this._appendSubQueryParams(this)
  }

  _appendSubQueryParams (parent, aliasChain = '') {
    for (let [alias, query] of Object.entries(parent.subQueries)) {
      alias = cc(`${aliasChain}`, alias)
      for (const [key, value] of query.searchParams.entries()) {
        // columns are not merged with subqueries and select is handled in _parseSelectObject
        if (['columns', 'select'].includes(key)) continue
        this.searchParams.append(`${alias}.${key}`, value)
      }
      this._appendSubQueryParams(query, alias)
    }
  }

  _appendSelect (select) {
    if (typeof select === 'object' && !Array.isArray(select)) {
      this.searchParams.append('select', this._parseSelectObject(select))
    } else if (select) {
      this.searchParams.append('select', select.toString())
    }
  }

  _parseSelectObject (obj, jsonChain = []) {
    return Object.entries(obj).map(([k, v]) => {
      // ignore falsy values - will be filtered out
      if (!v) return
      // embedding resources with sub queries
      if (v && v.select) {
        const alias = k.split(':', 1)[0].split('!', 1)[0]
        const subQuery = new Query(this.#apiRoot, alias, v)
        this.subQueries[alias] = subQuery
        return `${k}(${subQuery.searchParams.get('select')})`
      }
      // regular select
      let alias = ''; let field; let cast = ''; let subfields = []
      if (k.includes(':')) {
        [alias, field] = k.split(':')
      } else {
        field = k
      }
      if (typeof v === 'string') {
        cast = v
      } else if (typeof v === 'object') { // json-fields
        let fields
        ({ '::': cast, ...fields } = v)
        subfields = this._parseSelectObject(fields, [...jsonChain, field])
        // only select the json-field itself, if either alias or cast are set or no subfields are available
        if (subfields.length > 0 && !alias && !cast) {
          return subfields
        }
      }
      return [
        cc('', alias, ':') + [...jsonChain, field].join('->') + cc('::', cast),
        subfields
      ]
    }).flat(2).filter(Boolean).join(',')
  }

  _appendOrder (order) {
    if (Array.isArray(order)) {
      this.searchParams.append('order', order.map(item => {
        if (Array.isArray(item)) {
          return item.join('.')
        } else {
          return item
        }
      }).join(','))
    } else if (typeof order === 'object') {
      this.searchParams.append('order', Object.entries(order).map(([k, v]) => {
        if (v && typeof v === 'string') {
          return `${k}.${v}`
        } else {
          return k
        }
      }).join(','))
    } else if (order) {
      this.searchParams.append('order', order)
    }
  }

  _appendLimit (limit) {
    if (limit) {
      this.searchParams.append('limit', limit)
    }
  }

  _appendOffset (offset) {
    if (offset) {
      this.searchParams.append('offset', offset)
    }
  }

  _appendConditions (obj) {
    for (const { key, value } of this._parseConditions(obj)) {
      this.searchParams.append(key, value)
    }
  }

  _parseConditions (obj, jsonPrefix = '') {
    return Object.entries(obj).map(([key, value]) => {
      // throw away alias - just used to allow the same condition more than once on one object
      const aliasKey = key.split(':')
      key = aliasKey[1] || aliasKey[0]
      if (isLogicalOperator(key)) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('no object for logical operator')
        if (jsonPrefix) throw new Error('logical operators can\'t be nested with json operators')
        const strValue = this._parseConditions(value).map(({ key: k, value: v }) => {
          return isLogicalOperator(k) ? `${k}${v}` : `${k}.${v}`
        }).join(',')
        return {
          key,
          value: `(${strValue})`
        }
      } else {
        const [field, ...ops] = key.split('.')
        let strValue
        switch (ops[ops.length - 1]) {
          case 'in':
            strValue = this._valueToString(value, '()')
            break
          case undefined:
            // no operator + object = nested json
            if (value && typeof value === 'object') {
              return this._parseConditions(value, cc('', jsonPrefix, '->') + field)
            }
            // falls through
          default:
            strValue = this._valueToString(value)
        }
        const jsonOperator = typeof value === 'string' ? '->>' : '->'
        return {
          key: cc('', jsonPrefix, jsonOperator) + field,
          value: [...ops, strValue].join('.')
        }
      }
    }).flat()
  }

  _valueToString (value, arrayBrackets = '{}') {
    if (value === null) {
      return 'null'
    } else if (typeof value === 'boolean') {
      return value.toString()
    } else if (Array.isArray(value)) {
      return arrayBrackets.charAt(0) + value.map(v => this._valueToString(v)).join(',') + arrayBrackets.charAt(1)
    } else if (typeof value === 'object') {
      // range type
      const { lower, includeLower = true, upper, includeUpper = false } = value
      return (includeLower ? '[' : '(') + lower + ',' + upper + (includeUpper ? ']' : ')')
    } else {
      return quoteValue(value)
    }
  }
}

export default Query
