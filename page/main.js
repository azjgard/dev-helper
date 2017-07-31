// Vue Application
var app = new Vue({
  el: '#container',
  data: {
    title: "Old Slide Text",
    slides: []
  },
  methods: {
    copyText: function(event) {
      document.execCommand('selectAll', false, null);
      document.execCommand('copy');
      window.getSelection().empty();
    },

    // breaking the Vue paradigm so we can copy text :)
    copyAll: function(event) {
      // Get the slide element
      let slide = event.toElement.parentElement;

      // Get the utility dialog element
      let utilityDialog = slide.getElementsByClassName('utility-dialog')[0];

      // Get the elements that contain the text we want
      let textContainer = slide.getElementsByClassName('text-nodes')[0];
      let textNodes     = textContainer.childNodes;

      // All of the text to be copied will be put in this variable
      let copyString = '';

      // The character used to separate the nodes
      let separator = ' ';

      // Build the copy string with the text nodes
      for (var i = 0; i < textNodes.length; i++) {
	let formattedText = textNodes[i]
	      .textContent
	      .replace(/\s{2,}/g, ' ')
	      .trim();

	if (formattedText !== '') {
	  copyString += formattedText;
	  if (i < textNodes.length - 1) {
	    copyString += separator;
	  }
	}
      }

      // Put the text in the utility dialog
      utilityDialog.textContent = copyString;
      utilityDialog.contentEditable = true;

      // Focus the utility dialog, highlight all text, and copy it
      utilityDialog.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('copy');

      // Reset the utility dialog
      utilityDialog.contentEditable = false;
      utilityDialog.textContent = "";
    }
  }
});

// JavaScript running inside of the generated HTML page
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var msg  = request.message;
    var data = request.data;

    if (msg === 'display-xml') {
      var slides             = app._data.slides;
      var slideAlreadyExists = false;

      // change this however necessary
      var primaryKey = 'slideId';

      // check if the slide sent already exists
      for (var i = 0; i < slides.length; i++) {
	let curKey = slides[i][primaryKey];
	let newKey = data[primaryKey];

	if (curKey === newKey) {
	  slideAlreadyExists = true;
	}
      }

      // remove empty strings if there are any
      // if (data.pageText !== null && typeof data.pageText === "object") {
      // 	data.pageText = data.pageText
      // 	  .filter(value => value.match(/\w/g));
      // }

      data.xmlText  = cleanTextObject(data.xmlText);
      data.htmlText = cleanTextObject(data.htmlText);
      data.narrationText = cleanNarrationText(data.narrationText);

      // add slide if it doesn't already exist
      if (!slideAlreadyExists) {
	app._data.slides.push(data);
      }
    }
});

function cleanTextObject(obj) {
  let newObj = null;
  if (obj !== null && typeof obj === "object") {
    newObj = obj.filter(value => value.match(/\w/g));
  }
  return newObj;
}

function cleanNarrationText(str) {
  return str.includes('<br/><br/>') ? str.split('<br/><br/>') : [str];
}
