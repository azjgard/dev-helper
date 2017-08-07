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
const xmlHandler = __webpack_require__(2);

newPage();
xmlHandler();




/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = function() {
  const htmlPageURL = chrome.runtime.getURL('/page/index.html');

  // promisified chrome.tabs.query
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

  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      var msg = request.message;
      if (msg == 'new-html-page') {
        addSlideToHtmlPage(request.data);
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


/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = function() {
  const xmlPreviewURL = chrome.runtime.getURL('/page/index.html');
  var globalBlacklist = [];

  chrome.webRequest.onCompleted.addListener(function (details) {
    var resourceURL = details.url;
    var blacklist   = ['style', 'menu', 'graphic'];

    if (resourceURL.match(/\.xml$/i) &&
      !isBlacklisted(resourceURL, blacklist) &&
      !isBlacklisted(resourceURL, globalBlacklist)) {

      let responseText = getDocument(resourceURL);
      let parser       = new DOMParser();

      let xmlDoc       = parser.parseFromString(responseText, "text/xml");
      let xmlTextObj   = {};

      grabXmlText(xmlTextObj, 'text');
      grabXmlText(xmlTextObj, 'scenes');
      grabXmlText(xmlTextObj, 'question_array');
      grabXmlText(xmlTextObj, 'answer_array');

      function grabXmlText(xmlTextObj, rootName) {
        let root      = xmlDoc.getElementsByTagName(rootName)[0];
        let textItems = root && root.children;

        createXmlObject();

        function createXmlObject() {
          let x = 1;

          if (textItems && textItems.length > 0) {
            for (var i = 0; i < textItems.length; i++) {
              let tagname = checkXmlObject(textItems[i].tagName, x);
              let text    = textItems[i].textContent;

              if (xmlTextObj.hasOwnProperty(tagname)) {
                xmlTextObj[tagname].text.push(text);
              }
              else {
                xmlTextObj[tagname] = {
                  tagName : tagname,
                  text    : [text]
                };
              }
            }
          }
        }

        function checkXmlObject(tagname, x) {
          if(xmlTextObj.hasOwnProperty(tagname)){
            tagname += x;
            x++;
            checkXmlObject(tagname, x);
          }
          else return tagname;
        }
      }

      globalBlacklist.push(resourceURL);

      var request = {
        message : 'stop-scrape',
        data    : xmlTextObj
      };

      // send a message to the listener in content2.js
      sendToTab('old-slide', request);

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
};


/***/ })
/******/ ]);