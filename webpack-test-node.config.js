var webpack = require('webpack');
var nodeExternals = require('webpack-node-externals');
var WebpackShellPlugin = require('webpack-shell-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');


var config = {
  entry: './all-tests.js',
  output: {
    filename: 'test-bundle-node.js'
  },
  target: 'node', // node | web
  externals: [nodeExternals()],
  node: {
    fs: 'empty'
  },
  plugins: [
    new WebpackShellPlugin({
      onBuildExit: "npm run testbundle"
    })
  ]
};

module.exports = config;
