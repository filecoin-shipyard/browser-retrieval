const path = require('path');

module.exports = {
  mode: 'none',
  target: 'web',
  entry: './src/background.js',
  output: {
    filename: 'background.js',
    path: path.resolve(__dirname, 'build'),
  },
  devtool: 'source-map',
};
