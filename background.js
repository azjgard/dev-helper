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
    let root         = xmlDoc.getElementsByTagName('CatapultDM')[0];
    console.log(root);
    let xmlTextObj   = {};

    function createXmlObject(){
        let x = 1;
        for(var i = 0; i < root.children.length; i++) {

          let tagname = checkXmlObject(root.children[i].tagName, x);
          xmlTextObj[tagname] = {
            tagName : tagname,
            text    : root.children[i].textContent
          };
        }
          console.log(xmlTextObj);
    }
    createXmlObject();

    function checkXmlObject(tagname, x){
      console.log('check if name is same');
      if(xmlTextObj.hasOwnProperty(tagname)){
        tagname += x;
        x++;
        checkXmlObject(tagname, x);
      }
      else return tagname;
    }

      if (root.children.length === 1 &&
          (root.children[0].tagName === 'files' ||
           root.children[0].tagName === 'settings')) {}
      else {
        globalBlacklist.push(resourceURL);

        var request = {
          message : 'stop-scrape',
          data    : xmlTextObj
        };

        // send a message to the listener in content2.js
        sendToTab('old-slide', request);
      }

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
