let $ = require('jquery');

const setClosedCaptions = ($templateObject, ccText) => $templateObject.find('Instructions').text(ccText);

const getSlideHTML = $templateObject => $templateObject.find('Slide')[0].outerHTML;

const initializeTemplate = (xmlString, slideInfo) => {
  let template    = ($.parseXML(xmlString));
  let $template   = $(template);

  // TODO: add actions that will occur on every single slide here

  setClosedCaptions($template, slideInfo.Narration);

  // ----------

  return $template;
};

module.exports = {
  getSlideHTML,
  initializeTemplate
};
