const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    host: '0.0.0.0',
    port: 8080, // CHANGE YOUR PORT HERE!
    https: true,
  },
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.csv$/,
          use: 'raw-loader',
        },
      ],
    },
  },

})
