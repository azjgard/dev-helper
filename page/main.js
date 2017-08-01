// Vue Application
var app = new Vue({
  el: '#container',
  data: {
    title: "Old Slide Text",
    slides: [],
    feedbackDialog: {
      text: '',
      class: {
	visible: false
      }
    }
  },
  methods: {
    copyText: function(event) {
      document.execCommand('selectAll', false, null);
      document.execCommand('copy');
      window.getSelection().empty();

      this.showDialog("Text copied!", 1000);
    },
    // breaking the Vue paradigm so we can copy text :)
    copyAll: function(event) {
      let slide         = event.toElement.parentElement;
      let utilityDialog = slide.getElementsByClassName('utility-dialog')[0];

      let textContainer = slide.getElementsByClassName('text-nodes')[0];
      let textNodes     = textContainer.childNodes;

      let copyString = '';
      let separator  = ' ';

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

      utilityDialog.textContent = copyString;
      utilityDialog.contentEditable = true;

      utilityDialog.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('copy');

      utilityDialog.contentEditable = false;
      utilityDialog.textContent = "";

      this.showDialog("Text copied!", 1000);
    },
    showDialog: function(text, timeOut) {
      
      this._data.feedbackDialog.text = text;
      this._data.feedbackDialog.class.visible = true;

      document
	.getElementById('feedback-dialog')
	.style
	.left = document
	.getElementById('container')
	.offsetLeft;

      setTimeout(() => {
	this._data.feedbackDialog.class.visible = false;
      }, timeOut);

    }
  }
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var msg  = request.message;
    var data = request.data;

    if (msg === 'display-xml') {
      var slides             = app._data.slides;
      var slideAlreadyExists = false;

      var primaryKey = 'slideId';

      for (var i = 0; i < slides.length; i++) {
	let curKey = slides[i][primaryKey];
	let newKey = data[primaryKey];

	if (curKey === newKey) {
	  slideAlreadyExists = true;
	}
      }

      var xmlArr = [];

      if (data.xmlText) {
        for (var key in data.xmlText) {
	  let text = data.xmlText[key].text;
	  if (text.match(/\w/))
	    xmlArr.push(text);
        }
      }

      data.xmlText       = xmlArr;
      data.htmlText      = cleanTextObject(data.htmlText);
      data.narrationText = cleanNarrationText(data.narrationText);

      if (!slideAlreadyExists) {
	app._data.slides.push(data);
      }
      else {
	app.showDialog("That slide already exists!", 1500);
      }
    }
});

function cleanTextObject(obj) {
  let newObj = null;
  if (obj !== null && typeof obj === "object" && obj.length > 0) {
    newObj = obj.filter(value => value.match(/\w/g));
  }
  return newObj;
}

function cleanNarrationText(str) {
  return str.includes('<br/><br/>') ? str.split('<br/><br/>') : [str];
}
