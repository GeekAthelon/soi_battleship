

/*
 npm --save-dev install node-sass webpack-md5-hash css-loader  style-loader sass-loader url-loader file-loader html-webpack-plugin mini-css-extract-plugin clean-webpack-plugin
*/

// webpack v4
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackMd5Hash = require('webpack-md5-hash');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CleanWebpackPlugin = require('clean-webpack-plugin');
module.exports = {
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
    module: {
        rules: [
            // {
            //     test: /\.js$/,
            //     exclude: /node_modules/,
            //     use: {
            //         loader: "babel-loader"
            //     }
            // },
            // {
            //     test: /\.scss$/,
            //     use: ['style-loader', MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader']
            // }
            {
                test: /\.scss$/,
                use: ['style-loader', 'css-loader', 'sass-loader']
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 5000
                        }
                    }
                ]
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin('dist', {}),
        new MiniCssExtractPlugin({
            filename: 'style.[contenthash].css',
        }),
        new HtmlWebpackPlugin(
            {
                template: path.resolve(__dirname, 'src', 'app', 'game-runner', 'bs-runner.html'),
                filename: "index.html",
                chunks: ['runner', 'vendor'],
                inject: true,
                hash: true
            },
            new WebpackMd5Hash()
        ),
        new HtmlWebpackPlugin(
            {
                template: path.resolve(__dirname, 'src', 'app', 'bs-iframe.html'),
                filename: "bs-iframe.html",
                chunks: ['bsiframe', 'vendor'],
                inject: true,
                hash: true
            },
            new WebpackMd5Hash()
        )
    ]
};

// new WebpackMd5Hash()