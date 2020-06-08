import Vue from 'vue'
import ObservableFunction from '@/ObservableFunction'
import { PrimaryKeyError } from '@/errors'
import { cloneDeep, isEqual, syncObjects } from '@/utils'

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
  #enableTrack

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
    this._setData(data)
  }

  _track (obj, notify, rootKey) {
    obj.__ob__.dep.addSub({
      update: () => {
        if (this.#enableTrack) {
          this._track(obj, notify, rootKey)
          if (rootKey) notify(rootKey)
        }
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
    this.#enableTrack = false
    this.#resetCache = cloneDeep(data)
    if (keepDiff) {
      const diff = cloneDeep(this.#diff)
      syncObjects(this, data)
      syncObjects(this, diff, false)
    } else {
      syncObjects(this, data)
    }
    this.#enableTrack = true
    // inject our own tracker to build #diff
    const tracker = (key) => {
      if (isEqual(this[key], this.#resetCache[key])) {
        Vue.delete(this.#diff, key)
      } else {
        Vue.set(this.#diff, key, this[key])
      }
    }
    this._track(this, tracker)
  }

  $reset () {
    syncObjects(this, this.#resetCache)
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
    const defaultOptions = { return: 'representation' }
    const { columns, ...options } = Object.assign({}, defaultOptions, opts)

    const query = {}
    if (options.return === 'representation' && this.#select) {
      query.select = this.#select
    }
    if (columns) {
      query.columns = columns
    }

    const resp = await this.#route.post(query, { ...options, accept: 'single' }, syncObjects({}, this)) // syncObject clone needed for test env

    if (options.return === 'representation') {
      const body = await resp.json()
      this._setData(body)
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

  async _patch (data = {}, opts) {
    if (!data || typeof data !== 'object') {
      throw new Error('Patch data must be an object.')
    }
    const patchData = Object.assign({}, this.#diff, Object.keys(data).reduce((acc, key) => {
      if (data[key] !== undefined) {
        acc[key] = data[key]
      }
      return acc
    }, {}))
    const defaultOptions = { return: 'representation' }
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

    if (options.return === 'representation') {
      const body = await resp.json()
      this._setData(body)
      return body
    }
  }

  async _delete (options = {}) {
    const query = await this._createQueryFromPKs()
    if (options.return === 'representation' && this.#select) {
      query.select = this.#select
    }

    const resp = await this.#route.delete(query, { ...options, accept: 'single' })

    if (options.return === 'representation') {
      const body = await resp.json()
      this._setData(body)
      return body
    }
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
