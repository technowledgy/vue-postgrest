const nodeExternals = require('webpack-node-externals')

module.exports = {
  configureWebpack: {
    output: {
      libraryExport: 'default'
    },
    target: 'node',
    externals: [nodeExternals()]
  }
}
