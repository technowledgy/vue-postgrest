import superagent from 'superagent'

export default {
  cache: {},
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
    // TODO: error handling
    let resp
    try {
      resp = await superagent.get(apiRoot) 
    } catch (e) {
      if (e.errno && e.errno === 'ECONNREFUSED') {
        // TODO: emit not an api error
      } else {
        throw e
      }
    }
    if (resp && resp.headers['content-type'] !== 'application/openapi+json') {
      resp = undefined
      // TODO: emit not an api error
    }
    this.cache[apiRoot] = resp && resp.body
  }
}