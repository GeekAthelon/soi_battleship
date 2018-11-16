var webpack = require('webpack');
var nodeExternals = require('webpack-node-externals');
var WebpackShellPlugin = require('webpack-shell-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

var config = {
  entry: {
    runner: "./src/app/game-runner/runner.js",
    bsiframe: "./src/app/ts/main.js"
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].entry.js"
  },
  target: 'web', // node | web
  // externals: [nodeExternals()],
  node: {
    fs: 'empty'
  },
  plugins: [
    new WebpackShellPlugin({
    //  onBuildExit: "start dist/mocha.html"
    }),
    new HtmlWebpackPlugin(
      {
        template: path.resolve(__dirname, 'src', 'app', 'game-runner', 'bs-runner.html'),
        filename: "index.html",
        chunks: ['runner', 'vendor'],
        inject: true
      },
      new webpack.HotModuleReplacementPlugin()
    ),
    new HtmlWebpackPlugin(
      {
        template: path.resolve(__dirname, 'src', 'app', 'bs-iframe.html'),
        filename: "bs-iframe.html",
        chunks: ['bsiframe', 'vendor'],
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
