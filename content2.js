// TODO: add event listeners to each slide at the appropriate times
// to grab the information for each, instead of just the first one, as it
// is currently doing. Search 'TODO'

var stop_scrape = false;
var xmlText = null;
var addedNextListener = false;

execSlide();

function execSlide() {
  setTimeout(() => {
    defineElements()
      .then(getPageInformation)
      .then(sendRequest);
  }, 1000);
}

function defineElements() {
  var expressions = {
    mainDoc        : 'document.getElementById("_RLOCD")',
    bottomDoc      : 'elements.mainDocument.contentDocument.getElementById("FaceBottom")',
    nextButton     : 'elements.bottomDocument.contentDocument.getElementById("nextbutton")',
    displayDocument: 'elements.mainDocument.contentDocument.getElementById("display")'
  };
  var config = {
    currentTimeout : 0,
    maxTimeout     : 5000,
    elements       : {}
  };
  return new Promise((resolve, reject) => {
    getElByExpr(expressions.mainDoc, config)
      .then(mainDoc => {
	config.elements.mainDocument = mainDoc;
	return getElByExpr(expressions.bottomDoc, config);
      })
      .then(bottomDoc => {
	config.elements.bottomDocument = bottomDoc;
	return getElByExpr(expressions.nextButton, config);
      })
      .then(nextButton => {
	config.elements.nextButton = nextButton;
	return getElByExpr(expressions.displayDocument, config);
      })
      .then(displayDocument => {
	config.elements.displayDocument = displayDocument;
	resolve(config.elements);
      });
  });
}

function getElByExpr(expression, config) {
  return new Promise((resolve, reject) => {
    let currentTimeout = config.currentTimeout;
    let maxTimeout     = config.maxTimeout;
    let elements       = config.elements;
    recurse(expression, currentTimeout, maxTimeout, elements, resolve);
  });

  function recurse(expression, currentTimeout, maxTimeout, elements, resolve) {
    var waitTime = 100, el = eval(expression);

    if ((el === null || el.length === 0) && currentTimeout < maxTimeout) {
      setTimeout(() => recurse(
	expression,
	currentTimeout + waitTime,
	maxTimeout,
	elements,
	resolve), waitTime);
    }
    else if (el === null || el.length === 0) {
      throw new Error("Could not find element from expression: " + expression); 
    }
    else {
      resolve(el); 
    }
  }
}

function getPageInformation(elements) {
  return new Promise((resolve, reject) => {
    let actions = [
      getMainText(elements),
      getNarration(),
      getSlideID(elements)
    ];

    Promise.all(actions).then(pageInformation => {
      let narrationText = pageInformation[1];
      let textContainer = elements.mainTextContainer;

      if (!addedNextListener){
	elements.nextButton.addEventListener('click', execSlide);
	addedNextListener = true;
      }

      if (narrationText.includes('Click the next active link')) {
	for (var i = 0; i < textContainer.length; i++) {
	  if (textContainer[i].tagName === 'A') {
	    textContainer[i].addEventListener('click', execSlide);
	  }
	}
      }

      resolve(pageInformation);
    });
  });
}

function getMainText(elements) {
  return new Promise((resolve, reject) => recurse(resolve));

  function recurse(resolve) {
    elements.mainTextContainer = elements
      .displayDocument
      .contentDocument
      .getElementsByClassName('contentheadertext');

    if (stop_scrape) {
      if (elements.mainTextContainer.length > 0){
        resolve(elements.mainTextContainer[0].innerText);
      }
      else {
        resolve(null);
      }
    }
    else {
      if (elements.mainTextContainer.length > 0) {
	setTimeout(() => {
	  elements.mainTextContainer = eval(elements.mainTextContainer);
	  resolve(elements.mainTextContainer[0].innerText);
	}, 500);
      }
      else {
	setTimeout(() => recurse(resolve), 1000);
      }
    }
  }
}

function getNarration() {
  return new Promise((resolve, reject) => {
    executeInPageContext(storeNarrationTextInElement);

    function recurse(resolve) {
      let narrationEl   = document.querySelector('#old_slide_narration_text');
      let narrationText = narrationEl && narrationEl.value;

      if (narrationText === null ||
	  narrationText.length === 0) { setTimeout(() => recurse(resolve), 1000); }
      else {
	narrationEl.value = '';
	resolve(narrationText);
      }
    }

    recurse(resolve);
  });
}

// this needs to be run inside of the page's world
function storeNarrationTextInElement() {
  getNarrationText()
    .then(text => {
      // if the element doesn't exist, create it
      if (!document.querySelector('#old_slide_narration_text')) {
	var input   = document.createElement('input');
	input.id    = "old_slide_narration_text";
	input.value = text;
	input.setAttribute('type', 'hidden');
	document.body.appendChild(input);
      }
      // otherwise, just set its value
      else {
	document.querySelector('#old_slide_narration_text').value = text;
      }
    });

  function getNarrationText() {
    return new Promise((resolve, reject) => recurse(resolve));
    
    function recurse(resolve) {
      try {
	var old_slide_narration_scraped =
	      document
	      .querySelector('#_RLOCD')
	      .contentDocument
	      .querySelector('#display')
	      .contentWindow
	      .GetNarrationText();

	if (old_slide_narration_scraped === "") { throw new Error("No text");           }
	else                                    { resolve(old_slide_narration_scraped); }
      }
      catch (err) { setTimeout(() => recurse(resolve), 1000); }
    }
  }
}

function getSlideID(elements) {
  return new Promise((resolve, reject) => {
    let expr   = 'elements.displayDocument.contentDocument.getElementsByTagName("embed")';
    let config = {
      currentTimeout : 0,
      maxTimeout     : 5000,
      elements       : elements
    };

    getElByExpr(expr, config)
      .then(embed => {
        setTimeout(() => {stop_scrape = true; resolve(embed[0].src); console.log(xmlText);}, 1000);
      });
  });
}

function sendRequest(pageInformation) {
  let htmlText      = pageInformation[0];
  let narrationText = pageInformation[1];
  let slideID       = pageInformation[2];

  let request = {
    message : 'new-html-page',
    data    : {
      slideId       : slideID,
      narrationText : narrationText,
      xmlText       : xmlText
    }
  };

  if (xmlText === '') {
    request.data.xmlText = null;
  }

  if (htmlText === null) {
    request.data.htmlText = null;
  }
  else {
    let textArray = htmlText.split('\n')
	  .filter(text => text.match(/\w/g))
	  .map   (text => text.trim());
    request.data.htmlText = textArray;
  }

  chrome.runtime.sendMessage(request);

  stop_scrape = false;
  xmlText     = null;
}

//
// Executing a script in the context of the page
//
// NOTE: arguments should be passed as separate parameters from
// the function itself (e.g. executeInPageContext(function(param1){}, param1))
var executeInPageContext = function(fn) {
  var args = '';
  if (arguments.length > 1) {
    for (var i = 1, end = arguments.length - 2; i <= end; i++) {
      args += typeof arguments[i]=='function' ? arguments[i] : JSON.stringify(arguments[i]) + ', ';
    }
    args += typeof arguments[i]=='function' ? arguments[arguments.length - 1] : JSON.stringify(arguments[arguments.length - 1]);
  }

  var script = document.createElement('script');
  script.setAttribute("type", "application/javascript");
  script.textContent = '(' + fn + ')(' + args + ');';
  document.documentElement.appendChild(script); // run the script
  document.documentElement.removeChild(script); // clean up
};

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var msg  = request.message;
    var data = request.data;

    if (msg == 'stop-scrape') {
      xmlText = data;
    }
  });
