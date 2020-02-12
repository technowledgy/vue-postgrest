import wrap from '@/utils/wrap'

export default class {
  constructor (data, route, apiRoot) {
    this.data = data
    this.route = route
    this.apiRoot = apiRoot
  }

  post = wrap(this._post)
  patch = wrap(this._patch)
  delete = wrap(this._delete)

  _post () {

  }

  _patch () {

  }

  _delete () {

  }

  reset () {

  }
}