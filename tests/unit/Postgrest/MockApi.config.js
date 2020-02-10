module.exports = function (mockData) {
  return [
    {
      pattern: 'api(.*)',
      fixtures: function (match, params, headers, context) {
        for (const endpoint in mockData.get) {
          if (match[1] === endpoint) {
            return headers['Accept'] === 'application/vnd.pgrst.object+json' ? mockData.get[endpoint][0] : mockData.get[endpoint]
          }
        }
      },

      get: function (match, data) {
        return data
      }
    }
  ]
}