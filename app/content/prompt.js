require('./prompt.css');

function promptUser(text) {
  return new Promise((resolve, reject) => {
    let prompt = document.querySelector('.custom-prompt');
    let exists = prompt !== null;

    // create the prompt if it does not exist
    if (!exists) {
      prompt           = document.createElement('div');
      prompt.innerHTML = `<p>${text}</p><input type="text" /><button>Submit</button><button>X</button>`;
      prompt.className = 'custom-prompt';
      document.body.appendChild(prompt);
    }
    else {
      prompt.querySelector('p').innerHTML = text;
    }

    // ensure we have the correct DOM reference
    prompt = document.querySelector('.custom-prompt');

    // the timeout puts the show function at the bottom of the queue,
    // ensuring we get the nice fade-in effect
    setTimeout(() => showPrompt(prompt), 20);

    // 'Submit' button
    document
      .querySelector('.custom-prompt button')
      .addEventListener('click', e => {
	hidePrompt(prompt);
	resolve(prompt.querySelector('input').value);
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

function showPrompt(prompt) { prompt.classList.add('visible');    }
function hidePrompt(prompt) {
  prompt.classList.remove('visible');

  // timeout length should match the transition length for the .custom-prompt class CSS
  setTimeout(() => prompt.remove(), 750);
}

module.exports = promptUser;
