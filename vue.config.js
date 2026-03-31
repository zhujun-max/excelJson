const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  // 部署到GitHub Pages子路径必须配置，否则静态资源404
  publicPath: process.env.NODE_ENV === 'production' ? '/excelJson/' : '/',
  transpileDependencies: true,
  devServer: {
    port: 8081, // Use a different port to avoid conflict if 8080 is taken
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  configureWebpack: {
    output: {
      library: `excel-json-tool-[name]`,
      libraryTarget: 'umd', // Bundle the library in UMD format
      chunkLoadingGlobal: `webpackJsonp_excel-json-tool`,
    },
  },
})
