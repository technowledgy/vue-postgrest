const nodeExternals = require('webpack-node-externals')

module.exports = {
  productionSourceMap: false,
  configureWebpack: {
    output: {
      libraryExport: ''
    },
    externals: [nodeExternals()]
  }
}
