let prompt = require('./prompt.js');
let config = [
  [
    {
      name: 'slideType',
      text: 'What will the new slide type be?',
      options: [
	'Image'						,
	'Quiz'						,
	'Video'
      ]
    }
  ],
  {
    image: [
      {
	text: 'Which type of image slide?',
	options: [
	  'Image Left',
	  'Image Right',
	  'Image Center'
	]
      }
    ],
    quiz: [
      {
	text: 'How many questions?',
	options: ['1', '2', '3', '4', '5', '6', '7']
      }
    ],
    video: [
      {
	text: 'You\'ve reached the video slide.',
	options: [
	  'There is only one option..'
	]
      }
    ]
  }
];

let data = {};

function promptUser(index, response, dataObject) {
  let currentConfig = config[index];

  // 0 is a special case because there will not be any
  // config[index][responseKey]
  if (index === 0) {
    prompt(currentConfig).then((res) => promptUser(1, res, dataObject));
  }
  else {
    try {
      let responseKey = response.toLowerCase();
      if (!config[index][responseKey]) { return; }
      else {
	prompt(config[index][responseKey]).then((res) => promptUser(index + 1, res, dataObject));
      }
    }
    catch (e) { return; }
  }
}

promptUser(0, null, data);

// promptUser(0, null, data);

// prompt('What design type will this slide be converted to?', true)
//   .then(type => {
//     global.type = type;

//       switch(type) {
//       case 'image':
// 	return prompt('Why do you like images?');
// 	break;
//       case 'quiz':
// 	return prompt('Why do you like quizzes?');
// 	break;
//       case 'exam':
// 	return prompt('Why do you like exams?');
// 	break;
//       default:
// 	return prompt('Why did you not give a valid answer?');
// 	break;
//       }
//   });
