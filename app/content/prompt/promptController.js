let templates = require('./templates/promptTemplate.js');
let prompt    = require('./prompt.js');

function getSlideInformation() {
  return new Promise((resolve, reject) => {
    prompt(templates.slideType)
      .then(response => {
        let slideType = response.slideType;

	if (!slideType) return Promise.resolve(false);
	else {
          slideType = firstLetterLow(slideType);
	  if (templates.slides.hasOwnProperty(slideType)) {
	    return prompt(templates.slides[slideType]);
	  }
	  else {
            console.error(`You don't have a slide type named ${slideType}`);
	    return Promise.resolve(false);
	  }
	}

        function firstLetterLow(string){
          return string.charAt(0).toLowerCase() + string.slice(1);
        }
      })
      .then(resolve);
  });
}

module.exports = getSlideInformation;
