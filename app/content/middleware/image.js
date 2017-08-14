// $xml - a jquery object containing the new slide template
// meta - the meta data gathered from the old slide
// data - the text pulled from the old slide XML
function populate($xml, meta, data) {
  let position = '';

  if (meta.imageLayout.match(/lower/i))       { position = "Lower";  }
  else if (meta.imageLayout.match(/left/i))   { position = "Left";   }
  else if (meta.imageLayout.match(/right/i))  { position = "Right";  }
  else if (meta.imageLayout.match(/center/i)) { position = "Center"; }

  $xml.find('ImageLayout').attr('position', position);

  // for each bullet, we need to generate a new BulletPoint tag (with an accompanying id),
  // and a new Cue (with an id that matches the BulletPoint + incrementing duration
  // attributes)
  let numberOfBullets = parseInt(meta.numberOfBullets);

  // this is a copy of the Cue tag that we're going to clone
  let $cue = $xml.find('Cue')[0];

  return $xml.html();
}

module.exports = populate;
