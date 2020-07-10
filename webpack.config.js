const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'none',
  target: 'web',
  entry: './src/background.js',
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  plugins: [new webpack.EnvironmentPlugin(['DEBUG'])],
  output: {
    filename: 'background.js',
    path: path.resolve(__dirname, 'build'),
  },
  devtool: 'source-map',
};
