class Template {

  constructor(slideInfo, resolution, templateName) {
    let $         = require('jquery');
    let template  = require(`Templates/${templateName}/template.xml`);

    this.$ = $;

    this.resolve   = resolution;
    this.slideInfo = slideInfo;
    this.$template = $(this.$.parseXML(template));
    this.setCC();
  }

  createBulletList(numBulletPoints) {
    let $CueList         = this.$template.find('CueList')[0];
    let $BulletPointList = this.$template.find('BulletPointList')[0];

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
  }

  runCode(fn) {
    fn(this.$, this.$template);
  }

  setAttr(selector, att, value) {
    this.$template.find(selector).attr(att, value);
  }

  setTxt(selector, text) {
    this.$template.find(selector).text(text);
  }

  setCC() {
    this.setTxt('Instructions', this.slideInfo.Narration);
  }

  export() {
    return this
      .$template
      .find('Slide')[0]
      .outerHTML;
  }

  finish() {
    this.resolve( this.export() );
  }
}

module.exports = function(slideInfo, resolve, templateName) {
  return new Template(slideInfo, resolve, templateName);
};
