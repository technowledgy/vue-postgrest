import DeepProxy from '@/DeepProxy'
import ObservableFunction from '@/ObservableFunction'
import { PrimaryKeyError } from '@/errors'
import { cloneDeep } from '@/utils'

class GenericModel {
  #route
  #select
  #data

  constructor (data, { route, select }) {
    this.#route = route
    this.#select = select
    this.#data = new DeepProxy(cloneDeep(data))

    // ObservableFunctions need to be defined on the instance, because they keep state
    // Using defineProperties to make them non-configurable, non-enumerable, non-writable
    Object.defineProperties(this, {
      $get: {
        value: new ObservableFunction(this.get.bind(this))
      },
      $post: {
        value: new ObservableFunction(this.post.bind(this))
      },
      $patch: {
        value: new ObservableFunction(this.patch.bind(this))
      },
      $delete: {
        value: new ObservableFunction(this.delete.bind(this))
      }
    })

    // proxies the call to fn to either the proxy target
    // or #data object
    function proxySwitch (fn, target, property, ...args) {
      if (property in target) {
        return Reflect[fn](target, property, ...args)
      }
      return Reflect[fn](this.#data, property, ...args)
    }
    function concatKeys (target) {
      return Reflect.ownKeys(target).concat(Reflect.ownKeys(this.#data))
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
      const diff = this.#data.$diff
      Object.assign(this.#data, data)
      this.#data.$freeze()
      Object.assign(this.#data, diff)
    } else {
      Object.assign(this.#data, data)
      this.#data.$freeze()
    }
  }

  async createQueryFromPKs () {
    if (this.#route.pks.length === 0) throw new PrimaryKeyError()
    const base = this.#data.$base
    return this.#route.pks.reduce((q, pk) => {
      if (base[pk] === undefined || base[pk] === null) {
        throw new PrimaryKeyError(pk)
      }
      q[pk + '.eq'] = base[pk]
      return q
    }, {})
  }

  async get (signal, opts = {}) {
    await this.#route.$ready
    const defaultOptions = { accept: 'single' }
    const { keepChanges, ...options } = Object.assign({}, defaultOptions, opts)

    const query = await this.createQueryFromPKs()
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
      Object.keys(this.#data).reduce((acc, key) => {
        if (this.#route.columns) {
          if (this.#route.columns.includes(key)) {
            acc[key] = this.#data[key]
          }
        } else {
          acc[key] = this.#data[key]
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

  async patch (signal, data = {}, opts) {
    await this.#route.$ready
    const defaultOptions = { return: 'representation' }
    const { columns, ...options } = Object.assign({}, defaultOptions, opts)

    const query = await this.createQueryFromPKs()
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
      Object.keys(this.#data.$diff).reduce((acc, key) => {
        if (this.#route.columns.includes(key)) {
          acc[key] = this.#data.$diff[key]
        }
        return acc
      }, {}),
      Object.keys(data).reduce((acc, key) => {
        if (data[key] !== undefined) {
          acc[key] = data[key]
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
    const query = await this.createQueryFromPKs()
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
