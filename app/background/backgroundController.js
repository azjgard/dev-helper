const $      = require('jquery');
const global = {
  xml  : null,
  meta : null
};

// the XML will always be received before the HTML. The HTML can be received
// either automatically (via slide navigation) or manually (triggered by button click).
// We always want to trigger the createSlide function when HTML is received,
// and we always want that function to use the XML that was last received.
const receiveXml  = (xml)  => { global.xml  = xml;                 };
const receiveMeta = (meta) => { global.meta = meta; createSlide(); };

const listenForXml = require('./listenForXml.js' )(receiveXml);

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (request.message === 'new-html-page') receiveMeta(request.data);
  }
);

function createSlide() {
  let xml    = global.xml;
  let meta   = global.meta;

  let xmlDoc = $.parseXML(xml);
  let $xml   = $(xmlDoc);

  const extract = (selector, regexp, attribute) =>
	  extractElementFromDocument($xml, selector, regexp, attribute);

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
      'textItem'      : extract('textItem'),
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
    if (info.XML[key].length === 0) {
      info.XML[key] = undefined;
    }
  } info = JSON.parse(JSON.stringify(info));

  console.log('Slide Info:', info);
  console.log('----------------------');

  // TODO: grab the appropriate new XML template
  // TODO: fill in the new XML template with the parsed text
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
	element : $(this),
	text    : text
      });
    }
  });

  return arr;
}
