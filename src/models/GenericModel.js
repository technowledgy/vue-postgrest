import PrimaryKeyError from '@/errors/PrimaryKeyError'
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
    const query = this.primaryKeys.reduce((q, pk) => {
      if (this.data[pk] === undefined) {
        throw new PrimaryKeyError(pk)
      }
      q[pk] = this.data[pk]
      return q
    }, {})
    await superagent
      .delete(this.url)
      .query(query)
  }

  reset () {

  }
}
