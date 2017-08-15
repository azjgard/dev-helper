let $      = require('jquery');
let common = require('../common/common.js');

function image(slideInfo) {
  let xmlString = require('./template.xml');
  let $template = common.initializeTemplate(xmlString, slideInfo);

  let XML = slideInfo.XML;

  // this is an example, but really we could have as many ||s
  // as we need to to account for different slides being laid
  // out with different tags.
  let header = XML.Instructions ? XML.Instructions[0].text :
	       XML.textItems    ? XML.textItems[0].text    :
	       'Header_Text';

  // we need to add a BulletPoint and a new Cue as many
  // times as there are numBulletPoints.
  let $CueList         = $template.find('CueList')[0];
  let $BulletPointList = $template.find('BulletPointList')[0];
  let numBulletPoints  = slideInfo.SlideMeta.numBulletPoints;

  if(numBulletPoints > 0){
    // remove the sample bullet point
    $BulletPointList.empty();
  }

  for (var i = 0; i < numBulletPoints; i++) {
    let id          = `bullet${(i+1)}`;
    let duration    = 0.5;
    let text        = `Example_Text_${(i+1)}`;
    let triggerTime = 1.0 + (.25 * i); 

    $BulletPointList.append(`<BulletPoint id="${id}">${text}</BulletPoint>\n`);

    $CueList.append(
      `<Cue>
         <Trigger triggerType="Timed" triggerTime="${triggerTime}" />
	 <Effect effectType="Visibility" displayMode="Show" target="${id}" effect="fade" duration="${duration}" />
       </Cue>\n`);
  }

  $template.find('Header').text(header).attr('id', 'header1');

  $template
    .find('ImageLayout')
    .attr('position', slideInfo.SlideMeta.imageLayout);

  return common.getSlideHTML($template);
}

module.exports = image;
