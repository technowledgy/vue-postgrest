import superagent from 'superagent'

export default {
  cache: {},
  resetCache () {
    this.cache = {}
  },
  async getPrimaryKeys (apiRoot) {
    if (!this.cache[apiRoot]) {
      await this._getSchema(apiRoot) 
    }
    return this.cache[apiRoot]
  },
  async _getSchema (apiRoot) {
    const resp = await superagent.get(apiRoot) 
    if (resp && resp.headers['content-type'] === 'application/openapi+json' && resp.body) {
      this.cache[apiRoot] = resp.body.definitions ? this._extractPrimaryKeys(resp.body.definitions) : {}
    } else {
      // TODO: emit not an api error
    }
  },
  _extractPrimaryKeys (def) {
    let keys = {}
    Object.keys(def).map(table => {
      keys[table] = def[table].required 
    })
    return keys
  }
}