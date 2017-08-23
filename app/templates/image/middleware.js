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
