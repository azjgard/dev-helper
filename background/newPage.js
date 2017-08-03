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
    let msg = request.message;
    let data = request.data;

    if (msg == 'new-html-page') {
      // textitems #instructions --> ImageContentList>ImageContent>Header#header{num}
      // textitems #objective{num} --> ImageContentList>ImageContent>Header#header{num}
      // CC always go in Instructions tags

      // Image slides
      // - Audio -> Instructions -> Image Layout -> Image Content List>ImageContent>Image -> Header -> (BulltetPointList>BulletPoint ^^^ || Text ^^) CueList>Cue
      // HTML slides
      // - Audio -> Instructions -> Content>html stuff
      // QUIZ slides
      // not going to map just yet

      // New Section comes when there is are navigation markers and when transitioning to new set of navigation markers
      let slideTypes = {
        singleImage : {
          nodesToGrab : [
            'textItem'
          ]
        },
        imageGallery : {
        }
      };
      if(xmlDoc !== undefined){
        // TODO
        // Saved XML is grabbed and parsed according to conversion type specifications and sent to front end
        //   - nodes that don't meet specifications just have their text scraped to be placed on html page

        // parse the xmlDoc using provided slide type
        let parserObj = slideTypes[data.slideType];
        let parsedXml = parseXmlDoc(parserObj, xmlDoc);

        // Data structure being sent to fron end
        // [
        //   {
        //     match      : 'bool',
        //     node       : 'tag name',
        //     attributes : 'array if desired node, null if not',
        //     text       : 'textContent'
        //   },
        // ]
        data.xmlText = parsedXml;  
        console.log(data.xmlText);

        function parseXmlDoc(parser, xml){
          // loop through all child nodes
          parser.nodesToGrab
          let rootChildren = Array.from($(xml).find('*')[0].children);
          
          // loop through all top level elements in xml document
          rootChildren.map(child => {
            let match = false;
            // loop through list of desired node names to see if the current node name matches desired node name
            try {
            parser.nodesToGrab.forEach(node => {
              if(child.tagName === node){
                match = true;
                throw new Error("ok");
              }
            });
            }
            catch(err) {
              if(err !== "ok") throw err;
            }
            return match ?
              { match : match, node : child.tagName, attributes : child.attributes, text : child.textContent } :
            { match : match, node : child.tagName, attributes : null, text : child.textContent };
          });

        }
      }
      // addSlideToHtmlPage(data);
      //reset global variable
      xmlDoc = null;
    }
  });


function addSlideToHtmlPage(slideObject) {
  queryTabs({})
    .then(tabs => getTabByUrlPattern(tabs, htmlPageURL)) // try and get the tab the htmlPage is open at
    .then(tabArray => new Promise((resolve, reject) => resolve(tabArray.length === 0 ? false : true))) // check if we found it
    .then(createXmlPage) // try and create it if necessary
    .then(Tab => setTimeout(() => chrome.tabs.sendMessage(Tab.id, { message: 'display-xml', data : slideObject }), 500));
}
