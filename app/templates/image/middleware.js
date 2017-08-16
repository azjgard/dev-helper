module.exports = function($template, meta) {

  $template.runCode(function($, $xmlDoc) {
    // we can run custom jquery code here too
    $xmlDoc.find('ImageLayout').attr('position', meta.imageLayout);
  });

  $template.createBulletList(meta.numBulletPoints);
  $template.fillBullets(meta.numBulletPoints);
  $template.setTxt ('Header', 'Chris is Awesome');

  $template.finish();
};
