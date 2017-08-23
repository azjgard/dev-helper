module.exports = function($template, meta) {

  //// RUN MAIN CODE
  $template.setHeader(); 
  $template.setBullets(meta.numBulletPoints); 

  //// CHANGE WHATEVER YOU WANT TO
  $template.runCode(function($, $xmlDoc) {
    // we can run custom jquery code here too
    $xmlDoc.find('ImageLayout').attr('position', meta.imageLayout);
  });

  //// SEND EVERYTHING TO HTML PAGE
  $template.finish();
};

// add all the different file types (might be better if they do that)

// For Everett
  // download from github
  // npm install
  // npm build
  // add extension practice
  // add real extension
  // develop a slide
  // help Everett afterward


// TODO
  // Check through instructions for QA Helper
        // fix one spot, and add "download instructions from chrome web store"
        // add this to the J drive somewhere

  // Check through instructions for Dev Helper

  // Leave matometa information of our knowledge of the project (where we think it should go, what could be done - with our tool and possibly others)
        // both
  // 
  //
