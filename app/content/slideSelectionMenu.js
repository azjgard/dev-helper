let templates = require('./templates/promptForms.js');
let prompt    = require('./prompt.js');

prompt(templates.slideType)
  .then(response => {
    let slideType = response.slideType;

    if (slideType.match(/quiz/i)) {
      return prompt(templates.slides.quiz);
    }
    else if (slideType.match(/image/i)) {
      return prompt(templates.slides.image);
    }
    else if (slideType.match(/exam/i)) {
      return prompt(templates.slides.exam);
    }

    return Promise.resolve();
  });

