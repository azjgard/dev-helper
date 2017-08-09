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
        //   htmlText      : htmlText,
	//   slideMeta     : slideMetaInformatoin
        // }

        let newData = getDataForFrontend(data); console.log("newData", newData);
        //TODO - allow sub-bullets to be added (AD-103, steering overview http://avondale-iol/AD-103/AD-103-1-Web03/sco3/lmsinit.htm?ShowCDMenu=1)
        // - add bulletId numbers when inserting bullets
        // - get all text coming through 
        addSlideToHtmlPage(newData);
      }
    });

  /////////////////////////////////////////////////////////////////////
  //// FUNCTIONS
  /////////////////////////////////////////////////////////////////////
  
  //
  // addSlideToHtmlPage
  //
  // descr - sends data object with xml and html text to tab
  // @params
  //   - slideObject = {
  //     xml          : 'string containing new slide xml',
  //     text         : 'array of all words from old xml and old html',
  //     percentage   : 'string that identifies how far along user is in old slide'
  //   }
  function addSlideToHtmlPage(slideObject) {
    queryTabs({})
      .then(tabs     => getTabByUrlPattern(tabs, htmlPageURL)) // try and get the tab the htmlPage is open at
      .then(tabArray => new Promise((resolve, reject) => resolve(tabArray.length === 0 ? false : true))) // check if we found it
      .then(createXmlPage) // try and create it if necessary
      .then(Tab      => setTimeout(() => chrome.tabs.sendMessage(Tab.id, { message: 'add-slide', data : slideObject }), 500));
  }

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
    let html           = parseString(data.htmlText, 'text/html'), 
        newSlideXml    = newXmlTemplate(data.slideMeta.slideType), 
        oldSlideXml    = getOldXml(), 
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
  // addAllTextToNewXml
  //// descr - 
  //// @params
  ////   - newXmlObject - 
  ////   - oldHtmlTextAll - 
  ////   - xmlFromHtml - 
  ////   - narration - 
  ////   - newSlideXml - 
  //// @return
  ////   - completedNewXml - 
  function addAllTextToNewXml(newXmlObject, oldHtmlTextAll, xmlFromHtml, narration, newSlideXml){
    let newXmlWithNarr = addNarration(narration, newSlideXml);
    let combinedXmlHtml = combineOldHtmlAndXml(newXmlObject, oldHtmlTextAll, xmlFromHtml);
    let completedNewXml = addTextFromXmlAndHtml(combinedXmlHtml, newXmlWithNarr);
    
    return {completedNewXml : $(completedNewXml)[0].children[0].outerHTML, allText : combinedXmlHtml.allText};
  }

  function combineOldHtmlAndXml(newXmlObject, oldHtmlTextAll, xmlFromHtml){
    let headerText = xmlFromHtml.headerText         === undefined ? '' : xmlFromHtml.headerText,
        bulletText = xmlFromHtml.bulletText         === undefined ? '' : xmlFromHtml.bulletText,
        other      = newXmlObject.other             === undefined ? '' : newXmlObject.other,
        ul         = newXmlObject.ul                === undefined ? '' : newXmlObject.ul,
        all        = newXmlObject.allTextFromOldXml === undefined ? [] : newXmlObject.allTextFromOldXml;
    
    let header  = (headerText + other).trim();
    let bullets = (bulletText + ul).trim();
    let allText = oldHtmlTextAll.concat(all);

    return {header, bullets, allText};
  }

  function addTextFromXmlAndHtml(combinedXmlHtml, newWithNarr){
    let bulletList = $(newWithNarr).find('BulletPointList');
    if(combinedXmlHtml.bullets){
      bulletList
        .empty()
        .append(combinedXmlHtml.bullets);
    }

    let text = $(newWithNarr).find('Text');
    if(combinedXmlHtml.header){
      text.remove();
      bulletList.before(combinedXmlHtml.header);
    }

    return newWithNarr;
  }

  function addNarration(narration, newSlideXml){
    //// ADD NARRATION TO NEW SLIDE
    if(narration){
      let instructions = $(newSlideXml).find('Instructions');
      let narrationText = narration;

      //TODO - somehow figure out how to let the bms guys know that they shouldn't copy in the title of the tag
      //We could get rid of it by using this .split(/<br\/><br\/>.+?<br\/>/g)
      if(narrationText.match(/<br\/><br\/>/g)){
        narrationText = narrationText
          .split(/<br\/><br\/>/g)
          .map(cc => { return cc.replace(/<.+?>/g, ' ').trim(); });
      }
      else {
        narrationText = narrationText
          .replace(/<.+?>/g, ' ')
          .trim();
      }

      // TODO - figure out how to match the text from the pages with multiple narrations to the corrent narrations
      instructions.empty();
      instructions.append(narrationText);
      return newSlideXml;
    }
    return null;
  }

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
    let newXmlObject       = getTextArray(specifiedNodes); 
    let oldXmlTextAll      = getAllXmlText(oldSlideXml); 

    let xmlFromOldXml = {
      ul                : newXmlObject.ul,
      ol                : newXmlObject.ol,
      other             : newXmlObject.other,
      allTextFromOldXml : oldXmlTextAll
    };
    
    return xmlFromOldXml;
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
  
  //
  // getOldXml
  //// descr - gets the old slide xml document
  //// @params
  ////   - none
  //// @return
  ////   - the xml document or null if their is no xml document
  function getOldXml(){
    return xmlDoc ?
      xmlDoc
      : null;
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
    console.log('made it to slideType!');
    console.log(slideType);

    let nodes = [];
    switch(slideType){
    case "Image":
      nodes = [
        'textItem',
        'question',
        'answer'
      ];
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
        // if(node.tagName === 'question'){}
        // else if(node.tagName === 'answer'){}
        // if(node.tagName === 'question'){}
        ul    += `<BulletPoint id="bulletId">${node.textContent.replace(/<.+?>/g, '')}</BulletPoint>`;
      }
      else if(node.textContent.includes('ol')) {
        ol    += `<BulletPoint id="bulletId">${node.textContent.replace(/<.+?>/g, '')}</BulletPoint>`;
      }
      else {
        other += `<Text id="textId">${node.textContent.replace(/<.+?>/g, '')}</Text>`;
      }
    });
    return { ul, ol, other };
  }

  function getNewXmlTextStrings(){
    return {
      bulletBegin : '<BulletPoint id="bulletId">',
      bulletEnd   : '</BulletPoint>',
      textBegin   : '<Text id="textId">',
      textEnd     : '</Text>'
    };
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
