let $      = require('jquery');
let common = require('./common.js');

function image(slideInfo) {
  let xmlString = require('./image.xml');
  let $template = common.initializeTemplate(xmlString, slideInfo);

  let XML  = slideInfo.XML;
  let HTML = slideInfo.HTML;

  // set the "position" of the "ImageLayout" tag
  $template.find('ImageLayout').attr('position', slideInfo.SlideMeta.imageLayout);

  // add bullet points and their cues
  let $BulletPointList = $template.find('BulletPointList')[0];
  let $CueList         = $template.find('CueList')[0];

  let numBulletPoints  = slideInfo.SlideMeta.numBulletPoints;

  for (var i = 0; i < numBulletPoints; i++) {
    let id          = `bullet${i}`;
    let duration    = 0.5;
    let triggerTime = 0.0; // TODO: change me to be dynamic

    $BulletPointList.append(`<BulletPoint id=${id}>Example Text</BulletPoint>`);
    $CueList.append(
                    `<Cue>
                       <Trigger triggerType="Timed" triggerTime="${triggerTime}" />
                       <Effect effectType="Visibility" displayMode="Show" target=${id} effect="fade" duration="${duration}" />
                     </Cue>`
    );
  }

  return {
    xml  : common.getSlideHTML($template),
    text : ['example', 'text'],
    percentage: slideInfo.SlideMeta.slidePercent || '000%'
  };
}

module.exports = image;

