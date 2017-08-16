let createTemplate = require('./Template.js');
let route          = require('./dependencies.js');

module.exports = function(slideInfo) {
  return new Promise((resolve, reject) => {
    let slideType    = slideInfo.SlideMeta.slideType.toLowerCase();
    let templateName = route[slideType].name;
    let fn           = route[slideType].fn;

    let template = createTemplate(slideInfo, resolve, templateName);
    console.log(slideInfo);

    fn(template, slideInfo.SlideMeta);
  });
};
