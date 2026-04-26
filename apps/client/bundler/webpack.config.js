const { type } = require('os');
const path = require('path');

module.exports = {
  target: "node",
  entry: {
    app: ["./index.js"]
  },
  output: {
    path: path.resolve(__dirname, "./"),
    filename: "bundler.js",
    library: {
      name: 'bundled',
      type: 'commonjs2',
      export: 'default',
    } 
  },
};