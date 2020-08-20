import DeepProxy, { $base, $diff, $freeze } from '@/DeepProxy'
import ObservableFunction from '@/ObservableFunction'
import { PrimaryKeyError } from '@/errors'
import { reflect, cloneDeep } from '@/utils'

class GenericModel {
  #model
  #options

  constructor (options, data) {
    this.#options = options
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

  async request ({ method, keepChanges = false, queryPK = true }, signal, opts, ...data) {
    await this.#options.route.$ready
    const { columns, ...options } = opts

    // re-create alias mapping every time, because "select" might have been changed between calls
    const cols = this.columnMappingFromSelect(this.#options.select)
    const alias2column = new Map(cols)
    const column2alias = new Map(cols.map(([k, v]) => [v, k]))

    const query = { select: this.#options.select }

    if (queryPK) {
      // we can't get/put/patch/delete on a route without PK
      if (this.#options.route.pks.length === 0) throw new PrimaryKeyError()
      // base = unmodified data, since we need to query on the old PK, if it was changed
      const base = this.#model[$base]
      this.#options.route.pks.forEach(pk => {
        const alias = column2alias.get(pk) ?? pk
        if (base[alias] === undefined || base[alias] === null) {
          throw new PrimaryKeyError(pk)
        }
        // TODO: do we need .is for Boolean PKs?
        query[pk + '.eq'] = base[alias]
      })
    }

    if (columns) {
      if (this.#options.route.columns) {
        query.columns = columns.filter(c => this.#options.route.columns.includes(c))
      } else {
        query.columns = columns
      }
    }

    // rename aliased columns
    if (data[0]) {
      data[0] = Object.assign(
        {},
        Object.keys(data[0]).reduce((acc, alias) => {
          const col = alias2column.get(alias) ?? alias
          if (!this.#options.route.columns || this.#options.route.columns.includes(col)) {
            acc[col] = data[0][alias]
          }
          return acc
        }, {})
      )
    }

    const resp = await this.#options.route[method](query, { ...options, accept: 'single', signal }, ...data)

    let body
    try {
      body = await resp.json()
    } catch {
      if (!resp.headers.get('Location')) return
      // for POST/PUT minimal
      const loc = new URLSearchParams(resp.headers.get('Location').replace(/^\/[^?]+\?/, ''))
      return Object.fromEntries(Array.from(loc.entries()).map(([key, value]) => [key, value.replace(/^eq\./, '')]))
    }

    // update instance with returned data
    // TODO: do we need to delete missing keys?
    if (keepChanges) {
      const diff = this.#model[$diff]
      Object.assign(this.#model, body)
      this.#model[$freeze]()
      Object.assign(this.#model, diff)
    } else {
      Object.assign(this.#model, body)
      this.#model[$freeze]()
    }
    return body
  }

  async $get (signal, opts = {}) {
    const { keepChanges, ...options } = opts
    return this.request({ method: 'get', keepChanges }, signal, options)
  }

  async $post (signal, opts = {}) {
    const options = { return: 'representation', ...opts }
    return this.request({ method: 'post', queryPK: false }, signal, options, this.#model)
  }

  async $put (signal, opts) {
    const options = { return: 'representation', ...opts }
    return this.request({ method: 'put' }, signal, options, this.#model)
  }

  async $patch (signal, opts, data = {}) {
    const options = { return: 'representation', ...opts }

    if (!data || typeof data !== 'object') {
      throw new Error('Patch data must be an object.')
    }
    const patchData = Object.assign(
      {},
      this.#model[$diff],
      data
    )

    return this.request({ method: 'patch' }, signal, options, patchData)
  }

  async $delete (signal, options = {}) {
    return this.request({ method: 'delete' }, signal, options)
  }
}

export default GenericModel
