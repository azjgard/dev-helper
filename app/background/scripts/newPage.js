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

module.exports = function() {
  const htmlPageURL = chrome.runtime.getURL('/page/index.html');

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
      //this creates a string of xml to send to the front end
      if (msg == 'new-html-page') {

        //// CREATE XML TEMPLATE BASED ON USER SPECIFICATIONS
        let newSlideXml      = newXmlTemplate(); console.log("newSlideXml", newSlideXml);

        //// PARSE XML
        let oldSlideXml      = getOldXml(); console.log("oldSlideXml", oldSlideXml);
        let newXmlObject     = null;
        if(oldSlideXml){
          //get all text just in case
          let oldSlideText   = getAllText(oldSlideXml); 
          //returns the nodes that need to be searched for in the xml document
          let conversionInfo = getConversionInfo(data.slideType);
          //get all nodes that fit specification in old xml
          let specifiedNodes = findSpecifiedNodes(conversionInfo, oldSlideXml);
          newXmlObject       = getTextArray(specifiedNodes); 
        }

        //// PARSE HTML
        let html             = parseString(data.htmlText, 'text/html'); console.log(html);
        //get all inner text of html just in case
        if(html){
          let allHtmlText      = getHtmlText(html); console.log("allHtmlText", allHtmlText);
        }


        //ADD XML OBJECT STRINGS INTO NEW TEMPLATE
        if(newXmlObject){
          for(var key in newXmlObject){
            if(key === 'ul'){
              $(newSlideXml).find('BulletPoint').remove();
              $(newSlideXml).find('BulletPointList').append(newXmlObject.ul);
            }
            else if(key === 'ol'){
            }
            else {
              $(newSlideXml).find('Text').remove();
              $(newSlideXml).find('BulletPointList').before(newXmlObject.other);
            }
          }
          console.log($(newSlideXml).children()[0].outerHTML);
        }

        function newXmlTemplate(){
          let newSlideXml = require('./data/imageSlide.js')();
          return parseString(newSlideXml, 'text/xml');
        }

        function parseString(str, conversion){
          if(str){
            let parser = new DOMParser();
            return parser.parseFromString(str, conversion);
          }
          else return null;
        }

        function getHtmlText(htmlDoc){
          return Array.from($(htmlDoc.body)[0].children)
            .filter(element => {
              console.log(element.innerText);
              return element.tagName !== 'script' && element.tagName !== 'object'
                ? true
                : false;
            })
          //this map doesn't work like I want. There is some text stored inside CDATA tags and I need to figure out how to get them out;
            .map(element => { return element.innerText
                              .replace(/\/\/<!\[CDATA\[/g, '')
                              .replace(/\/\/\]\]>/g, '')
                              .replace(/[\w\d]+\(\);*/g, '')
                              .trim();
                            });

        }

        function getOldXml(){
          return xmlDoc ?
            xmlDoc
            : null;
        }

        function getAllText(oldXml){
          return $(oldXml)[0].childNodes[0].textContent;
        }

        function getConversionInfo(slideType){
          let slideObj = {};
          switch(slideType){
          case "image":
            slideObj.nodes = [
              'textItem'
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

        function getTextArray(nodes){
          let ul = '';
          let ol = '';
          let other = '';
          nodes[0].get().forEach(node => {
            if(node.textContent.includes('<ul>')) {
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
        // addSlideToHtmlPage(newSlideXml);
        xmlDoc = null;
      }
    });


  function addSlideToHtmlPage(slideObject) {
    queryTabs({})
      .then(tabs => getTabByUrlPattern(tabs, htmlPageURL)) // try and get the tab the htmlPage is open at
      .then(tabArray => new Promise((resolve, reject) => resolve(tabArray.length === 0 ? false : true))) // check if we found it
      .then(createXmlPage) // try and create it if necessary
      .then(Tab => setTimeout(() => chrome.tabs.sendMessage(Tab.id, { message: 'display-xml', data : slideObject }), 500));
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
