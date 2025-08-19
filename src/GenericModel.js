import Vue from 'vue'
import { PrimaryKeyError } from '@/errors'
import { $diff, $freeze, createDiffProxy, createPKQuery, createReactivePrototype, mapAliasesFromSelect } from '@/utils'

class GenericModel {
  #options
  #proxy

  constructor (options, data) {
    this.#options = options
    Object.assign(this, data)
    this.#proxy = createReactivePrototype(createDiffProxy(this), this)
    return this.#proxy
  }

  async #request ({ method, keepChanges = false, needsQuery = true }, signal, opts, ...data) {
    await this.#options.route.$ready
    const { columns, ...options } = opts

    const query = { select: this.#options.select }

    if (needsQuery) {
      const q = this.#options.query
      if (!q) throw new PrimaryKeyError()
      if (q instanceof PrimaryKeyError) throw q
      Object.assign(query, q)
    }

    if (columns) {
      if (this.#options.route.columns) {
        query.columns = columns.filter(c => this.#options.route.columns.includes(c))
      } else {
        query.columns = columns
      }
    }

    // rename aliased columns and drop columns that don't exist on the route (e.g. joined columns)
    data = data.map(data => {
      return Object.fromEntries(
        Object.entries(mapAliasesFromSelect(this.#options.select, data))
          .filter(([col, v]) => !this.#options.route.columns || this.#options.route.columns.includes(col))
      )
    })

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
      const diff = this.#proxy[$diff]
      Object.entries(body).forEach(([key, value]) => Vue.set(this.#proxy, key, value))
      this.#proxy[$freeze]()
      Object.entries(diff).forEach(([key, value]) => Vue.set(this.#proxy, key, value))
    } else {
      Object.entries(body).forEach(([key, value]) => Vue.set(this.#proxy, key, value))
      this.#proxy[$freeze]()
    }
    return body
  }

  async $get (signal, opts = {}) {
    const { keepChanges, ...options } = opts
    return this.#request({ method: 'get', keepChanges }, signal, options)
  }

  async $post (signal, opts = {}) {
    const options = { return: 'representation', ...opts }
    const body = await this.#request({ method: 'post', needsQuery: false }, signal, options, this.#proxy)
    if (body) {
      // we need to make sure the query is updated with the primary key
      this.#options.query = createPKQuery(this.#options.route.pks, mapAliasesFromSelect(this.#options.query?.select, body))
    }
    return body
  }

  async $put (signal, opts) {
    const options = { return: 'representation', ...opts }
    return this.#request({ method: 'put' }, signal, options, this.#proxy)
  }

  async $patch (signal, opts, data = {}) {
    const options = { return: 'representation', ...opts }

    if (!data || typeof data !== 'object') {
      throw new Error('Patch data must be an object.')
    }
    const patchData = Object.assign(
      {},
      this.#proxy[$diff],
      data
    )

    if (Object.keys(patchData).length === 0) {
      // avoid sending an empty patch request
      return this.#proxy
    }

    return this.#request({ method: 'patch' }, signal, options, patchData)
  }

  async $delete (signal, options = {}) {
    return this.#request({ method: 'delete' }, signal, options)
  }
}

export default GenericModel
