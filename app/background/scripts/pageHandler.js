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

const htmlPageURL = chrome.runtime.getURL('page/xml-builder.html');

// returns a promise that resolves to an array of tabs that match
// the query specified by the options object passed in as the first
// argument.
const queryTabs = options => new Promise((resolve, reject) => chrome.tabs.query(options, resolve));

// returns a promise that rseolves to an array of tabs whose urls
// match the url passed in as the second argument.
const getTabByUrlPattern = (tabs, url) => new Promise((resolve, reject) => resolve(tabs.filter(tab => tab.url.includes(url))));

// if the page is not already open, then this function will open it
// and set it as the active tab. if the page IS already open, this
// function will simply set it as the active tab.
const createXmlPage = xmlPageIsOpen => new Promise((resolve, reject) => {
  if (!xmlPageIsOpen)
    chrome.tabs.create({ url : htmlPageURL }, resolve);
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

// the slideObject should be an object that is formatted properly
// to be consumed by the views page:
/*
 {
   xml: [string],
   words: [array of strings],
   percentage: [string]
 }
*/
function addSlideToHtmlPage(slideObject) {
  queryTabs({})
    .then(tabs => getTabByUrlPattern(tabs, chrome.runtime.getURL('page/xml-builder.html'))) 
    .then(tabArray => new Promise((resolve, reject) => resolve(tabArray.length === 0 ? false : true))) 
    .then(createXmlPage) 
    .then(Tab => setTimeout(() => chrome.tabs.sendMessage(Tab.id, { message: 'add-slide', data : slideObject }), 500));
}

module.exports = addSlideToHtmlPage;
