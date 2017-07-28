changeHandler();
var rerun = true;

function changeHandler() {
  console.log('change handler');
  setTimeout(() => {
    evaluateSlide();
  }, 1000);
}


function evaluateSlide() {

  var mainDocument,
      bottomDocument,
      nextButton,
      displayDocument,
      mainTextContainer = [],
      displayBody;

  //call starting function that calls each function below successively
  mainDoc();

  // get main iframe
  function mainDoc(){
    console.log("mainDoc");
    if(document.getElementById('_RLOCD')){
      // the root iframe
      mainDocument = document
        .getElementById('_RLOCD');
      bottomDoc();
    }
    else {
      setTimeout(function(){
        mainDoc();
      }, 1000);
    }
  }
  
  // get navigation bar from bottom
  function bottomDoc(){
    console.log("bottomDoc");
    if(mainDocument.contentDocument.getElementById('FaceBottom')){
      // the bottom frame with nav elements
      bottomDocument = mainDocument
        .contentDocument
        .getElementById('FaceBottom');
      console.log(mainDocument, bottomDocument);
      nButton();
    }
    else {
      setTimeout(function(){
        bottomDoc();
      }, 1000);
    }
  }

// get next button on bottom bar
  function nButton(){
    console.log("nButton");
    // the next ow in the bottom frame
    nextButton = bottomDocument
      .contentDocument
      .getElementById('nextbutton');
    if(nextButton){
      displayDoc();
    }
    else {
      setTimeout(function(){
        nButton();
      }, 1000);
    }
  }

// get main display <frame> within main <iframe>
  function displayDoc(){
    console.log("displayDoc");
    if(mainDocument.contentDocument.getElementById('display')){
      // the center frame with main course elements
      displayDocument = mainDocument
        .contentDocument
        .getElementById('display');
      mainTextCont();
    }
    else {
      setTimeout(function(){
        displayDoc();
      }, 1000);
    }
  }

// get array of all text on the page
  function mainTextCont(){
    console.log("mainTextCont");

    // the container that may or may not have text in it
    mainTextContainer = displayDocument
      .contentDocument
      .getElementsByClassName('regularcontenttext');
    console.log(mainTextContainer);
    if(mainTextContainer.length > 0 || displayDocument.contentDocument.querySelector('table')){
      finish();
    }
    else {
      setTimeout(function(){
        mainTextCont();
      }, 1000);
    }
  }

// set listener on page or just click button and do something with scraped data
  function finish(){
    if(rerun){
      rerun = false;
      mainDoc();
    }
    console.log("finish");
    // the body of the center frame
    displayBody = displayDocument.contentDocument.body;

    if (displayBody.innerText.trim()) {
      console.log(displayBody.innerText.trim());

      mainTextContainer[0].addEventListener('click', changeHandler);
    }
    else {
      console.log('No inner text found.');
      nextButton.addEventListener('click', changeHandler);
    }
  }

}
