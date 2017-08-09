
const $ = require('jquery');
//
// getAllHtmlText
//// descr - searches through the root children of the body for text and returns findings in an array
//// @params
////   - htmlDoc - document with a node tree (DOM-like structure)
//// @return
////   - an array text from the document
function getAllHtmlText(htmlDoc){
  // Grab all child elements of the body
  return Array.from($(htmlDoc.body)[0].children)
  // filter out the script and object tags
    .filter(element  => { return element.tagName !== 'script' && element.tagName !== 'object' ? true : false; })
  // return arrays of cleansed html text
    .map(element     => {
      return element.innerText
        .replace(/\/\/<!\[CDATA\[/g, '')
        .replace(/\/\/\]\]>/g, '')
        .replace(/[\w\d]+\(.*\);?/g, '')
        .replace(/function\s*{(?:\n|\r|\r\n)*\s*}/g, '')
        .replace(/[\n\r]+|(?:\r\n)+/g, '---')
        .replace(/\s{2,}/g, '')
        .trim()
        .split(/-{3,}/g)
        .filter(text => { return text != '' && !text.includes('Play Audiodocument'); })
        .map(text    => { return text.trim(); });
    })
  // remove empty arrays
    .filter(arr      => { return arr.length ? true : false; })
  // flatten the final array
    .reduce((a,b)    => { return a.concat(b); }, []);
}


//
// getSpecificHtmlText
//// descr - search for text from specified html elements and return object with text in it
//// @params
////   - htmlDoc - document with DOM-like structure
//// @return
////   - Object - {
////   content      : 'string of the main text from old slide',
////   header       : 'string of text with the header of the main text',
////   headerMargin : "string with text from the header of the main text if the normal header wasn't found"
//// }
function getSpecificHtmlText(htmlDoc){
  let html             = $(htmlDoc),
      contentText      = html.find('.regularcontenttext>ul'),
      headerText       = html.find('.headertext'),
      headerTextMargin = html.find('.headertexttopmargin'),
      content          = null,
      header           = null,
      headerMargin     = null;

  if(contentText.length){
    let lis      = Array.from(contentText[0].querySelectorAll('li'));
    content      = lis.map(li => { return li.textContent; }); 
  }
  if(headerText.length){
    header       = headerText[0].textContent.trim();
  }
  if(headerTextMargin.length){
    headerMargin = headerTextMargin[0].textContent.trim();
  }
  return {content, header, headerMargin};
}

//
// getXmlFromHtml
//// descr - take all specific html text and put it in xml tags
//// @params
////   - htmlText - {
////   content      : 'array of strings containing main text from old slide',
////   header       : 'string of text with the header of the main text',
////   headerMargin : "string with text from the header of the main text if the normal header wasn't found"
//// }
////   - newSlideXml - 'string of new xml template'
//// @return
////   - newXml - 'string of the new xml with html added to go to the frontend'
function getXmlFromHtml(htmlText){
  let bulletText = '',
      headerText = '';
  //get array of xml text
  if(htmlText.content){
    bulletText = htmlText.content
      .map(text             => { return `<BulletPoint id="bulletId">${text.trim()}</BulletPoint>`; })
      .reduce((accum, curr) => { return accum + curr; });
  }

  //get header in xml text
  if(htmlText.header)       { headerText = `<Text id="textId">${htmlText.header.trim()}</Text>`; }
  if(htmlText.headerMargin) { headerText = `<Text id="textId">${htmlText.headerMargin.trim()}</Text>`; }

  return {
    headerText,
    bulletText
  };
}

module.exports = {
  getSpecificHtmlText,
  getAllHtmlText,
  getXmlFromHtml
};
