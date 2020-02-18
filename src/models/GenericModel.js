import PrimaryKeyError from '@/errors/PrimaryKeyError'
import FieldNotExistsError from '@/errors/FieldNotExistsError'
import wrap from '@/utils/wrap'
import superagent from 'superagent'
import Freezer from 'freezer-js'
import isObject from '@/utils/isObject'

export default class {
  constructor (data, url, primaryKeys) {
    this._parseData(data)
    this.url = url
    this.primaryKeys = primaryKeys
  }

  _parseData(data) {
    this._data = data || {}
    this._diff = {}
    this.data = {}
    this._frozenData = {}
    for (let prop in this._data) {
      if (isObject(this._data[prop])) {
        this._frozenData[prop] = this._createFreezer(prop, this._data[prop])
      }
      Object.defineProperty(this.data, prop, {
        get: () => {
          const ret = this._diff[prop] !== undefined ? this._diff[prop] : this._data[prop]
          if (isObject(ret)) {
            return this._frozenData[prop].get()
          }
          return ret
        },
        set: (val) => {
          if (isObject(val)) {
            if (this._frozenData[prop]) {
              this._frozenData[prop].set(val)
            } else {
              this._frozenData[prop] = this._createFreezer(prop, val)
            }
          } else if (val !== this._data[prop]) {
            this._diff[prop] = val
          } else {
            delete this._diff[prop]
          }
        },
        enumerable: true
      })
    }
    Object.seal(this.data)
  }

  _createFreezer (prop, data) {
    const freezer = new Freezer(data, { live: true })
    freezer.on('update', (cur) => {
      this._diff[prop] = cur
    })
    return freezer
  }

  // we have to bind this for wrapped functions
  post = wrap(this._post.bind(this))
  patch = wrap(this._patch.bind(this))
  delete = wrap(this._delete.bind(this))

  _post () {

  }

  async _patch (data = {}, opt) {
    const defaultOptions = { sync: true }
    const options = Object.assign({}, defaultOptions, opt)
    // TODO: check what changed and set data, throw on relevant conditions
    if (!isObject(data) || Array.isArray(data)) {
      throw new Error('Patch data must be an object.')
    }
    const patchData = Object.assign({}, this._diff, data)
    if (Object.keys(patchData).length === 0) {
      return
    }
    if (options.sync) {
      const ret = await superagent
        .patch(this.url)
        .query(this.createQuery())
        .set('Prefer', 'return=representation')
        .send(patchData)
      this._parseData(ret.body[0])
    } else {
      await superagent
        .patch(this.url)
        .query(this.createQuery())
        .set('Prefer', 'return=minimal')
        .send(patchData)
    }
    this.reset()
  }

  async _delete () {
    await superagent
      .delete(this.url)
      .query(this.createQuery())
  }

  reset () {
    this._diff = {}
  }

  createQuery () {
    return this.primaryKeys.reduce((q, pk) => {
      if (this.data[pk] === undefined) {
        throw new PrimaryKeyError(pk)
      }
      q[pk] = this.data[pk]
      return q
    }, {})
  }
}
