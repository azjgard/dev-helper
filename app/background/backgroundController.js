const $      = require('jquery');
const global = {
  xml  : null,
  meta : null
};

// For parsing the old XML, everything is defined in "parse.config.json"
// in the 'app' folder. By adding to that JSON file, you can
// parse custom tags or increase the specifity of the attributes that are
// currently being parsed.
let parseConfig = require('../parse.config.json');

// The XML will always be received before the HTML.
// We always want to trigger the createSlide function when HTML is received,
// and we always want to use latest the XML that was received by the listener
// in xmlListener.js.
const receiveXml  = (xml)  => { global.xml  = xml;                 };
const receiveMeta = (meta) => { global.meta = meta; createSlide(); };

// These two are used at the end of the createSlide function
const middleware = require('../templates/common/dependencies.js');
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

  // This is built-in jQuery stuff to turn our raw XML string
  // into an actual jQuery object that is parseable like the  DOM
  // of an HTML page.
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
    XML                 : {},
    HTML		: meta.htmlText,
    Narration		: meta.narrationText,
    SlideID		: meta.slideId,
    SlideMeta		: meta.slideMeta,
    SlideAudio          : meta.slideAudio,
    SlidePercent	: meta.slidePercent
  };

  for (let key in parseConfig) {
    let tag       = parseConfig[key].tag;
    let regex     = new RegExp(parseConfig[key].regex, "ig");
    let attribute = parseConfig[key].attribute;

    if (regex && attribute) {
      info.XML[key] = extract(tag, regex, attribute);
    }
    else {
      info.XML[key] = extract(tag); 
    }
  }

  for (let key in info.XML) {
    if (info.XML[key].length === 0) info.XML[key] = undefined;
  }
  info.XML = JSON.parse(JSON.stringify(info.XML));

  // This is where the aggregated slide information gets passed
  // to the function which will populate the new XML with our
  // text and metadata, and then send to the views page for editing
  // and exporting. The module.exports of the middleware file
  // needs to have a property that matches any lowercase slideType.
  // IMPORTANT: error handling will be left to the individual middleware files.
  require('../templates/common/middlewareRouter.js')(info)
    .then(newXML => {
      let viewObject = {
	xml        : newXML.xml,
	text       : newXML.text,
	percentage : info.SlidePercent
      };

      sendToPage(viewObject);
    });
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
