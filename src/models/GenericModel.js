import wrap from '@/utils/wrap'
import superagent from 'superagent'

export default class {
  constructor (data, url, primaryKeys) {
    this.data = data
    this.url = url
    this.primaryKeys = primaryKeys
  }

  // we have to bind this for wrapped functions
  post = wrap(this._post.bind(this))
  patch = wrap(this._patch.bind(this))
  delete = wrap(this._delete.bind(this))

  _post () {

  }

  _patch () {

  }

  async _delete () {
    try {
      await superagent
        .delete(this.url)
        .query({ [this.primaryKeys[0]]: this.data[this.primaryKeys[0]] })
    } catch (e) {
      console.error(e)
    }
  }

  reset () {

  }
}
