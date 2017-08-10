//// Commentary: 
////   New XML Section starts when there is are navigation markers and when transitioning to new set of navigation markers

//Notes from watching Everett

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
//

const beautify           = require('js-beautify').html;
const getDataForFrontend = require('./getData.js');
const $ = require('jquery');

module.exports = function() {
  const htmlPageURL = chrome.runtime.getURL('page/xml-builder.html');

  //// promisified chrome.tabs.query
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

  //// Listener for messages
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

      let msg = request.message;
      let data = request.data;

      if (msg == 'new-html-page') {

        /////////////////////////////////////////////////////////////////////
        //// send request to node red to run getDataforFrontEnd
        /////////////////////////////////////////////////////////////////////
        request.data.xmlString = xmlDoc ? xmlDoc
          .replace(/\/\/<!\[CDATA\[/g, '')
          .replace(/\/\/\]\]>/g, '') : null;
        let url = 'http://localhost:1880/request',
            success,
            dataType = 'json';

        $.ajax({
          type: "POST",
          url: url,
          data: request,
          success: sendToAddPage,
          dataType: dataType
        });
        /////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////

        

        // request.data : {
        //   slideId       : slideID,
        //   slidePercent  : slidePercent,
        //   narrationText : narrationText
        //   htmlText      : htmlText,
        //   slideMeta     : slideMetaInformatoin
        // }

        //TODO - allow sub-bullets to be added (AD-103, steering overview http://avondale-iol/AD-103/AD-103-1-Web03/sco3/lmsinit.htm?ShowCDMenu=1)
        // - add bulletId numbers when inserting bullets
        // - get all text coming through 
        function sendToAddPage(){
          let newData = getDataForFrontend(data); console.log("newData", newData);

          // indent the XML
          newData.xml = beautify(newData.xml, {});

          addSlideToHtmlPage(newData);
        }
      }
    });

  function addSlideToHtmlPage(slideObject) {
    queryTabs({})
      .then(tabs     => getTabByUrlPattern(tabs, htmlPageURL)) // try and get the tab the htmlPage is open at
      .then(tabArray => new Promise((resolve, reject) => resolve(tabArray.length === 0 ? false : true))) // check if we found it
      .then(createXmlPage) // try and create it if necessary
      .then(Tab      => setTimeout(() => chrome.tabs.sendMessage(Tab.id, { message: 'add-slide', data : slideObject }), 500));
  }

  


  // background.js
  //////////////////

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
    return responseText;
    // let parser       = new DOMParser();
    // return parser.parseFromString(responseText, "text/xml");
  }

  module.exports = xmlDoc;


};
