const $      = require('jquery');
const global = {
  xml  : null,
  meta : null
};

// The XML will always be received before the HTML.
// We always want to trigger the createSlide function when HTML is received,
// and we always want to use latest the XML that was received by the listener
// in xmlListener.js.
const receiveXml  = (xml)  => { global.xml  = xml;                 };
const receiveMeta = (meta) => { global.meta = meta; createSlide(); };

// These two are used at the end of the createSlide function
const middleware = require('../templates/common/include_template.js');
const sendToPage = require('./scripts/pageHandler.js');

// These two blocks work in conjunction with one another.
// The first passes receiveXml as a callback to a function
// in another file that is watching the resources being loaded on the page.
// The function will be called when a resource is loaded that has relevant
// slide text data. The second listens for a message sent from the content scripts
// with any HTML text on the slide, as well as all of the slide metadata.
const xmlListener = require('./scripts/xmlListener.js' )(receiveXml);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'new-html-page') receiveMeta(request.data);
  }
);

function createSlide() {
  let xml    = global.xml;
  let meta   = global.meta;

  let xmlDoc = $.parseXML(xml);
  let $xml   = $(xmlDoc);

  let type = meta.slideMeta.slideType.toLowerCase();

  const extract = (selector, regexp, attribute) =>
	  extractElementFromDocument($xml, selector, regexp, attribute);

  // we want to exit function execution if the popup prompt is closed without
  // the user having selected any values
  if (!meta || !meta.slideMeta || !meta.slideMeta.slideType) return;

  // parsing by html tag should be done on a "per slide type" basis. for example:

  // on an image slide, let's say that we know that we need to populate a "Header"
  // tag and we need to populate a few BulletPoint tags. In the old slide XML,
  // the header and the bullet points both are in textItem tags with the Instructions
  // attribute, HOWEVER, the title is inside of <b> tags. We would parse the one
  // with <b> tags, use that as the Header, and use whatever is left over as
  // the BulletPoint tags.

  // we want to combine data from the backend and the frontend into
  // one parsable object, in addition to extracting the XML from the
  // document that the backend gave us
  let info = {
    XML: {
      'textItems'     : extract('textItem'),
      'callouts'      : extract('textItem', /^callout/i      , 'title'),
      'descriptions'  : extract('textItem', /^description/i  , 'title'),
      'instructions'  : extract('textItem', /instructions/i  , 'title'),
      's'	      : extract('textItem', /s\d{1,}_\d{1,}/ , 'title'), 
      'feedback'      : extract('textItem', /feedback/i      , 'title'),
      'questions'     : extract('question', /question\stext/i, 'title'),
      'answers'       : extract('answer'  , /answer\stext/i  , 'title'),
      'buttonText'    : extract('text'    , /for\sbutton/i   , 'title'),
      'sceneText'     : extract('textItem', /scene\stext/i   , 'title'),
      'objectives'    : extract('textItem', /objective/i     , 'title'),
      'tabTitles'     : extract('textItem', /tab\stitle/i    , 'title')
    },
    HTML		: meta.htmlText,
    Narration		: meta.narrationText,
    SlideID		: meta.slideId,
    SlideMeta		: meta.slideMeta,
    SlidePercent	: meta.slidePercent
  };

  // This is to remove any elements of the XML object
  // that come back with a length of 0 (meaning the extract
  // function didn't find any XML nodes that matched what we told
  // it to look for)
  for (let key in info.XML) {
    if (info.XML[key].length === 0) { info.XML[key] = undefined; }
  }
  info = JSON.parse(JSON.stringify(info));

  console.log('XML Text '+ info.SlidePercent + ':', info.XML);
  console.log('---------');

  // This is where the aggregated slide information gets passed
  // to the function which will populate the new XML with our
  // text and metadata, and then sent to the views page for editing
  // and exporting. The module.exports of the middleware file
  // needs to have a property that matches any lowercase slideType
  try { var newXML = middleware[type](info); }
  catch (e) {
    console.log('That type has not yet been defined!');
    throw new Error(e);
    return;
  }

  let viewObject = {
    xml        : newXML,
    text       : ['these', 'are', 'some', 'words'],
    percentage : info.SlidePercent
  };

  sendToPage(viewObject);
}

function extractElementFromDocument($xmlDoc, selector, regexp, attribute) {
  let $elements = $xmlDoc.find(selector);
  let arr       = [];
  
  if (regexp && attribute) {
    $elements = $elements.filter(function(index) {
      let exists = $(this).attr(attribute); 
      let match  = exists && $(this).attr(attribute).match(regexp);
      return match;
    });
  }

  $elements.each(function(index) {
    let text = $(this).text().trim();

    if (text.length > 0) {
      arr.push({
	title : $(this).attr('title'),
	text  : text
      });
    }
  });

  return arr;
}
