const webpack = require('webpack');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const version = require('./package.json').version;
const path = require('path');

module.exports = (env = {}) => { // set env as empty object if unset from cli
    let mode;
    if (env.production || env.devbuild) { mode = 'production'; }
    else { mode = 'development'; }

    let config = {
        mode: mode,
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
                                    '@babel/preset-env',
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
                    test: /\.(png|jpg|gif|eot|otf|svg|ttf|woff|woff2)$/,
                    use: [{
                        loader: 'url-loader',
                        options: {
                            limit: 8192, // byte limit to inline files as data URL
                            name: 'assets/[name].[ext]' // path to file for file-loader fallback
                        }
                    }]
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader']
                },
                {
                    test: /\.html$/,
                    use: {
                        loader: 'html-loader',
                        options: {
                            removeComments: true,
                            collapseWhitespace: true
                        }
                    }
                }
            ]
        },
        plugins: [
            new webpack.DefinePlugin({
                'VERSION': JSON.stringify(version)
            }),
            new HtmlWebpackPlugin({
                title: 'Apex Signature Validator',
                template: 'index.ejs',
            })
        ],
        optimization: {
            splitChunks: {
                chunks: 'all'
            }
        },
        devServer: {
            contentBase: path.resolve(__dirname, 'dist')
        }
    };

    if (env.production) {
        // PRODUCTION
        config.plugins.push(new OptimizeCssAssetsPlugin()); // minify css
    }
    return config;
};