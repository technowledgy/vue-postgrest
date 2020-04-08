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
            }
            if (headers.accept === 'application/vnd.pgrst.object+json') {
              resp.body = resp.body[0]
            }
            if (headers.range && Array.isArray(resp.body)) {
              resp.headers['range-unit'] = 'items'
              // setting content range properly to actual returned range not neccessary for the simple test cases
              const range = headers.range.split('-')
              const retRange = range[1] ? range.join('-') : [range[0], resp.body.length].join('-')
              const prefer = headers.prefer ? headers.prefer.split(',') : []
              resp.headers['content-range'] = prefer.includes('count=exact') ? retRange + '/' + resp.body.length : retRange + '/*'
              resp.body = resp.body.slice(...range)
            }
            if (headers.authorization) {
              const token = headers.authorization.replace('Bearer ', '')
              if (token === 'expired') {
                resp.body = {}
                resp.headers['www-authenticate'] = 'Bearer error="invalid_token", error_description="JWT expired"'
                const newErr = new Error(401)
                newErr.response = resp
                throw newErr
              }
            }
            return resp
          }
        }

        if (match[1] === '/404') {
          throw new Error(404)
        }
        if (match[1] === '/') {
          return {
            body: mockData.docs || { definitions: {} },
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

      },

      patch: function (match, data) {
        return data
      },

      post: function (match, data) {
        return data
      }
    },
    {
      pattern: 'other-server(.*)',
      fixtures: function (match, params, headers, context) {
        if (match[1] === '/') {
          return {
            body: {},
            headers: {
              'content-type': 'application/json'
            }
          }
        }
      },

      get: function (match, data) {
        return data
      }
    }
  ]
}
