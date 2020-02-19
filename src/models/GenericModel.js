import PrimaryKeyError from '@/errors/PrimaryKeyError'
import FieldNotExistsError from '@/errors/FieldNotExistsError'
import wrap from '@/utils/wrap'
import Freezer from 'freezer-js'
import isObject from '@/utils/isObject'

export default class {
  constructor (data, primaryKeys, requestCB) {
    this.request = requestCB
    this.primaryKeys = primaryKeys
    this._parseData(data)
  }

  _parseData(data) {
    // parse the instance data
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

    // update the query
    this.query = this.primaryKeys.reduce((q, pk) => {
      if (this._data[pk] === undefined) {
        throw new PrimaryKeyError(pk)
      }
      q[pk] = 'eq.' + this._data[pk]
      return q
    }, {})
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
    if (!isObject(data) || Array.isArray(data)) {
      throw new Error('Patch data must be an object.')
    }
    const patchData = Object.assign({}, this._diff, data)
    if (Object.keys(patchData).length === 0) {
      return
    }
    const ret = await this.request('PATCH', this.query, { representation: options.sync }, patchData)
    if (options.sync && ret && ret.body) {
      this._parseData(ret.body[0]) 
    }
    this.reset()
  }

  async _delete () {
    await this.request('DELETE', this.query)
  }

  reset () {
    this._diff = {}
  }
}
