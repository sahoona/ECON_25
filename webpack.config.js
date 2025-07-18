const path = require('path');

module.exports = {
  entry: './assets/js/main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'assets/js/dist'),
  },
  resolve: {
    fullySpecified: false,
  },
};
