let createTemplate = require('./Template.js');
let route          = require('./dependencies.js');

module.exports = function(slideInfo) {
  return new Promise((resolve, reject) => {
    let slideType    = slideInfo.SlideMeta.slideType.toLowerCase();
    let templateName = route[slideType].name;
    let fn           = route[slideType].fn;

    let template = createTemplate(slideInfo, resolve, templateName);

    // Call the function in the middleware.js file for the specified slideType (e.g. image).
    // You can access all the slide info in the middleware.js files if you pass in slideInfo instead of slideInfo.SlideMeta, otherwise all the slide info will only be available in Template.js
    fn(template, slideInfo.SlideMeta);
  });
};
