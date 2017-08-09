
var xmlDoc              = require('./background.js');
const parseOldXml         = require('./parseXml.js');
const slideTemplate       = require('../slideTemplates.js');
const getXmlFromHtml      = require('./parseHtml.js').getXmlFromHtml;
const getAllHtmlText      = require('./parseHtml.js').getAllHtmlText;
const addAllTextToNewXml  = require('./createNewXml.js');
const getSpecificHtmlText = require('./parseHtml.js').getSpecificHtmlText;

//
// getDataForFrontend
//
// descr - takes html data from old slide tab, parses html and xml, and creates new xml string to send to front end
// @params
//   - data = {
//   slideId       : slideID,
//   slidePercent  : slidePercent,
//   narrationText : narrationText
//   htmlText      : htmlText
// }
function getDataForFrontend(data){
  //// VARIABLES
  let oldSlideXml    = xmlDoc,
      html           = parseString(data.htmlText, 'text/html'), 
      newSlideXml    = newXmlTemplate(data.slideMeta.slideType), 
      oldXmlTextAll  = [],
      oldHtmlTextAll = [],
      newXmlObject   = '',
      specificHtml   = '',
      xmlFromHtml    = '';

  /// PARSE OLD XML
  if(oldSlideXml){
    newXmlObject = parseOldXml(data.slideMeta.slideType, oldSlideXml);
  }

  //// PARSE OLD HTML
  if(html){
    oldHtmlTextAll = getAllHtmlText(html); 
    specificHtml   = getSpecificHtmlText(html); 
    xmlFromHtml = getXmlFromHtml(specificHtml);
  }
  
  //ADD HTML, XML, AND NARRATION TO NEW XML STRING
  let xmlAndAllText = addAllTextToNewXml(newXmlObject, oldHtmlTextAll, xmlFromHtml, data.narrationText, newSlideXml);

  xmlDoc = null;

  //TODO - do we need to return data.slideId as well???
  return {
    xml          : xmlAndAllText.completedNewXml,
    text         : xmlAndAllText.allText,
    percentage   : data.slidePercent
  };
}

//
// newXmlTemplate
// descr - gets the correct template
// @params
//   - slideType = string that user provides that specifies slide conversion type
// @return
//   - string version of new slide xml template
function newXmlTemplate(slideType){
  let newSlideXml = slideTemplate[slideType.toLowerCase()];
  return parseString(newSlideXml, 'text/xml');
}

//
// parseString
//// descr - converts string version of a structure and returns a node tree structure
//// @params
////   - str - the string to convert
////   - conversion - string denoting the node tree structure to convert to (e.g. 'text/xml')
//// @return
////   - Node tree document
function parseString(str, conversion){
  if(str){
    let parser = new DOMParser();
    return parser.parseFromString(str, conversion);
  }
  else return null;
}

// function getNewXmlTextStrings(){
//   return {
//     bulletBegin : '<BulletPoint id="bulletId">',
//     bulletEnd   : '</BulletPoint>',
//     textBegin   : '<Text id="textId">',
//     textEnd     : '</Text>'
//   };
// }

module.exports = getDataForFrontend;
