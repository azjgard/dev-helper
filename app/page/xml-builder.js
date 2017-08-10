let blacklist = [];
let data   = {
  editors: {
  },
  used_IDs : []
};

document
  .getElementById('test')
  .addEventListener('click', event => {
    addSlide(
      "<head>\n\tthis is some filler text\n</head>",
      ["word1", "word2", "word3", "word4"],
      50
    );
  });

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    let message = request.message;

    if (message === 'add-slide') {
      let data       = request.data;
      let xml        = data.xml;
      let text       = data.text;
      let percentage = data.percentage;

      try {
	addSlide(xml, text, percentage);
	sendResponse({ message: 'Slide added successfully.' });
      }
      catch (err) {
	sendResponse({
	  message : 'Slide addition unsuccessful.',
	  error   : err
	});
      }
    }
  });

function addSlide(xml, words, percentage) {
  try {
    let editorInfo      = addEditor(xml, words);
    let editorContainer = document
	  .getElementById(editorInfo.id)
	  .parentElement;

    let title = editorContainer
	  .querySelector('h2');

    title.innerHTML = `Slide - <span class="percentage">${percentage}</span>`;

    return true;
  }
  catch (err) {
    console.log(err);
    return false;
  }
}

function addEditor(initialText, wordsArray) {
  let editorInfo = initializeEditor(data.used_IDs,
				    initialText,
				    wordsArray);
  data.editors[editorInfo.id] = editorInfo.editor;

  return editorInfo;
}

function initializeEditor(blacklist, initialText, words) {
  let textAreaID = createEditor(blacklist,
				initialText,
				words);
  let textArea   = document.getElementById(textAreaID);
  let editor     = CodeMirror.fromTextArea(textArea, {
    mode          : "text/xml",
    lineNumbers   : true,
    matchBrackets : true,
    theme: 'dracula',
    indentUnit: 4,
    smartIndent: true,
    showCursorWhenSelecting: true,
    tabIndex: 5,
    autofocus: true
    // scrollbarStyle: "null"
  });

  let editorContainer = document
	.getElementById(textAreaID)
	.parentElement;

  updateMatches(editorContainer, editor);

  editorContainer
    .addEventListener('click', handleClicks);

  editorContainer
    .addEventListener('keyup', e => {
      updateMatches(editorContainer, editor);
    });

  return {
    id: textAreaID,
    editor
  };
}

function handleClicks(ev) {
  let editorContainer = ev.currentTarget;

  let textareas = editorContainer
	.getElementsByTagName('textarea');

  let hiddenEditor  = textareas[0];
  let visibleEditor = textareas[1];

  let ID = hiddenEditor.id;

  // we always need to focus the editor
  // first before actually doing anything else
  visibleEditor.focus();

  // if it was a word that was clicked
  if (ev.target.className === 'word') {
    let word               = ev.target;
    let codeMirrorInstance = data.editors[ID];

    insertWordBlock(word, codeMirrorInstance);
    updateMatches(editorContainer, codeMirrorInstance);
  }
}

function insertWordBlock(word, editor) {
  editor.replaceSelection(word.innerText);
}

function updateMatches(editorContainer, codeMirror) {
  let words = editorContainer
	.querySelector('.words-container')
	.querySelectorAll('.word');
  let code = codeMirror.getValue();

  for (let i = 0; i < words.length; i++) {
    let text = words[i].innerText;
    if (code.includes(text)) words[i].classList.add(
      'in-xml');
    else words[i].classList.remove('in-xml');
  }
}

function createEditor(blacklist, initialText, wordsArray) {
  let template = getTemplate('slide-template').trim();

  let element       = document.createElement('div');
  element.innerHTML = template;

  let editorContainer = element
	.getElementsByClassName('editor-container')[0];
  let wordsContainer  = element
	.getElementsByClassName('words-container')[0];

  let editorArea = document.createElement('textarea');
  editorArea.id  = generateID(blacklist);

  if (initialText) editorArea.innerHTML = initialText;
  if (wordsArray) addSlideWords(wordsContainer, wordsArray);

  editorContainer.appendChild(editorArea);
  document.body.appendChild(editorContainer);

  return editorArea.id;
}

function addSlideWords(container, wordsArray) {
  for (let i = 0; i < wordsArray.length; i++) {
    let word           = document.createElement('span');
    word.className = 'word';
    word.innerHTML = wordsArray[i];

    container.appendChild(word);
  }
}

// this function will generate a unique ID for each CodeMirror instance
// that is not currently contained within the blacklist
function generateID(blacklist) {
  var text        = "";
  var blacklisted = false;
  var possible    = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
	"abcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < Math.floor(Math.random() * 800); i++)
    text += possible
    .charAt(Math.floor(Math.random() * possible.length));

  for (let i = 0; i < blacklist.length; i++)
    if (blacklist[i] === text) blacklisted = true;

  if (blacklisted) {
    generateID(blacklist);
    return '';
  }
  else {
    blacklist.push(text);
    return text;
  }
}

function getTemplate(id) {
  return document.getElementById(id).innerHTML;
}

///////////////////
// Menu Functions

function toggleMenu(e) {
  let menu = document.querySelector('#menu');

  if (menu.className.includes('visible')) {
    menu.classList.remove('visible');
  }
  else {
    menu.classList.add('visible');
  }
}

function exportXML(e) {
  let editors   = data.editors;
  let xmlString = '';

  for (let i in editors) {
    let editor     = editors[i];
    let editorText = editor.getValue();
    xmlString += editorText;
  }

  save(xmlString);
}

function save(xmlString) {
  // TODO: download a file or save to the server

  console.log('Exported:');
  console.log('---------------');
  console.log(xmlString);
  console.log('---------------');
}

document
  .querySelector('#show-menu')
  .addEventListener('click', toggleMenu);

document
  .querySelector('#close')
  .addEventListener('click', toggleMenu);

document
  .querySelector('#export')
  .addEventListener('click', exportXML);
