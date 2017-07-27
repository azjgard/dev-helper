var globalBlacklist   = [];
var latestTextContent = "";
var drSlideText = [];

// wait for a resource to be finished loading
chrome.webRequest.onCompleted.addListener(function (details) {
  var resourceURL = details.url;
  var blacklist   = ['style', 'menu', 'graphic'];

  // only grab .xml files that aren't blacklisted
  if (resourceURL.match(/\.xml$/i) &&
      !isBlacklisted(resourceURL, blacklist) &&
      !isBlacklisted(resourceURL, globalBlacklist)) {

    var responseText = getDocument(resourceURL);
    var parser       = new DOMParser();
    var xmlDoc       = parser.parseFromString(responseText, "text/xml");

    // grab all text items
    var textItems   = xmlDoc.getElementsByTagName('textItem');
    var textContent = "";

    for (var i = 0; i < textItems.length; i++) {
      console.log(textItems[i].textContent);
      textContent += textItems[i].textContent;
    }

    latestTextContent = textContent;

    // we only want to run on each resource ONE time
    globalBlacklist.push(resourceURL);
  }
}, { urls : [ "*://avondale-iol/*"]});

// return true if the specified url contains a word
// from the specified blacklist
function isBlacklisted(url, blacklist) {
  for (var i = 0; i < blacklist.length; i++) {
    if (url.includes(blacklist[i])) return true;
  }
  return false;
}

// HTTP GET the url specified and resolve the results
function getDocument(url) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, false);
  xhr.send();
  return xhr.responseText;
}

// listen for messages from the content scripts
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var msg = request.message;

    // don't listen if there was no message attribute
    if (!msg) {
      throw "Message received, but there was no message attribute!";
      return;
    }
    else {
      if (msg === 'drSlideText') {
	drSlideText.push(request.drSlideText);
	console.log(drSlideText);
      }
    }
  }
);

