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
