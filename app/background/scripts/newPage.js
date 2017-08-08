///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
////
//// Filename: newPage.js
//// Description: parses xml and html to put into new templates for BMS engine
//// Contributers: Mitchell Sotto, Jordin Gardner
//// Keywords: TODO
//// 
//// Features that might be required by this library:
////
////   None
////
///////////////////////////////////////////////////////////////////////////
//// 
//// Commentary: 
//// 
////   New Section comes when there is are navigation markers and when transitioning to new set of navigation markers

          //glossary
          //chapter name is same as the course
          //title and subtitle
          //audio is same as lesson id
          //leave the Image tag as is to signal to bms that they need to get the assets
          // don't worry about getting image callouts and things that will be placed in images
          // Instructions line endings uniform
          //bullets fade on for half a second starting at .5 seconds. Headers with fade in for 1 second starting at 0.
          // put 'check answers' into single quotes.
          // to character long blanks for certain questions __________
//// 
///////////////////////////////////////////////////////////////////////////
//// 
//// Change log:
//// 
////   None
//// 
///////////////////////////////////////////////////////////////////////////
//// 
//// This program is free software; you can redistribute it and/or
//// modify it under the terms of the GNU General Public License as
//// published by the Free Software Foundation; either version 3, or
//// (at your option) any later version.
//// 
//// This program is distributed in the hope that it will be useful,
//// but WITHOUT ANY WARRANTY; without even the implied warranty of
//// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
//// General Public License for more details.
//// 
//// You should have received a copy of the GNU General Public License
//// along with this program; see the file COPYING.  If not, write to
//// the Free Software Foundation, Inc., 51 Franklin Street, Fifth
//// Floor, Boston, MA 02110-1301, USA.
//// 
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
//

const $ = require('jquery');
const slideTemplate = require('../slideTemplates.js');

