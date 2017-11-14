const path = require('path');
const webpack = require('webpack');

module.exports = {
    devtool: "source-map",
    entry: './app.js',
    output: { 
        filename: 'express-app.js',
        path: path.resolve(__dirname,'./dist'),
        sourceMapFilename: '[file].map'
    },
    resolve: {
        extensions: ['.js']
    },
    module: {
        loaders: [
            {
                test: /.js$/,
                loader: 'babel-loader',
                query: {
                    presets: ['env','stage-1']
                }
            }
        ]
    }
};
