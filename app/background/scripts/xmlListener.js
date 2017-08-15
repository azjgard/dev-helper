
const xmlPreviewURL = chrome.runtime.getURL('/page/index.html');
var globalBlacklist = [];
let globalCallback  = null;

function addXmlListeners(callback) {
  chrome.webRequest.onCompleted.addListener(
    details => analyzeXML(details, callback), { urls : ["*://avondale-iol/*"] }
  );
  chrome.tabs.onRemoved.addListener(resetGlobalBlacklist);
}

function analyzeXML(details, callback) {
  var resourceURL = details.url;
  var blacklist   = ['style', 'menu', 'graphic'];

  if (resourceURL.match(/\.xml$/i) &&
      !isBlacklisted(resourceURL, blacklist) &&
      !isBlacklisted(resourceURL, globalBlacklist)) {

    globalBlacklist.push(resourceURL);

    callback(getDocument(resourceURL));
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

module.exports = addXmlListeners;