module.exports = function() {
  const htmlPageURL = chrome.runtime.getURL('page/xml-builder.html');

  /////////////////////////////////////////////////////////////////////
  //// promisified chrome.tabs.query
  /////////////////////////////////////////////////////////////////////
  const queryTabs = options => new Promise((resolve, reject) => chrome.tabs.query(options, resolve));
  const getTabByUrlPattern = (tabs, url) => new Promise((resolve, reject) => resolve(tabs.filter(tab => tab.url.includes(url))));
  const createXmlPage = xmlPageIsOpen => new Promise((resolve, reject) => {
    // if it's not already open, create it
    if (!xmlPageIsOpen)
      chrome.tabs.create({ url : htmlPageURL }, resolve);
    // if it's already open, make it the active tab
    else {
      chrome.tabs.query({}, function(tabs) {
        for (var i = 0; i < tabs.length; i++) {
          if (tabs[i].url === htmlPageURL) {
            chrome.tabs.update(tabs[i].id, { active : true }, resolve);
          }
        }
      });
    }
  });

  /////////////////////////////////////////////////////////////////////
  //// Listener for messages
  /////////////////////////////////////////////////////////////////////
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

      let msg = request.message;
      let data = request.data;

      if (msg == 'new-html-page') {
        // requeste.data : {
        //   slideId       : slideID,
        //   slidePercent  : slidePercent,
        //   narrationText : narrationText
        //   htmlText      : htmlText
        // }

        let newData = getDataForFrontend(data); console.log("newData", newData);
        addSlideToHtmlPage(newData);
      }
    });

  function getDataForFrontend(data){
    //// VARIABLES
    let newSlideXml    = newXmlTemplate(data.slideType), //console.log("newSlideXml", newSlideXml);,
        oldSlideXml    = getOldXml(), //console.log("oldSlideXml", oldSlideXml);,
        oldXmlTextAll  = [],
        newXmlObject   = null,
        html           = parseString(data.htmlText, 'text/html'), 
        oldHtmlTextAll = [],
        specificHtml   = null;
    
    //// PARSE OLD XML
    // get all text just in case
    // returns the nodes that need to be searched for in the xml document
    // get all nodes that fit specification in old xml
    // set finished xml object
    if(oldSlideXml){
      let conversionInfo = getConversionInfo(data.slideType);
      let specifiedNodes = findSpecifiedNodes(conversionInfo, oldSlideXml);
      newXmlObject       = getTextArray(specifiedNodes); 
      oldXmlTextAll      = getAllXmlText(oldSlideXml); 
    }

    //ADD XML OBJECT STRINGS INTO NEW TEMPLATE
    if(newXmlObject){
      for(var key in newXmlObject){
        if(key === 'ul'){
          //TODO - should we keep this in just as a refernce?
          $(newSlideXml).find('BulletPoint').remove();
          $(newSlideXml).find('BulletPointList').append(newXmlObject.ul);
        }
        else if(key === 'ol'){
        }
        else {
          // should we keep this in as a reference
          $(newSlideXml).find('Text').remove();
          $(newSlideXml).find('BulletPointList').before(newXmlObject.other);
        }
      }
      // console.log($(newSlideXml).children()[0].outerHTML);
    }

    //// PARSE OLD HTML
    //get all inner text of html just in case
    //get specific innerHTML
    if(html){
      oldHtmlTextAll        = getAllHtmlText(html); //console.log("oldHtmlTextAll", oldHtmlTextAll);
      specificHtml       = getSpecificHtmlText(html); //console.log("specificHtml", specificHtml);
    }

    //////////////////////////////////////
    //TODO - ADD HTML STRINGS INTO NEW TEMPLATE
    
    // - code goes here
    //////////////////////////////////////

    xmlDoc = null;
    return {
      xml : $(newSlideXml).children()[0].outerHTML,
      text : oldXmlTextAll.concat(oldHtmlTextAll),
      // slideHtml: specificHtml, //add to newSlideXml?
      percentage: data.slidePercent
    };


    /////////////////////////////////////////////////////////////////////
    //// FUNCTIONS
    /////////////////////////////////////////////////////////////////////

    function newXmlTemplate(slideType){
      let newSlideXml = slideTemplate[slideType];
      return parseString(newSlideXml, 'text/xml');
    }

    function parseString(str, conversion){
      if(str){
        let parser = new DOMParser();
        return parser.parseFromString(str, conversion);
      }
      else return null;
    }

    // Grab all child elements of the body
    // .filter - filter out the script and object tags
    // .map    - return arrays of cleansed html text
    // .filter - remove empty arrays
    // .reduce - flatten the final array
    function getAllHtmlText(htmlDoc){
      return Array.from($(htmlDoc.body)[0].children)
        .filter(element  => { return element.tagName !== 'script' && element.tagName !== 'object' ? true : false; })
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
        .filter(arr      => { return arr.length ? true : false; })
        .reduce((a,b)    => { return a.concat(b); }, []);
    }

    function getSpecificHtmlText(htmlDoc){
      let html             = $(htmlDoc),
          contentText      = html.find('.regularcontenttext>ul'),
          headerText       = html.find('.headertext'),
          headerTextMargin = html.find('.headertexttopmargin'),
          content          = null,
          header           = null,
          headerMargin     = null;

      if(contentText.length){
        let lis = Array.from(contentText[0].querySelectorAll('li'));
        content = lis.map(li => { return li.textContent; }); 
      }
      if(headerText.length){
        header = headerText[0].textContent.trim();
      }
      if(headerTextMargin.length){
        headerMargin = headerTextMargin[0].textContent.trim();
      }
      return {content, header, headerMargin};
    }

    function getOldXml(){
      return xmlDoc ?
        xmlDoc
        : null;
    }

    function getAllXmlText(oldXml){
      let xmlText = $(oldXml)[0].childNodes[0].textContent.trim();
      return xmlText ? xmlText : [];
    }

    function getConversionInfo(slideType){
      let slideObj = {};
      switch(slideType){
      case "image":
        slideObj.nodes = [
          'textItem',
          'question',
          'answer'
        ];
        break;
      default:
        break;
      }
      return slideObj;
    }

    function findSpecifiedNodes(conversion, oldXml){
      //find all specified nodes for slide conversion type
      return conversion.nodes.map(nodeName => {
        return $(oldXml).find(nodeName);
      });
    }

    //TODO - store things in a better way than just ul, ol, and other.
    function getTextArray(nodes){
      let ul        = '',
          ol        = '',
          other     = '',
          questions = '',
          answers   = '';

      nodes[0].get().forEach(node => {
        if(node.textContent.includes('<ul>')) {
          // if(node.tagName === 'question'){}
          // else if(node.tagName === 'answer'){}
          // if(node.tagName === 'question'){}
          ul += `<BulletPoint id="bulletId">${node.textContent.replace(/<.+?>/g, '')}</BulletPoint>`;
        }
        else if(node.textContent.includes('ol')) {
          ol += `<BulletPoint id="bulletId">${node.textContent.replace(/<.+?>/g, '')}</BulletPoint>`;
        }
        else {
          other += `<Text id="textId">${node.textContent.replace(/<.+?>/g, '')}</Text>`;
        }
      });
      return {
        ul,
        ol,
        other
      };
    }
  }

  function addSlideToHtmlPage(slideObject) {
    queryTabs({})
      .then(tabs => getTabByUrlPattern(tabs, htmlPageURL)) // try and get the tab the htmlPage is open at
      .then(tabArray => new Promise((resolve, reject) => resolve(tabArray.length === 0 ? false : true))) // check if we found it
      .then(createXmlPage) // try and create it if necessary
      .then(Tab => setTimeout(() => chrome.tabs.sendMessage(Tab.id, { message: 'add-slide', data : slideObject }), 500));
  }
};


