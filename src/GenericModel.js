import DeepProxy, { $base, $diff, $freeze } from '@/DeepProxy'
import ObservableFunction from '@/ObservableFunction'
import { PrimaryKeyError } from '@/errors'
import { reflect, cloneDeep } from '@/utils'

class GenericModel {
  #alias2column
  #column2alias
  #model
  #route
  #select

  constructor ({ route, select }, data) {
    const cols = this.columnMappingFromSelect(select)
    this.#alias2column = new Map(cols)
    this.#column2alias = new Map(cols.map(([k, v]) => [v, k]))
    this.#route = route
    this.#select = select
    this.#model = new DeepProxy(cloneDeep(data))

    // ObservableFunctions need to be defined on the instance, because they keep state
    const $get = new ObservableFunction(this.$get.bind(this))
    const $post = new ObservableFunction(this.$post.bind(this))
    const $put = new ObservableFunction(this.$put.bind(this))
    const $patch = new ObservableFunction(this.$patch.bind(this))
    const $delete = new ObservableFunction(this.$delete.bind(this))

    return new Proxy(this, {
      deleteProperty: reflect.bind(this.#model, 'deleteProperty', ['$get', '$post', '$put', '$patch', '$delete'], false),
      defineProperty: reflect.bind(this.#model, 'defineProperty', ['$get', '$post', '$put', '$patch', '$delete'], false),
      has: reflect.bind(this.#model, 'has', ['$get', '$post', '$put', '$patch', '$delete'], true),
      getOwnPropertyDescriptor: reflect.bind(this.#model, 'getOwnPropertyDescriptor', ['$get', '$post', '$put', '$patch', '$delete'], undefined),
      ownKeys: reflect.bind(this.#model, 'ownKeys', [], undefined),
      set: reflect.bind(this.#model, 'set', ['$get', '$post', '$put', '$patch', '$delete'], false),
      get: (target, property, receiver) => {
        switch (property) {
          case '$get': return $get
          case '$post': return $post
          case '$put': return $put
          case '$patch': return $patch
          case '$delete': return $delete
          default: return Reflect.get(this.#model, property, receiver)
        }
      }
    })
  }

  setData (data, keepDiff = false) {
    if (keepDiff) {
      const diff = this.#model[$diff]
      Object.assign(this.#model, data)
      this.#model[$freeze]()
      Object.assign(this.#model, diff)
    } else {
      Object.assign(this.#model, data)
      this.#model[$freeze]()
    }
  }

  columnMappingFromSelect (select) {
    if (!select) return []
    const kvPairs =
      Array.isArray(select) ? select.map(k => [k, true])
        : typeof select === 'string' ? select.split(',').map(k => [k, true])
          : Object.entries(select)

    return kvPairs
      .map(([k, v]) => {
        if (!v) return
        const [alias, column] = k.split(':')
        return [alias, column ?? alias]
      })
      .filter(Boolean)
  }

  queryFromPKs () {
    if (this.#route.pks.length === 0) throw new PrimaryKeyError()
    const base = this.#model[$base]
    return this.#route.pks.reduce((q, pk) => {
      const alias = this.#column2alias.get(pk) ?? pk
      if (base[alias] === undefined || base[alias] === null) {
        throw new PrimaryKeyError(pk)
      }
      q[pk + '.eq'] = base[alias]
      return q
    }, {})
  }

  async $get (signal, opts = {}) {
    await this.#route.$ready
    const { keepChanges, ...options } = Object.assign({}, opts)

    const query = this.queryFromPKs()
    if (this.#select) {
      query.select = this.#select
    }
    const resp = await this.#route.get(query, { ...options, accept: 'single', signal })
    const body = await resp.json()

    this.setData(body, keepChanges)
    return body
  }

  async $post (signal, opts) {
    await this.#route.$ready
    const defaultOptions = { return: 'representation' }
    const { columns, ...options } = Object.assign({}, defaultOptions, opts)

    const query = {}
    if (options.return === 'representation' && this.#select) {
      query.select = this.#select
    }
    if (columns) {
      if (this.#route.columns) {
        query.columns = columns.filter(c => this.#route.columns.includes(c))
      } else {
        query.columns = columns
      }
    }

    const postData = Object.assign(
      {},
      Object.keys(this.#model).reduce((acc, alias) => {
        const col = this.#alias2column.get(alias) ?? alias
        if (this.#route.columns) {
          if (this.#route.columns.includes(col)) {
            acc[col] = this.#model[alias]
          }
        } else {
          acc[col] = this.#model[alias]
        }
        return acc
      }, {})
    )

    const resp = await this.#route.post(query, { ...options, accept: 'single', signal }, postData)

    if (options.return === 'representation') {
      const body = await resp.json()
      this.setData(body)
      return body
    } else if (resp.headers.get('Location')) {
      const loc = new URLSearchParams(resp.headers.get('Location').replace(/^\/[^?]+\?/, ''))
      const ret = {}
      for (const [key, value] of loc.entries()) {
        ret[key] = value.replace(/^eq\./, '')
      }
      return ret
    }
  }

  async $put (signal, opts) {
    await this.#route.$ready
    const defaultOptions = { return: 'representation' }
    const { columns, ...options } = Object.assign({}, defaultOptions, opts)

    const query = this.queryFromPKs()
    if (options.return === 'representation' && this.#select) {
      query.select = this.#select
    }
    if (columns) {
      query.columns = columns.filter(c => this.#route.columns.includes(c))
    }

    const putData = Object.assign(
      {},
      Object.keys(this.#model).reduce((acc, alias) => {
        const col = this.#alias2column.get(alias) ?? alias
        if (this.#route.columns.includes(col)) {
          acc[col] = this.#model[alias]
        }
        return acc
      }, {})
    )

    const resp = await this.#route.put(query, { ...options, accept: 'single', signal }, putData)

    if (options.return === 'representation') {
      const body = await resp.json()
      this.setData(body)
      return body
    } else if (resp.headers.get('Location')) {
      const loc = new URLSearchParams(resp.headers.get('Location').replace(/^\/[^?]+\?/, ''))
      const ret = {}
      for (const [key, value] of loc.entries()) {
        ret[key] = value.replace(/^eq\./, '')
      }
      return ret
    }
  }

  async $patch (signal, data = {}, opts) {
    await this.#route.$ready
    const defaultOptions = { return: 'representation' }
    const { columns, ...options } = Object.assign({}, defaultOptions, opts)

    const query = this.queryFromPKs()
    if (options.return === 'representation' && this.#select) {
      query.select = this.#select
    }
    if (columns) {
      query.columns = columns.filter(c => this.#route.columns.includes(c))
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Patch data must be an object.')
    }
    const diff = this.#model[$diff]
    const patchData = Object.assign(
      {},
      Object.keys(this.#model[$diff]).reduce((acc, alias) => {
        const col = this.#alias2column.get(alias) ?? alias
        if (this.#route.columns.includes(col)) {
          acc[col] = diff[alias]
        }
        return acc
      }, {}),
      Object.keys(data).reduce((acc, col) => {
        if (data[col] !== undefined) {
          acc[col] = data[col]
        }
        return acc
      }, {})
    )

    // no empty requests
    if (Object.keys(patchData).length === 0) {
      return
    }

    const resp = await this.#route.patch(query, { ...options, accept: 'single', signal }, patchData)

    if (options.return === 'representation') {
      const body = await resp.json()
      this.setData(body)
      return body
    }
  }

  async $delete (signal, options = {}) {
    await this.#route.$ready
    const query = this.queryFromPKs()
    if (options.return === 'representation' && this.#select) {
      query.select = this.#select
    }

    const resp = await this.#route.delete(query, { ...options, accept: 'single', signal })

    if (options.return === 'representation') {
      const body = await resp.json()
      this.setData(body)
      return body
    }
  }
}

export default GenericModel
