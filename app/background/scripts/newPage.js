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
        let newSlideXml = newXmlTemplate(); console.log("newSlideXml", newSlideXml);
        
        function newXmlTemplate(){
          let newSlideXml = require('./data/imageSlide.js')();
          return parseString(newSlideXml, 'text/xml');

          function parseString(str, conversion){
            if(str){
              let parser = new DOMParser();
              return parser.parseFromString(str, conversion);
            }
            else return null;
          }
        }


        //// PARSE XML
        let oldSlideXml      = getOldXml(); console.log("oldSlideXml", oldSlideXml);
        let xmlTextArray     = null;
        if(oldSlideXml){
          //get all text just in case
          let oldSlideText   = getAllText(oldSlideXml); 
          //returns the nodes that need to be searched for in the xml document
          let conversionInfo = getConversionInfo(data.slideType);
          //get all nodes that fit specification in old xml
          let specifiedNodes = findSpecifiedNodes(conversionInfo, oldSlideXml);
          xmlTextArray      = getTextArray(specifiedNodes); 
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


        // convert xml to string and send to server
        let x;
        if(xmlTextArray){
          x = xmlTextArray.reduce((accumulator, current, index) => {
            return current.element === 'ul' ? accumulator + current.text : null;
          }, '');
        }
        console.log(x);

        // // addSlideToHtmlPage(data);
        // //reset global variable
        xmlDoc = null;
      }
    });

  function parseXmlDoc(parser, xml){
    // loop through all child nodes
    let rootChildren = Array.from($(xml).find('*')[0].children);

    // loop through all top level elements in xml document
    rootChildren.map(child => {
      let match = false;
      // loop through list of desired node names to see if the current node name matches desired node name
      try {
        parser.nodesToGrab.forEach(node => {
          if(child.tagName === node){
            match = true;
            throw new Error("ok");
          }
        });
      }
      catch(err) {
        if(err !== "ok") throw err;
      }
      return match ?
        { match : match, node : child.tagName, attributes : child.attributes, text : child.textContent } :
      { match : match, node : child.tagName, attributes : null, text : child.textContent };
    });

  }

  // function parseHtmlDoc(parser, html){

  //   let new_html = document.createElement('html');
  //   new_html.innerHTML = html;
  //   let htmlChildren = Array.from($(new_html).find('body').childNodes);
  //   htmlChildren.forEach(child => {

  //     if(child.childNodes.length > 0){
  //       //search again
  //     }
  //     else {
  //     }
  //   });


  //   function grab


  //   return new_html.childNodes;

  //   // loop through all child nodes
  //   // parser.nodesToGrab
  //   // let rootChildren = Array.from($(xml).find('*')[0].children);

  //   // // loop through all top level elements in xml document
  //   // rootChildren.map(child => {
  //   //   let match = false;
  //   //   // loop through list of desired node names to see if the current node name matches desired node name
  //   //   try {
  //   //     parser.nodesToGrab.forEach(node => {
  //   //       if(child.tagName === node){
  //   //         match = true;
  //   //         throw new Error("ok");
  //   //       }
  //   //     });
  //   //   }
  //   //   catch(err) {
  //   //     if(err !== "ok") throw err;
  //   //   }
  //   //   return match ?
  //   //     { match : match, node : child.tagName, attributes : child.attributes, text : child.textContent } :
  //   //   { match : match, node : child.tagName, attributes : null, text : child.textContent };
  //   // });

  // }

  // //put all these strings in a global object or array
  // function createNewTemplate(parsedHtml, parsedXml, data){
  //   let slides = {
  //     singleImage : {
  //       id : data.slideId,
  //       slideText: [
  //         // This will become more complex
  //         { text: '' },
  //         { text: '' },
  //         { text: '' },
  //         { text: '' },
  //       ],
  //       xmlBlocks : [
  //         {
  //           pre : `<Slide type="${getSlideType(data.slideType)}">`,
  //           post : `</Slide>`,
  //           text : `${parsedHtml + parsedXml}`,
  //           children : []
  //         },
  //         {
  //           pre : `<Audio>`,
  //           post : `</Audio>`,
  //           text : ``
  //         },
  //         {
  //           pre : `<Slide type="${getSlideType(data.slideType)}">`,
  //           post : `</Slide>`,
  //           text : `${parsedHtml + parsedXml}`
  //         },
  //         {
  //           pre : `<Instructions>`,
  //           post : `</Instructions>`,
  //           text : `${data.narrationText}`
  //         },
  //         {
  //           pre : `<ImageLayout position="" showBackground="" contentPercentage="">`,
  //           post : `</ImageLayout>`,
  //           text : ``
  //         },
  //         {
  //           pre : `<ImageContentList>`,
  //           post : `</ImageContentList>`,
  //           text : `` // this has nested stuff that is important (ImageContent>Image -> Header -> Text -> BulletPointList>Bullet)
  //         },
  //         // ,
  //         // {
  //         //   pre : `<Image id="image{num}">`,
  //         //   post : `</Image>`,
  //         //   text : `` 
  //         // }
  //         // ,
  //         // {
  //         //   pre : `<Header id="header{num}">`,
  //         //   post : `</Header>`,
  //         //   text : ``
  //         // }
  //         // ,
  //         // {
  //         //   pre : `<BulletPointList style="(unordered || ordered)">`,
  //         //   post : `</BulletPointList>`,
  //         //   text : ``
  //         // }
  //         // ,
  //         // {
  //         //   pre : `<BulletPoint id="bullet{num}">`,
  //         //   post : `</BulletPoint>`,
  //         //   text : ``
  //         // }
  //         // ,
  //         // {
  //         //   pre : `<Text id="text{num}">`,
  //         //   post : `</Text>`,
  //         //   text : `` 
  //         // }
  //         // ,
  //         {
  //           pre : `<CueList>`,
  //           post : `</CueList>`,
  //           text : `` //this has Cue>Trigger -> Effect tags
  //         }
  //         // ,
  //         // {
  //         //   pre : `<Cue>`,
  //         //   post : `</Cue>`,
  //         //   text : ``
  //         // }
  //         // ,
  //         // {
  //         //   pre : `<Trigger triggerType="" triggerTime=""/>`,
  //         //   post : ``,
  //         //   text : ``
  //         // }
  //         // ,
  //         // {
  //         //   pre : `<Effect effectType="" displayMode="" target="#{text{num}}" effect="" duration=""/>`,
  //         //   post : ``,
  //         //   text : ``
  //         // }
  //       ]
  //     }
  //     //add other slide types below
  //   };
  //   return slides[data.slideType];

  // }

  // function getSlideType(type){

  //   switch(type){
  //   case "singleImage":
  //     return "Image";
  //     break;
  //   case "imageGallery":
  //     return "Image";
  //     break;
  //   default:
  //     return '';
  //     break;
  //   }
  // }

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
