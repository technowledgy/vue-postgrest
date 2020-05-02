import Vue from 'vue'
import ObservableFunction from '@/ObservableFunction'
import { PrimaryKeyError } from '@/errors'
import { isEqual, isObject, syncObjects } from '@/utils'

class TrackedFunction extends Function {
  constructor (fn, cb, arg) {
    super('', 'arguments.callee._call(...arguments)')
    this._fn = fn
    this._cb = cb
    this._arg = arg
  }

  _call () {
    const ret = this._fn(...arguments)
    this._cb(this._arg)
    return ret
  }
}

class GenericModel {
  #route
  #select
  #diff = Vue.observable({})
  #resetCache = {}

  constructor (data, { route, select }) {
    this.#route = route
    this.#select = select
    // define isDirty here so this has the right context
    const isDirty = () => Object.keys(this.#diff).length > 0
    const obsDescriptors = Object.getOwnPropertyDescriptors(Vue.observable({
      $get: new ObservableFunction(this._get.bind(this)),
      $post: new ObservableFunction(this._post.bind(this)),
      $patch: new ObservableFunction(this._patch.bind(this)),
      $delete: new ObservableFunction(this._delete.bind(this)),
      get $isDirty () {
        return isDirty()
      }
    }))
    // set enumerable to false for all of the $ methods / props, otherwise setData / Vue.set will try to overwrite them
    for (const key in obsDescriptors) {
      obsDescriptors[key].enumerable = false
      obsDescriptors[key].configurable = false
    }
    Object.defineProperties(this, obsDescriptors)
    // re-target the Observer class to "this", to make Vue.set work
    this.__ob__.value = this
    // inject our own tracker to build #diff
    const tracker = (key) => {
      if (isEqual(this[key], this.#resetCache[key])) {
        Vue.delete(this.#diff, key)
      } else {
        Vue.set(this.#diff, key, this[key])
      }
    }
    this._track(this, tracker)
    this._setData(data)
  }

  _track (obj, notify, rootKey) {
    obj.__ob__.dep.addSub({
      update: () => {
        this._track(obj, notify, rootKey)
        if (rootKey) notify(rootKey)
      }
    })
    for (const key of Object.keys(obj)) {
      const prop = Object.getOwnPropertyDescriptor(obj, key)
      if (prop.set && !(prop.set instanceof TrackedFunction)) {
        prop.set = new TrackedFunction(prop.set, notify, rootKey || key)
        Object.defineProperty(obj, key, prop)
      }
      if (obj[key] && typeof obj[key] === 'object') {
        this._track(obj[key], notify, rootKey || key)
      }
    }
  }

  _setData (data, keepDiff = false) {
    syncObjects(this.#resetCache, data)
    const diff = syncObjects({}, this.#diff)
    syncObjects(this, data)
    if (keepDiff) {
      syncObjects(this, diff, false)
    }
  }

  $reset () {
    this._setData(this.#resetCache)
  }

  async _get (opts = {}) {
    const defaultOptions = { accept: 'single' }
    const { keepChanges, ...options } = Object.assign({}, defaultOptions, opts)

    const query = await this._createQueryFromPKs()
    if (this.#select) {
      query.select = this.#select
    }
    const resp = await this.#route.get(query, { ...options, accept: 'single' })
    const body = await resp.json()

    this._setData(body, keepChanges)
    return body
  }

  async _post (opts) {
    const defaultOptions = { return: 'representation', columns: Object.keys(this) }
    const { columns, ...options } = Object.assign({}, defaultOptions, opts)

    const query = {}
    if (options.return === 'representation' && this.#select) {
      query.select = this.#select
    }
    if (columns) {
      query.columns = columns
    }

    const resp = await this.#route.post(query, { ...options, accept: 'single' }, syncObjects({}, this)) // syncObject clone needed for test env
    const body = await resp.json()

    if (options.return === 'representation') {
      this._setData(body)
    } else {
      this.$reset()
    }
    return body
  }

  async _patch (data = {}, opts) {
    if (!isObject(data) || Array.isArray(data)) {
      throw new Error('Patch data must be an object.')
    }
    const patchData = Object.assign({}, this.#diff, Object.keys(data).reduce((acc, key) => {
      if (data[key] !== undefined) {
        acc[key] = data[key]
      }
      return acc
    }, {}))
    const defaultOptions = { return: 'representation', columns: Object.keys(patchData) }
    const { columns, ...options } = Object.assign({}, defaultOptions, opts)

    const query = await this._createQueryFromPKs()
    if (options.return === 'representation' && this.#select) {
      query.select = this.#select
    }
    if (columns) {
      query.columns = columns
    }

    // no empty requests
    if (Object.keys(patchData).length === 0) {
      return
    }

    const resp = await this.#route.patch(query, { ...options, accept: 'single' }, patchData)
    const body = await resp.json()

    if (options.return === 'representation') {
      this._setData(body)
    } else {
      this.$reset()
    }
    return body
  }

  async _delete (options = {}) {
    const query = await this._createQueryFromPKs()
    if (options.return === 'representation' && this.#select) {
      query.select = this.#select
    }

    const resp = await this.#route.delete(query, { ...options, accept: 'single' })
    return await resp.json()
  }

  async _createQueryFromPKs () {
    await this.#route.$ready
    if (this.#route.pks.length === 0) throw new PrimaryKeyError()
    return this.#route.pks.reduce((q, pk) => {
      if (this.#resetCache[pk] === undefined || this.#resetCache[pk] === null) {
        throw new PrimaryKeyError(pk)
      }
      q[pk + '.eq'] = this.#resetCache[pk]
      return q
    }, {})
  }
}

export default GenericModel
