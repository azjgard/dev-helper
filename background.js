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
    var root         = xmlDoc.getElementsByTagName('CatapultDM');
    console.log("xmlDoc", xmlDoc);

    // AD-105, Web03, Wire Harnesses, Switches, and Ignition Coils
    // -- top level nodes -- 
    //settings
    //files
    //text
    //scenes
    //troubleShootingChart
    //question_array -> question
    //answer_array -> answer
    //assessment

    // grab all text items
    // var textItems   = xmlDoc.getElementsByTagName('textItem');
    // var textContent = "";


    //only go in if text items or questions or whatever are present

    // for (var i = 0; i < textItems.length; i++) {
    //   console.log(textItems[i].textContent);
    //   textContent += textItems[i].textContent;
    // }


    //only send message if text data is present
    if(root[0].children.length === 1 && (root[0].children[0].tagName === 'files' || root[0].children[0].tagName === 'settings')){
      console.log("no useful data from xml");
    }
    else {
      latestTextContent = root[0].textContent.replace(/<\/*\w+\s*\/*>/g, "\n").trim();
      console.log(latestTextContent);
      // we only want to run on each resource ONE time
      globalBlacklist.push(resourceURL);

      var request = {
        message: 'stop-scrape',
        data: latestTextContent
      };

      sendToTab('old-slide', request);

      // addSlideToHtmlPage(data);
    }
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
    console.log(request);

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

// Only functions that are used by both the background 
// and content scripts should go in this file

//
// getContext
//
// descr - returns a string describing the context of the page
// that the script is currently running inside of
var getContext = function(which_tab) {
  var loc;
  if(which_tab){
    loc = which_tab;
  }
  else {
    var loc = window.location.href;
  }

  var pattern_tfs      = /prdtfs\.uticorp\.com/i;
  var pattern_newSlide = /courses\/\w{1,}\/uti_bms_qa_uat\/content/i;
  var pattern_oldSlide = /lmsinit\.htm/i;
  var pattern_login = /webapps\/login/;

  function isPage(pattern) {
    return loc.match(pattern);
  }

  // DR site
  if (loc.includes('avondale-iol')) {
    if (isPage(pattern_oldSlide)) {
      return 'old-slide'; 
    }
    else {
      return 'dr';
    }
  }

  // TFS
  else if (isPage(pattern_tfs)) {
    if(loc.includes('board')){
      return 'tfs_board';
    }
    else if (loc.includes('UTI-ALM/IT/BMS/_backlogs?level=Stories&showParents=true&_a=backlog')) {
      return 'tfs_log-load_page';
    }
    else {
      return 'tfs_log';
    }
  }

  // Blackboard site
  else if (loc.includes('uti.blackboard.com')) {
    if (isPage(pattern_newSlide)) {
      return 'new-slide';
    }
    else if (isPage(pattern_login)) {
      return 'bb-login';
    }
    else {
      return 'bb';
    }
  }

  // Site irrelevant to the plugin
  else {
    return 'misc';
  }
};

//
// sendToTab
//
// descr - routes a message to tab of choice.
function sendToTab(which_tab, request){
  chrome.tabs.query({}, function(tabs){
    for (var i = 0; i < tabs.length; i++) {

      var context = getContext(tabs[i].url);
      
      if(context === which_tab){
        console.log("Sending message to " + context);
        chrome.tabs.sendMessage(tabs[i].id, request);
      }   
    }
  });
}
