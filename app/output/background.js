/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

const newPage    = __webpack_require__(1);
const background = __webpack_require__(3);

newPage();
background();




/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

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
          let newSlideXml = __webpack_require__(2)();

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
        let oldSlideXml = getOldXml();                 console.log("oldSlideXml", oldSlideXml);
        if(oldSlideXml){
          let oldSlideText = getAllText(oldSlideXml);  console.log("oldSlideText", oldSlideText);
          let conversionInfo = getConversionInfo(data.slideType);
          let specifiedNodes = findSpecifiedNodes(conversionInfo, oldSlideXml);
          let ul = checkNodesForElement(specifiedNodes, 'ul');
          let ol = checkNodesForElement(specifiedNodes, 'ol');
          addOldToNew(conversionInfo, oldSlideXml);
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

        function checkNodesForElement(nodes, element){
          //check nodes for specific tags
          function getTags(nodeList, searchTag){
            return nodes[0].map(item => {
              item.textContent
                .match(/<.+?>/g, '')
                .some(tag => tag.includes(searchTag));
            });
          }
          return getTags(nodes, element);
        }

        function addOldToNew(conversion, oldXml){
          // nodes[0] is an array of the specified items a person is looking for



          //put new text in new xml
          // let rootChildren = getRootChildren(oldSlideXml);
          // let txt = oldSlideXml ? parseText(oldSlideXml, 'xml') : null;
          // console.log("xmltxt", txt);

          // 
          //// PARSE HTML
          // let htmlResult =
          //       (function(){
          //         let htmlDoc = parseString(data.htmlText, 'text/html');
          //         console.log("htmlDoc", htmlDoc);
          //         // put html in the new xmlTemplate
          //         let rootChildren = getRootChildren(htmlDoc);
          //         findElementsWithInnerText(rootChildren);
          //       })();
        }



        function parseText(text, type){
          let txt = text;

          switch(type){
            case 'html':
              // code here
              break;
            case 'xml':
              // get all text within CDATA tags
              var cdata = txt.match(/<!\[CDATA\[(.+?)\]\]/g);

              // get all ordered and unordered lists
              let ulTags = data.match(/<ul>(.+?)<\/ul>/g);

              //pull text from <ul>
              let unorderdLi = ulTags.map(ul => {
                return ul.replace(/<ul>|<\/ul>/g, '');
              });

              break;
            default:
              return null;
              break;
          }
        }

        // convert xml to string and send to server

        function getRootChildren(element){
          console.log($(element).children());
          return Array.from($(element).children());
        }






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


/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = function() {
  return` 
<Slide type="Image">
	<Audio>Audio_File_Name</Audio>
	<Instructions>
 Closed_Captions
 </Instructions>
	<ImageLayout position="Lower" showBorder="false" showBackground="true" contentPercentage="75" />
	<ImageContentList>
		<ImageContent>
			<Image id="imageId">Image_File_Name_png</Image>
			<Header id="headerId">Header_Text</Header>
			<Text id="textId">Sub_header_Body_Text</Text>
			<BulletPointList>
				<BulletPoint id="bulletId">Bullet_Text</BulletPoint>
			</BulletPointList>
		</ImageContent>
	</ImageContentList>
	<CueList>
		<Cue>
			<Trigger triggerType="Timed" triggerTime="0.0"/>
			<Effect effectType="Visibility" displayMode="Show" target="headerId" effect="fade" duration="1.0"/>
		</Cue>
		<Cue>
			<Trigger triggerType="Timed" triggerTime="0.0"/>
			<Effect effectType="Visibility" displayMode="Show" target="imageId" effect="fade" duration="1.0"/>
		</Cue>
		<Cue>
			<Trigger triggerType="Timed" triggerTime="0.25"/>
			<Effect effectType="Visibility" displayMode="Show" target="textId" effect="fade" duration="0.5"/>
		</Cue>
		<Cue>
			<Trigger triggerType="Timed" triggerTime="0.5"/>
			<Effect effectType="Visibility" displayMode="Show" target="bulletId" effect="fade" duration="0.5"/>
		</Cue>
	</CueList>
</Slide>
`;
};


/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = function() {
  const xmlPreviewURL = chrome.runtime.getURL('/page/index.html');
  var globalBlacklist = [];
  var xmlDoc = null;

  chrome.webRequest.onCompleted.addListener(function (details) {
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
  }, { urls : [ "*://avondale-iol/*"]});

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
    let loc = '';

    if (which_tab) { loc = which_tab;            }
    else           { loc = window.location.href; }

    var pattern_oldSlide = /lmsinit\.htm/i;

    if (loc.includes('avondale-iol') && isPage(pattern_oldSlide)) {
      return 'old-slide'; 
    }
    else {
      return 'misc';
    }

    function isPage(pattern) {
      return loc.match(pattern);
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

  // reset the global blacklist if the XML Preview is closed
  chrome.tabs.onRemoved.addListener(function(tabID, removeInfo) {
    chrome.tabs.query({}, tabs => {
      let slideUrlFound = false;

      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].url === xmlPreviewURL) {
          slideUrlFound = true;
        }
      }

      if (!slideUrlFound) globalBlacklist = [];
    });
  });


  function storeXML(resourceURL){
    let responseText = getDocument(resourceURL);
    let parser       = new DOMParser();
    return parser.parseFromString(responseText, "text/xml");
  }
};


/***/ })
/******/ ]);