// background.js
///////////////////////////////

const xmlPreviewURL = chrome.runtime.getURL('/page/index.html');
var globalBlacklist = [];
var xmlDoc = null;

// analyze XML that comes in and look for pattern
chrome.webRequest.onCompleted.addListener(analyzeXML, { urls : ["*://avondale-iol/*"]});

// check to reset blacklist whenever tabs are removed
chrome.tabs.onRemoved.addListener(resetGlobalBlacklist);

function analyzeXML(details) {
  var resourceURL = details.url;
  var blacklist   = ['style', 'menu', 'graphic'];

  if (resourceURL.match(/\.xml$/i) &&
      !isBlacklisted(resourceURL, blacklist) &&
      !isBlacklisted(resourceURL, globalBlacklist)) {

    // add xml resource to blacklist
    globalBlacklist.push(resourceURL);

    // XML gets saved
    xmlDoc = storeXML(resourceURL);
  }
}

// empty the global blacklist array if an avondale-iol tab isn't open
function resetGlobalBlacklist() {
  chrome.tabs.query({}, tabs => {
    let slideUrlFound = false;
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].url === xmlPreviewURL) {
        slideUrlFound = true;
      }
    }
    if (!slideUrlFound) globalBlacklist = [];
  });
}

function isBlacklisted(url, blacklist) {
  for (var i = 0; i < blacklist.length; i++) {
    if (url.includes(blacklist[i])) return true;
  }
  return false;
}

function getDocument(url) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, false);
  xhr.send();
  return xhr.responseText;
}

function getContext(which_tab) {
  let loc              = '';
  let pattern_oldSlide = /lmsinit\.htm/i;

  if (which_tab) { loc = which_tab;            }
  else           { loc = window.location.href; }

  if (loc.includes('avondale-iol') && loc.match(pattern_oldSlide)) {
    return 'old-slide'; 
  }
  else {
    return 'misc';
  }
};

function sendToTab(which_tab, request){
  chrome.tabs.query({}, function(tabs) {
    for (let i = 0; i < tabs.length; i++) {
      let context = getContext(tabs[i].url);

      if (context === which_tab) {
	chrome.tabs.sendMessage(tabs[i].id, request);
      }   
    }
  });
}

function storeXML(resourceURL){
  let responseText = getDocument(resourceURL);
  let parser       = new DOMParser();
  return parser.parseFromString(responseText, "text/xml");
}
