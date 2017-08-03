
const xmlPreviewURL = chrome.runtime.getURL('/page/index.html');
var globalBlacklist = [];
var xmlDoc;

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
