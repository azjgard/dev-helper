let $ = require('jquery');
	require('jquery-ui-bundle/jquery-ui.js');
	require('jquery-ui-bundle/jquery-ui.min.css');

require('./prompt.css');

let transitionLength = 750; // milliseconds

function generateInnerHtml(config) {
  let htmlString = '';

  for (var i = 0; i < config.length; i++) {
    htmlString += `<p>${config[i].text}</p>`;
    htmlString += `<select name="${config[i].name}">`;

    for (var x = 0; x < config[i].options.length; x++) {
      let option = config[i].options[x];
      htmlString += `<option>${option}</option>`;
    }

    htmlString += '</select>';
  }

  return htmlString;
}

function promptUser(config) {
  return new Promise((resolve, reject) => {
    let prompt  = document.querySelector('.custom-prompt');
    let exists  = prompt !== null;
    let selects = null;

    if (!exists) {
      prompt           = document.createElement('div');
      prompt.innerHTML = generateInnerHtml(config) + '<button class="ui-button">Submit</button><button class="ui-button">X</button>';
      prompt.className = 'custom-prompt';
      document.body.appendChild(prompt);
    }

    prompt  = document.querySelector('.custom-prompt');
    selects = prompt.querySelectorAll('select');

    $(prompt).draggable({ cancel: '.ui-button' });

    for (let i = 0; i < selects.length; i++) {
      $(selects[i]).selectmenu();
    }

    // the timeout puts the show function at the bottom of the queue,
    // ensuring we get the nice fade-in effect
    setTimeout(() => showPrompt(prompt), 20);

    // 'Submit' button
    document
      .querySelector('.custom-prompt button')
      .addEventListener('click', e => {
	hidePrompt(prompt);

	// the timeout is so that the promise only resolves
	// once the dialog is fully faded out
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
  let selects = prompt.querySelectorAll('select');
  let data    = {};

  // for (let i = 0; i < selects.length; i++) {
  //   let select = selects[i];
  //   let name   = select.name;

  //   data[name] = $(select).val();
  // }

  // return data;
  return $(selects[0]).val();
}

function showPrompt(prompt) {
  prompt.classList.add('visible');
}

function hidePrompt(prompt) {
  prompt.classList.remove('visible');

  // timeout length should match the transition length for the .custom-prompt class CSS
  setTimeout(() => prompt.remove(), transitionLength);
}

module.exports = promptUser;
