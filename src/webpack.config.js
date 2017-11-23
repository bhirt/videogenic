const path = require('path');
const webpack = require('webpack');

module.exports = {
    devtool: "source-map",
    entry: {
            'edlcutter' : './react/entry/EDLCutter.jsx',
            'split' : './react/entry/Split.jsx'
           },
    output: { 
        filename: '[name].js',
        path: path.resolve(__dirname,'./dist/static/js'),
        sourceMapFilename: '[file].map'
    },
    resolve: {
        extensions: ['.js', '.jsx']
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: false,
                        presets: ['env','stage-1','react']
                    }
                }
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
    }
};
