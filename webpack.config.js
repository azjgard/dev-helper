const path = require('path');

const entry =
  path.resolve(__dirname, 'background/backgroundController.js');

const outPath  = path.resolve(__dirname, 'output');
const filename = 'background.js';

const output = {
  path : outPath,
  filename
};

const loaders = [
  { 
    test   : /\.css$/,
    loader : 'style-loader!css-loader'
  }
];

const modules = {
  loaders
};

module.exports = {
  entry  ,
  output ,
  module : modules
};
