changeHandler();

function changeHandler() {
  console.log('change handler');
  setTimeout(() => {
    evaluateSlide();
  }, 1000);
}

function evaluateSlide() {
  // the root iframe
  var mainDocument = document
	.getElementById('_RLOCD').contentDocument;

  // the bottom frame with nav elements
  var bottomDocument = mainDocument
	.getElementById('FaceBottom')
	.contentDocument;
  // the next arrow in the bottom frame
  var nextButton = bottomDocument.getElementById('nextbutton');

  // the center frame with main course elements
  var displayDocument = mainDocument
	.getElementById('display')
	.contentDocument;
  // the body of the center frame
  var displayBody = displayDocument.body;
  // the container that may or may not have text in it
  var mainTextContainer = displayDocument
	.getElementsByClassName('regularcontenttext');

  if (displayBody.innerText.trim()) {
    console.log(displayBody.innerText.trim());

    mainTextContainer[0].addEventListener('click', changeHandler);
  }
  else {
    console.log('No inner text found.');
    nextButton.addEventListener('click', changeHandler);
  }
}
