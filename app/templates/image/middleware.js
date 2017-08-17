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

  $template.runCode(function($, $xmlDoc) {
    // we can run custom jquery code here too
    $xmlDoc.find('ImageLayout').attr('position', meta.imageLayout);
    // $template.setTxt ('Header', 'Chris is Awesome');
  });

  /////////////////////////////////////////////////////////////////////




  /////////////////////////////////////////////////////////////////////
  //// SEND EVERYTHING TO HTML PAGE

  $template.finish();

  /////////////////////////////////////////////////////////////////////
};
