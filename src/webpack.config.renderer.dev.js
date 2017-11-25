const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const marked = require('marked');
const markdownRenderer = new marked.Renderer();

const hmr = [
    'react-hot-loader/patch',
    'webpack-hot-middleware/client?noInfo=false'
];


module.exports = {
    devtool: 'inline-source-map',
    entry: {
        'bundle' : hmr.concat(['./react/entry/App.jsx'])
    },
    output: { 
        filename: 'js/[name].js',
        path: path.resolve(__dirname,'./dist/static/'),
        publicPath: '/'
    },
    resolve: {
        extensions: ['.js', '.jsx']
    },
    module: {
        rules: [
            {
                test: /\.md$/,
                use: [
                    {
                        loader: 'html-loader'
                    },
                    {
                        loader: 'markdown-loader',
                        options: {
                            pedantic: true,
                            renderer: markdownRenderer
                        }                        
                    }
                ]
            },
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'react-hot-loader/webpack'
                    },
                    {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: false,
                            presets: ['env','stage-1','react']
                        }
                    } 
                ]
            },
            {
                test: /\.global\.css$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader',
                    }
                ]
            },
            {
                test: /^((?!\.global).)*\.css$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            sourceMap: true,
                            importLoaders: 1,
                            localIdentName: '[name]__[local]__[hash:base64:5]',
                        }
                    }
                ]
            },
            {
                test: /\.less$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            sourceMap: true,
                            importLoaders: 1,
                            localIdentName: '[name]__[local]__[hash:base64:5]',
                        }
                    },
                    {
                        loader: 'less-loader'
                    }
                ]
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin({
            filename: 'css/[name].css'
        }),

        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin()
        
    ]
};
