let templates = require('./templates/promptTemplate.js');
let prompt    = require('./prompt.js');

function getSlideInformation() {
  return new Promise((resolve, reject) => {
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
      })
      .then(resolve);
  });
}

module.exports = getSlideInformation;
