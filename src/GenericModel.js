import DeepProxy from '@/DeepProxy'
import ObservableFunction from '@/ObservableFunction'
import { PrimaryKeyError } from '@/errors'
import { cloneDeep } from '@/utils'

class GenericModel {
  #alias2column
  #column2alias
  #model
  #route
  #select

  constructor (data, { route, select }) {
    const cols = this.columnMappingFromSelect(select)
    this.#alias2column = new Map(cols)
    this.#column2alias = new Map(cols.map(([k, v]) => [v, k]))
    this.#model = new DeepProxy(cloneDeep(data))
    this.#route = route
    this.#select = select

    // ObservableFunctions need to be defined on the instance, because they keep state
    // Using defineProperties to make them non-configurable, non-enumerable, non-writable
    Object.defineProperties(this, {
      $get: {
        value: new ObservableFunction(this.get.bind(this))
      },
      $post: {
        value: new ObservableFunction(this.post.bind(this))
      },
      $put: {
        value: new ObservableFunction(this.put.bind(this))
      },
      $patch: {
        value: new ObservableFunction(this.patch.bind(this))
      },
      $delete: {
        value: new ObservableFunction(this.delete.bind(this))
      }
    })

    // proxies the call to fn to either the proxy target
    // or #model object
    function proxySwitch (fn, target, property, ...args) {
      if (property in target) {
        return Reflect[fn](target, property, ...args)
      }
      return Reflect[fn](this.#model, property, ...args)
    }
    function concatKeys (target) {
      return Reflect.ownKeys(target).concat(Reflect.ownKeys(this.#model))
    }
    return new Proxy(this, {
      defineProperty: proxySwitch.bind(this, 'defineProperty'),
      deleteProperty: proxySwitch.bind(this, 'deleteProperty'),
      get: proxySwitch.bind(this, 'get'),
      getOwnPropertyDescriptor: proxySwitch.bind(this, 'getOwnPropertyDescriptor'),
      has: proxySwitch.bind(this, 'has'),
      set: proxySwitch.bind(this, 'set'),
      ownKeys: concatKeys.bind(this)
    })
  }

  setData (data, keepDiff = false) {
    if (keepDiff) {
      const diff = this.#model.$diff
      Object.assign(this.#model, data)
      this.#model.$freeze()
      Object.assign(this.#model, diff)
    } else {
      Object.assign(this.#model, data)
      this.#model.$freeze()
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
    const base = this.#model.$base
    return this.#route.pks.reduce((q, pk) => {
      const alias = this.#column2alias.get(pk) ?? pk
      if (base[alias] === undefined || base[alias] === null) {
        throw new PrimaryKeyError(pk)
      }
      q[pk + '.eq'] = base[alias]
      return q
    }, {})
  }

  async get (signal, opts = {}) {
    await this.#route.$ready
    const defaultOptions = { accept: 'single' }
    const { keepChanges, ...options } = Object.assign({}, defaultOptions, opts)

    const query = this.queryFromPKs()
    if (this.#select) {
      query.select = this.#select
    }
    const resp = await this.#route.get(query, { ...options, accept: 'single', signal })
    const body = await resp.json()

    this.setData(body, keepChanges)
    return body
  }

  async post (signal, opts) {
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

  async put (signal, opts) {
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

  async patch (signal, data = {}, opts) {
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
    const patchData = Object.assign(
      {},
      Object.keys(this.#model.$diff).reduce((acc, alias) => {
        const col = this.#alias2column.get(alias) ?? alias
        if (this.#route.columns.includes(col)) {
          acc[col] = this.#model.$diff[alias]
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

  async delete (signal, options = {}) {
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
