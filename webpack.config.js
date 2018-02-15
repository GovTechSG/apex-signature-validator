const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const path = require('path');

module.exports = (env = {}) => { // set env as empty object if unset from cli
    let config = {
        entry: {
            app: './src/app.js'
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name].bundle.js'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: path.resolve(__dirname, 'node_modules'),
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                [
                                    'babel-preset-env',
                                    {
                                        targets: {
                                            browsers: ['ie 11']
                                        }
                                    }
                                ]
                            ]
                        }
                    }
                },
                {
                    test: /\.(eot|otf|svg|ttf|woff|woff2)$/,
                    use: [
                        {
                            loader: 'url-loader',
                            options: {
                                limit: 8192 // byte limit to inline files as data URL
                            }
                        }
                    ]
                },
                {
                    test: /\.(png|jpg|gif)$/,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                name: '[name].[ext]',
                                outputPath: 'assets/'
                            }
                        }
                    ]
                },
                {
                    test: /\.css$/,
                    use: ExtractTextPlugin.extract(
                        {
                            use: 'css-loader',
                            fallback: 'style-loader'
                        }
                    )
                }
            ]
        },
        plugins: [
            new webpack.NoEmitOnErrorsPlugin(),
            new HtmlWebpackPlugin({
                title: 'Apex Signature Validator',
                template: 'index.ejs'
            }),
            new ExtractTextPlugin('[name].css'),
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify('development')
            })
        ],

        devServer: {
            contentBase: path.resolve(__dirname, 'dist')
        }
    };
    // Production only
    if (env.production) {
        config.plugins.push(new webpack.optimize.UglifyJsPlugin()); // minify js
        config.plugins.push(new OptimizeCssAssetsPlugin()); // minify css
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        })
    }

    return config;
};
