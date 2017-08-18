module.exports = function($template, meta) {

  /////////////////////////////////////////////////////////////////////
  //// RUN MAIN CODE

  // fill in audio 
  // fill in instructions 
  // fill in header with text and correct ids 
  // fill in bullets with text and correct ids 
  // remove unnecessary nodes 
  // add/remove appropriate cues 
  
  $template.addXmlStubs(meta.numBulletPoints); 

  /////////////////////////////////////////////////////////////////////


  

  /////////////////////////////////////////////////////////////////////
  //// CHANGE WHATEVER YOU WANT TO

  // $template.setTxt('Header', 'Chris is Awesome');

  $template.setAttr('Instructions', 'Yeah', 'awesomeSauce!');

  $template.runCode(function($, $xmlDoc) {
    // we can run custom jquery code here too
    $xmlDoc.find('ImageLayout').attr('position', meta.imageLayout);
  });

  /////////////////////////////////////////////////////////////////////




  /////////////////////////////////////////////////////////////////////
  //// SEND EVERYTHING TO HTML PAGE

  $template.finish();

  /////////////////////////////////////////////////////////////////////
};

//Below are notes on what things to search for in different xml slides.
//Done:
// AD105 - Analog Circuits, Digital Circuits, Wire Harnesses
//-----------------------------------------------------------------

//click on circles
// initial instructions (title) or instructions (id)
// textitem with id=calloutText#
// callout# (id) for callouts (might be titles in new slide)

//click on blocks on left
// Initial scene text (title) or instructionstext (id)
// <Text> with id=text1 goes with operation0 and so on

//click on tabs at bottom
// initial scene text (title) or operationText0 (id)
// all id's are operationText1 and operationStep1 (etc.)

//click on parts of car shaded by yellow
// initial instructions (title) or instructions (id)
// desc1,2,3,etc. for descriptions (id)
// id=callout# gets the title as well...no definite way to grab the correct one

//click on pictures at left that have tabs in them
// <textItem title="Instructions" desc="" id="instructions"
// <title title="Initial Scene Title" desc="" id="title">

// <title title="Scene 1 - Title" desc="" id="title">
// <title title="Scene 1 - Tab 1 - Title" desc="" id="title">
// <text title="Scene 1 - Tab 1 - Text" desc="" id="text">
// <title title="Scene 1 - Tab 2 - Title" desc="" id="title">
// <text title="Scene 1 - Tab 2 - Text" desc="" id="text">


