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
    let html = parser(this.html, 'text/html');
    let htmlText = getText(this.$, html);
    let $BulletPoints = this.$template.find('BulletPoint');
    let $Header = this.$template.find('Header');

    console.log(this.xml);
    console.log(htmlText);
    for(let i = 0; i < $BulletPoints.length; i++){
      // xml and html
      if(Object.keys(this.xml).length > 0 && htmlText.content){
        // the only xml present here should be callout text,
        // which won't go inside BulletPoints
        $Header.textContent = htmlText.content[i].trim();
        if($BulletPoints.length + 1 === htmlText.content.length){
          $BulletPoints[i].textContent = htmlText.content[i].trim();
        }
      }
      // only xml
      else if(Object.keys(this.xml).length > 0){
        if($BulletPoints.length + 1 === this.xml.textItems.length){
          $BulletPoints[i].textContent = this.xml.textItems[i+1].text.replace(/<.+?>/g, '').trim();
        }
      }
      // only html
      else if(htmlText.content){
        if($BulletPoints.length === htmlText.content.length){
          $BulletPoints[i].textContent = htmlText.content[i].trim();
        }
      }
      // no text
      else {
        console.log('no text at all!!!');
        // throw new Error("There was no text at all!");
      }
    }

    function parser(str, conversion){
      let parser = new DOMParser();
      return parser.parseFromString(str, conversion);
    }

    function getText($, doc){
      let body             = $(doc.body),
          contentText      = body.find('.regularcontenttext>ul'),
          headerText       = body.find('.headertext'),
          headerTextMargin = body.find('.headertexttopmargin'),
          content          = null,
          header           = null,
          headerMargin     = null;
      
      if(contentText.length){
        let lis      = Array.from(contentText[0].querySelectorAll('li'));
        content      = lis.map(li => { return li.textContent; }); 
      }
      if(headerText.length){
        header       = headerText[0].textContent.trim();
      }
      if(headerTextMargin.length){
        headerMargin = headerTextMargin[0].textContent.trim();
      }
      return {content, header, headerMargin};
    }
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
