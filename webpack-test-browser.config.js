var webpack = require('webpack');
var nodeExternals = require('webpack-node-externals');
var WebpackShellPlugin = require('webpack-shell-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

var config = {
  entry: './all-tests.js',
  output: {
    filename: 'test-browser-bundle.js'
  },
  target: 'web', // node | web
  // externals: [nodeExternals()],
  node: {
    fs: 'empty'
  },
  plugins: [
    new WebpackShellPlugin({
      onBuildExit: "start dist/mocha.html"
    }),
    new HtmlWebpackPlugin(
      {
        template: path.resolve(__dirname, 'src', 'app', 'mocha.html'),
        filename: "mocha.html",
        inject: true
      },
      new webpack.HotModuleReplacementPlugin()
    )
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor",
          chunks: "initial",
        },
      },
    },
  },
};

module.exports = config;
