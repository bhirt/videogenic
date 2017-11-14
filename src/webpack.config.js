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
        loaders: [
            {
                test: /.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['env','stage-1','react']
                }
            }
        ]
    }
};
