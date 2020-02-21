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
    if (resp && resp.headers['content-type'].startsWith('application/openapi+json') && resp.body && resp.body.definitions) {
      this.cache[apiRoot] = this._extractPrimaryKeys(resp.body.definitions)
    } else {
      throw new Error('Not an api.')
    }
  },
  _extractPrimaryKeys (def) {
    let pks = {}
    Object.keys(def).map(table => {
      Object.keys(def[table].properties).map(key => {
        if (def[table].properties[key].description && def[table].properties[key].description.includes('<pk/>')) {
          if (!pks[table]) {
            pks[table] = []
          }
          pks[table].push(key)
        }
      })
    })
    return pks
  }
}
