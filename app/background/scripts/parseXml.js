
const $ = require('jquery');

//
// parseOldXml
//// descr - 
//// @params
////   - data - data from request
////   - oldSlideXml - parsed xml document
//// @return
////   - xmlFromOldXml - object with all the necessary text strings to be loaded into new xml
function parseOldXml(slideType, oldSlideXml){
  //// PARSE OLD XML
  // get all text just in case
  // return the nodes that need to be searched for in the old xml document
  // get all nodes that fit specification in old xml
  // set finished xml object
  let searchNodes    = getConversionInfo(slideType);
  let specifiedNodes = findSpecifiedNodes(searchNodes, oldSlideXml);
  let newXmlObject   = getTextArray(specifiedNodes); 
  let oldXmlTextAll  = getAllXmlText(oldSlideXml); 

  console.log('--- oldXmlTextAll ---');
  console.log(oldXmlTextAll);
  let xmlFromOldXml = {
    ul                : newXmlObject.ul,
    ol                : newXmlObject.ol,
    other             : newXmlObject.other,
    allTextFromOldXml : oldXmlTextAll
  };
  
  return xmlFromOldXml;
}

//
// getAllXmlText
//// descr - grabs all text from old slide xml document
//// @params
////   - oldXml - DOM-like xml document
//// @return
////   - string of text from xml or an empty array
function getAllXmlText(oldXml){
  let xmlText = $(oldXml)[0].childNodes[0].textContent.trim();
  console.log('--- xmlText ---');
  console.log(xmlText);
  return xmlText ? [xmlText] : [];
}

//
// getConversionInfo
//// descr - gets necessary conversion information based on what conversion the user specified
//// @params
////   - slideType - string denoting the slide convesion type for the current old slide
//// @return
////   - an array of the nodes that will be searched for in the old xml document
function getConversionInfo(slideType){
  let nodes = [];
  switch(slideType.toLowerCase()){
  case "image":
    nodes = ['textItem', 'question', 'answer'];
    break;
  default:
    break;
  }
  return nodes;
}

//
// findSpecifiedNodes
//// descr - retrieves specified nodes from old xml document
//// @params
////   - nodes - array of strings with the names of the nodes to search for
////   - oldXml - the old slide xml document (DOM-like)
//// @return
////   - an array of found nodes
function findSpecifiedNodes(nodes, oldXml){
  //find all specified nodes for slide conversion type
  return nodes.map(nodeName => {
    return $(oldXml).find(nodeName);
  });
}

//
// getTextArray
//// descr - gets text from specific xml nodes and saves the text in new slide xml tags
//// @params
////   - nodes - jquery array of xml nodes
//// @return
////   - Object {
////   ul    : 'string of new slide xml bullet points',
////   ol    : 'string of new slide xml bullet points',
////   other : 'string of text nodes for new slide xml'
//// }
//TODO - store things in a better way than just ul, ol, and other. Update comments above as you go.
function getTextArray(nodes){
  let ul        = '',
      ol        = '',
      other     = '',
      questions = '',
      answers   = '';

  nodes[0].get().forEach(node => {
    if(node.textContent.includes('<ul>')) {
      ul    += `\n<BulletPoint id="bulletId">${node.textContent.replace(/<.+?>/g, '')}</BulletPoint>`;
    }
    else if(node.textContent.includes('ol')) {
      ol    += `\n<BulletPoint id="bulletId">${node.textContent.replace(/<.+?>/g, '')}</BulletPoint>`;
    }
    else {
      other += `\n<Text id="textId">${node.textContent.replace(/<.+?>/g, '')}</Text>`;
    }
  });
  return {ul, ol, other};
}

module.exports = parseOldXml;
