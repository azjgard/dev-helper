class Template {

  // slideInfo is an object with the HTML, XML, Narration, SlideID,
  // and SlideMeta (e.g. imageLayout, numBulletPoints, slideType)
  constructor(slideInfo, resolution, templateName) {
    let $         = require('jquery');
    let template  = require(`Templates/${templateName}/template.xml`);

    this.$ = $;

    this.resolve   = resolution;
    this.slideInfo = slideInfo;
    this.html = slideInfo.HTML;
    this.xml = slideInfo.XML;
    this.$template = $(this.$.parseXML(template));
    this.setCC();
  }

  createBulletList(numBulletPoints) {
    let $CueList         = this.$(this.$template.find('CueList')[0]);
    let $BulletPointList = this.$(this.$template.find('BulletPointList')[0]);

    $BulletPointList.empty();

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

  fillBullets(numBulletPoints){
    let html = this.parseDoc(this.html);
    console.log(html);
    let $BulletPoints = this.$template.find('BulletPoint');
    for(let i = 0; i < $BulletPoints.length; i++){
      if(this.xml.keys !== undefined && this.html)
      if(this.xml.keys !== undefined){
        $BulletPoints[i].text(this.slideInfo.XML);
      }
    }
  }

  parseDoc(){
    return this.$.parseHTML(this.html);
  }

  getHtmlText(){
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
