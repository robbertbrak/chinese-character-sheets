var webpack = require('webpack');
var path = require('path');
var buildPath = path.resolve(__dirname, 'build');
var nodeModulesPath = path.resolve(__dirname, 'node_modules');
var TransferWebpackPlugin = require('transfer-webpack-plugin');

var config = {
  entry: {
    app: [path.join(__dirname, '/src/app/app.jsx')],
    vendor: ['react', 'pdfkit']
  },
  resolve: { extensions: ['', '.js', '.jsx']},
  output: { path: buildPath, filename: 'app.js'},
  plugins: [
    new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false}}),
    new webpack.NoErrorsPlugin(),
    new TransferWebpackPlugin([{from: 'www'}], path.resolve(__dirname,'src')),
    new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.bundle.js')
  ],
  module: {
    preLoaders: [
      {
        test: /\.(jsx)$/,
        loader: 'eslint-loader',
        include: [path.resolve(__dirname, 'src/app')],
        exclude: [nodeModulesPath]
      },
    ],

    loaders: [
      { test: /\.(jsx)$/, loaders: ['babel'], exclude: [nodeModulesPath]},
      { test: /\.less$/, loader: 'style!css!less' },
      { test: /\.json$/, loaders: ['json']},
      { test: /fzcs-pdfkit-fontkit|pdfkit|fontkit|unicode-trie|unicode-properties|png-js/, loader: 'transform?brfs' },
      { test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: 'url-loader?limit=100000' }
    ]
  },
  eslint: { configFile: '.eslintrc'},
};

module.exports = config;
