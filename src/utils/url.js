// taken from https://github.com/jammo-nl/postgrest-url/blob/Embeds/index.js

export default function url (schema) {
  var table = Object.keys(schema)[0]
  var params = []
  var select = []
  var level = ''
  var url = ''

  if (typeof table === 'undefined' || table === '') {
    return url
  }

  // Allow alias on the table name so we can re use
  // query definition for embedded entities
  if (table.indexOf(':') > -1) {
    table = table.split(':')[1]
  }

  url = table

  embed(schema, params, select, level, 0)

  if (select.length > 0) {
    url += '?select=' + select.join(',')
  }

  if (select.length > 0 && params.length > 0) {
    url += '&' + params.join('&')
  }

  if (select.length === 0 && params.length > 0) {
    url += '?' + params.join('&')
  }

  return url
}

function embed (obj, params, select, level, levelIndex) {
  var table = Object.keys(obj)[0]
  var schema = obj[table]
  var alias = table.split(':')
  var currentSelect = []

  if (levelIndex > 0) {
    if (alias.length === 2) {
      level += alias[1] + '.'
    } else {
      level += table + '.'
    }
  }

  Object.keys(schema).forEach(key => {
    switch (key) {
      case 'order':
        if (typeof schema[key] === 'string' || Array.isArray(schema[key])) {
          params.push(level + 'order=' + schema[key])
        } else {
          throw new TypeError('order value isn\'t a String or Array')
        }

        break
      case 'limit':
        if (!Number.isSafeInteger(schema[key])) {
          throw new TypeError('limit value isn\'t a safe integer')
        }

        params.push(level + 'limit=' + schema[key])
        break
      case 'offset':
        if (!Number.isSafeInteger(schema[key])) {
          throw new TypeError('offset value isn\'t a safe integer')
        }

        params.push(level + 'offset=' + schema[key])
        break
      case 'select':
        if (typeof schema[key] === 'string') {
          currentSelect.push(schema[key])
        }

        if (Array.isArray(schema[key])) {
          schema[key].forEach(item => {
            if (typeof item === 'object') {
              embed(item, params, currentSelect, level, levelIndex + 1)
            } else {
              currentSelect.push(item)
            }
          })
        }

        // for invalid types just push '*'
        // this way we at least get the complete resource
        // here we don't throw an error because we have a good fallback
        // for limit/order/offset we dont have a good fallback
        if (currentSelect.length === 0) {
          currentSelect.push('*')
        }

        if (levelIndex > 0) {
          select.push(table + '(' + currentSelect.join(',') + ')')
        } else {
          select.push(currentSelect.join(','))
        }

        break
      default:
        params.push(level + key + '=' + schema[key])
    }
  })

  // embedded entities need the '(*)'
  // so if select is undefined we add it automatically
  if (levelIndex > 0 && currentSelect.length === 0) {
    select.push(table + '(*)')
  }
}
