const path = require('path');
const webpack = require('webpack');

const { getFileReplacementsRules } = require('./webpack.replacement.config');

module.exports = (env) => {
  const fileReplacements = getFileReplacementsRules();

  return {
    mode: 'none',
    target: 'web',
    entry: './src/background/index.js',
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
        ...fileReplacements,
      ],
    },
    plugins: [
      new webpack.EnvironmentPlugin({
        NODE_ENV: 'development',
        DEBUG: false,
      }),
    ],
    output: {
      filename: 'background.js',
      path: path.resolve(__dirname, 'build'),
    },
    devtool: 'source-map',
  };
};
