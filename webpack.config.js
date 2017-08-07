const path    = require('path');
const appPath = (p) => path.resolve(__dirname, 'app', p);

const entry    = appPath('background/backgroundController.js');
const outPath  = appPath('output');
const filename = 'background.js';

const output = {
  path : outPath,
  filename,
  publicPath: 'output'
};

const loaders = [
  { 
    test   : /\.css$/,
    loader : 'style-loader!css-loader'
  },
  {
    test : /\.xml$/,
    use  : 'raw-loader'
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

