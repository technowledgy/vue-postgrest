module.exports = function (mockData) {
  return [
    {
      pattern: 'api(.*)',
      fixtures: function (match, params, headers, context) {
        for (const endpoint in mockData.data) {
          if (match[1].split('?')[0] === endpoint) {
            const resp = {
              body: [],
              headers: {}
            }
            if (context.method === 'get') {
              resp.body = mockData.data[endpoint].get
            } else if (context.method === 'patch') {
              // only supports one primary key of type int atm
              const pk = match[1].replace(endpoint, '').split('?')[1].split('=')
              const patchedData = mockData.data[endpoint].patch.reduce((agg, item) => {
                if (item[pk[0]] === parseInt(pk[1])) {
                  agg.push(Object.assign({}, item, params))
                }
                return agg
              }, [])
              resp.body = headers['Prefer'] === 'return=representation' ? patchedData : []
            }
            if (headers['Accept'] === 'application/vnd.pgrst.object+json') {
              resp.body = resp.body[0]
            }
            if (headers.Range && Array.isArray(resp.body)) {
              resp.headers['Range-Unit'] = 'items'
              // setting content range properly to actual returned range not neccessary for the simple test cases
              const range = headers.Range.split('-')
              const retRange = range[1] ? range.join('-') : [range[0], resp.body.length].join('-')
              resp.headers['Content-Range'] = headers.Prefer === 'count=exact' ? retRange + '/' + resp.body.length : retRange + '/*'
              resp.body = resp.body.slice(...range)
            }
            return resp
          }
        }

        if (match[1] === '/404') {
          throw new Error(404)
        }
        if (match[1] === '/') {
          return {
            body: mockData.docs || undefined,
            headers: {
              'content-type': 'application/openapi+json'
            }
          }
        }
      },

      get: function (match, data) {
        return data
      },

      delete: function (match, data) {
        return
      },

      patch: function (match, data) {
        return data
      }
    }
  ]
}