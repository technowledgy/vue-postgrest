import wrap from '@/utils/wrap'
import superagent from 'superagent'

export default class {
  constructor (data, url, primaryKeys) {
    this.data = data
    this.url = url
    this.route = url.split('/')[url.split('/').length - 1]
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
      let query = {}
      for (let pk of this.primaryKeys[this.route]) {
        query[pk] = this.data[pk]
      }
      await superagent
        .delete(this.url)
        .query(query)
    } catch (e) {
      console.error(e)
    }
  }

  reset () {

  }
}
