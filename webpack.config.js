const path    = require('path');
const appPath = (p) => path.resolve(__dirname, 'app', p);

const entry = {
  background : appPath('background/backgroundController.js'),
  content    : appPath('content/contentController.js')
};

const outPath  = appPath('output');
const filename = '[name].js';

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

