const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'app.bundle.js'
    },
    devServer: {
        contentBase: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.optimize.UglifyJsPlugin(),
        new ExtractTextPlugin('stylesheets/[name].css'),
        new OptimizeCssAssetsPlugin(),
        new HtmlWebpackPlugin({
            template: 'index.ejs'
        })
    ],
    module: {
        loaders: [
            {
                test: /\.(png|svg|jpg|gif|woff|woff2|eot|ttf|otf)$/,
                loader: 'url-loader?limit=100000'
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract(
                    {
                        fallback: 'style-loader',
                        use: 'css-loader'
                    }
                )
            }
        ]
    }
};