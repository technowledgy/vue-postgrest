module.exports = function (mockData) {
  return [
    {
      pattern: 'api(.*)',
      fixtures: function (match, params, headers, context) {
        for (const endpoint in mockData.get) {
          if (match[1] === endpoint) {
            const resp = {
              body: [],
              headers: {}
            }
            resp.body = headers['Accept'] === 'application/vnd.pgrst.object+json' ? mockData.get[endpoint][0] : mockData.get[endpoint]
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
      },

      get: function (match, data) {
        return data
      }
    }
  ]
}