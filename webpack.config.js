const path = require('path');

module.exports = {
  entry: './src/index.js',
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['.js'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
};