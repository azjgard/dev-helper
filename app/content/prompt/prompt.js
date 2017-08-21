let $ = require('jquery');
	require('jquery-ui-bundle/jquery-ui.js');
	require('jquery-ui-bundle/jquery-ui.min.css');

require('./prompt.css');

let transitionLength = 750; // milliseconds

// these track the prompt position
// when the user drags it around and ensure
// that it always appears where it is expected to
let left = '643px';
let top  = '278px';

function promptUser(innerHtml) {
  return new Promise((resolve, reject) => {

    let prompt  = document.querySelector('.custom-prompt');
    let exists  = prompt !== null;
    let selects = null;

    if (!exists) {
      prompt           = document.createElement('div');
      prompt.innerHTML = innerHtml +
	'<button class="ui-button">Submit</button><button class="ui-button">X</button>';
      prompt.className = 'custom-prompt';

      document.body.appendChild(prompt);
    }

    prompt  = document.querySelector('.custom-prompt');
    selects = prompt.querySelectorAll('select');

    prompt.style.left = left;
    prompt.style.top  = top;

    // allow the prompt to be dragged around
    $(prompt).draggable({ cancel: '.ui-button' });

    // initialize jquery-ui input elements
    $('.custom-prompt select').selectmenu();
    $('.custom-prompt input[type="radio"]').checkboxradio();

    // the timeout puts the showPrompt function at the bottom of the queue,
    // ensuring we get the nice fade-in effect
    setTimeout(() => showPrompt(prompt), 20);

    // 'Submit' button
    document
      .querySelector('.custom-prompt button')
      .addEventListener('click', e => {
	hidePrompt(prompt);

	// the timeout is so that the promise only resolves
	// once the dialog is fully faded out; this allows easy
	// prompt chaining
	setTimeout(() => resolve(getPromptData(prompt)), transitionLength);
      });

    // 'X' button
    document
      .querySelectorAll('.custom-prompt button')[1]
      .addEventListener('click', e => {
	hidePrompt(prompt);
	resolve(false);
      });
  });
}

function getPromptData(prompt) {
  let selects   = prompt.querySelectorAll('select');
  let fieldsets = prompt.querySelectorAll('fieldset');
  let data      = {};

  for (let i = 0; i < selects.length; i++) {
    let select = selects[i];
    let key    = select.name;
    data[key]  = $(select).val();
  }

  for (let i = 0; i < fieldsets.length; i++) {
    let fieldset = fieldsets[i];
    let children = fieldset.children;
    let key      = fieldset.name;

    for (var x = 0; x < children.length; x++) {
      let child = children[x];

      if (child.tagName === 'INPUT' && child.checked) {
	let id       = child.id;
	let selector = `label[for="${id}"]`;
	let value    = $(fieldset)
	      .children(selector)
	      .text()
	      .trim();
	data[key] = value;
      }
    }
  }
  console.log(data);
  return data;
}

function showPrompt(prompt) {
  prompt.classList.add('visible');
}

function hidePrompt(prompt) {
  prompt.classList.remove('visible');

  left = prompt.style.left;
  top  = prompt.style.top;

  setTimeout(() => clear(prompt), transitionLength);
}

function clear(prompt) {
  prompt.remove();
  $('.ui-selectmenu-menu').remove();
}

module.exports = promptUser;
