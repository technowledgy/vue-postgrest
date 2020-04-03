import superagent from 'superagent'

export default {
  cache: {},
  resetCache () {
    this.cache = {}
  },
  async getPrimaryKeys (apiRoot, token = 'anonymous') {
    if (!this.cache[apiRoot] || !this.cache[apiRoot][token]) {
      await this._getSchema(apiRoot, token)
    }
    return this.cache[apiRoot][token]
  },
  async _getSchema (apiRoot, token) {
    let resp
    if (token === 'anonymous') {
      resp = await superagent.get(apiRoot)
    } else {
      resp = await superagent.get(apiRoot).set({ authorization: `Bearer ${token}` })
    }
    if (resp && resp.headers['content-type'].startsWith('application/openapi+json') && resp.body && resp.body.definitions) {
      if (!this.cache[apiRoot]) {
        this.cache[apiRoot] = {}
      }
      this.cache[apiRoot][token] = this._extractPrimaryKeys(resp.body.definitions)
    } else {
      throw new Error('Not an api.')
    }
  },
  _extractPrimaryKeys (def) {
    const pks = {}
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
