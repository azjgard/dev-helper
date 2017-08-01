var globalBlacklist   = [];

chrome.webRequest.onCompleted.addListener(function (details) {
  var resourceURL = details.url;
  var blacklist   = ['style', 'menu', 'graphic'];

  if (resourceURL.match(/\.xml$/i) &&
      !isBlacklisted(resourceURL, blacklist) &&
      !isBlacklisted(resourceURL, globalBlacklist)) {

    let responseText = getDocument(resourceURL);
    let parser       = new DOMParser();

    let xmlDoc       = parser.parseFromString(responseText, "text/xml");
    let root         = xmlDoc.getElementsByTagName('text')[0];
    let textItems    = root && root.children;

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
