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

const getDataForFrontend = require('./getData.js');

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

        //TODO - allow sub-bullets to be added (AD-103, steering overview http://avondale-iol/AD-103/AD-103-1-Web03/sco3/lmsinit.htm?ShowCDMenu=1)
        // - add bulletId numbers when inserting bullets
        // - get all text coming through 
        let newData = getDataForFrontend(data);
        console.log('--- newData ---');
        console.log(newData);
        addSlideToHtmlPage(newData);
      }
    });

  function addSlideToHtmlPage(slideObject) {
    queryTabs({})
      .then(tabs     => getTabByUrlPattern(tabs, htmlPageURL)) // try and get the tab the htmlPage is open at
      .then(tabArray => new Promise((resolve, reject) => resolve(tabArray.length === 0 ? false : true))) // check if we found it
      .then(createXmlPage) // try and create it if necessary
      .then(Tab      => setTimeout(() => chrome.tabs.sendMessage(Tab.id, { message: 'add-slide', data : slideObject }), 500));
  }
};
