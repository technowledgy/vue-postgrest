import superagent from 'superagent'

export default {
  // TODO: do not cache the whole schema
  cache: {},
  resetCache () {
    this.cache = {}
  },
  async getPrimaryKeys (apiRoot) {
    if (!this.cache[apiRoot]) {
      await this._getSchema(apiRoot) 
    }
    let keys = {}
    if (this.cache[apiRoot] && this.cache[apiRoot].definitions) {
      Object.keys(this.cache[apiRoot].definitions).map(table => {
        keys[table] = this.cache[apiRoot].definitions[table].required 
      })
    }
    return keys
  },
  async _getSchema (apiRoot) {
    const resp = await superagent.get(apiRoot) 
    if (resp && resp.headers['content-type'] === 'application/openapi+json') {
      this.cache[apiRoot] = resp.body
    } else {
      // TODO: emit not an api error
    }
  }
}