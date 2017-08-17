class Template {

  // first param is slideInfo object
  constructor({HTML, XML, Narration, SlideID, SlideAudio, SlideMeta}, resolution, templateName) {
    let $           = require('jquery');
    let template    = this.setIds(require(`Templates/${templateName}/template.xml`));
    this.$          = $,
    this.resolve    = resolution;

    // DATA
    this.$template  = $(this.$.parseXML(template));
    this.audio      = SlideAudio;
    this.narration  = Narration.replace(/<.+?>/g, '');
    this.xmlText    = Object.keys(XML).length > 0 ? XML : null;
    this.htmlText   = this.getText(this.$, this.parser(HTML, 'text/html'));
    this.slideId    = SlideID;
    this.slideMeta  = SlideMeta;

    // COMMON FUNCTIONS
    this.setAudio();
    this.setCC(); //fix cc 

    // SPECIFIC FUNCTIONS
    // if(this.slideMeta.slideType === 'ImageSomething'){
    this.setTitle(); //only for navigation image slides
    // }
  }

  addXmlStubs(numBulletPoints) {
    numBulletPoints      = parseInt(numBulletPoints, 10);
    let $CueList         = this.$template.find('CueList'),
        $Header          = this.$template.find('Header'),
        $BulletPointList = this.$template.find('BulletPointList'),
        typeOfText       = this.getType(),
        headerText;

    // clear sample bullet and cuelist
    $BulletPointList.empty();
    $CueList.find('Cue>Effect[target="bullet1"]').parent().remove();

    for (var i = 0; i < numBulletPoints; i++) {
      let bulletText  = this.getBulletText(i, this.htmlText, typeOfText, numBulletPoints),
          id          = `bullet${(i+1)}`,
          duration    = 0.5,
          text        = bulletText ? bulletText : `Example_Text_${(i+1)}`,
          triggerTime = 1.0 + (.25 * i); 

      $BulletPointList.append(`<BulletPoint id="${id}">${text}</BulletPoint>\n`);

      $CueList.append(
        `<Cue>
         <Trigger triggerType="Timed" triggerTime="${triggerTime}" />
         <Effect effectType="Visibility" displayMode="Show" target="${id}" effect="fade" duration="${duration}" />
       </Cue>\n`);
    }

    // add header text
    $Header.text(this.getHeader($Header, typeOfText));

    // remove Text node if not being used
    let $Text = this.$template.find('Text');
    $Text.text().includes('Sub_header_Body_Text')
      ? $Text.remove()
      : null;
  }

  getHeader(header, type){
    if(type === 'both'){
      let txt = this.htmlText.header
            ? this.htmlText.header.trim()
            : this.htmlText.headerMargin.trim();
      return txt;
    }
    else if(type === 'xml'){
      let txt = this.xmlText.textItems[0].text;
      return txt.replace(/<.+?>/g, '');
    }
    else if(type === 'html'){
      let txt = this.htmlText.header
            ? this.htmlText.header.trim()
            : this.htmlText.headerMargin.trim();
      return txt;
    }
    return null;
  }

  getType(){
    if(this.xmlText && this.htmlText.content)
      return "both";
    else if(this.xmlText)
      return 'xml'; 
    else if(this.htmlText.content)
      return 'html'; 
    else
      return null; 
  }

  parser(str, conversion){
    let parser = new DOMParser();
    return parser.parseFromString(str, conversion);
  }

  getText($, doc){
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

  getBulletText(i, {content}, type, numBulletPoints){
    if(type === 'both'){
      // the only xml present here should be callout text,
      // which won't go inside BulletPoints
      return numBulletPoints === this.htmlText.content.length
        ? this.htmlText.content[i].trim()
        : null;
    }
    else if(type === 'xml'){
      return numBulletPoints + 1 === this.xmlText.textItems.length
        ? this.xmlText.textItems[i+1].text.replace(/<.+?>/g, '').trim()
        : null;
    }
    else if(type === 'html'){
      return numBulletPoints === this.htmlText.content.length
        ? this.htmlText.content[i].trim()
        : null;
    }
    else return null;
  }

  getHtmlText(){
  }

  runCode(fn) {
    fn(this.$, this.$template);
  }

  setAttr(selector, att, value) {
    this.$template.find(selector).attr(att, value);
  }

  setIds(template) {
    return template
      .replace(/(id="\w+)Id(")/g, '$11$2')
      .replace(/(target="\w+)Id(")/g, '$11$2');
  }

  setTxt(selector, text) {
    this.$template.find(selector).text(text);
  }

  setCC() {
    this.setTxt('Instructions', this.narration);
  }

  setAudio() {
    this.setTxt('Audio', this.audio);
  }

  setTitle(){
  }

  // slideInfo is an object with the HTML, XML, Narration, SlideID,
  // and SlideMeta (e.g. imageLayout, numBulletPoints, slideType)
  textArray(){
    let textArray = [];

    if(this.htmlText){
      for(let key in this.htmlText){
        if(typeof this.htmlText[key] === 'string'){
          textArray.push(this.htmlText[key]);
        }
        else {
          textArray = textArray.concat(this.htmlText[key]);
        }
      }
    } 

    if(this.xmlText){
      for(let key in this.xmlText){
        for(let i = 0; i < this.xmlText[key].length; i++){
          textArray.push(this.xmlText[key][i].text.replace(/<.+?>/g, ''));
        }
      }
    } 

    if(this.narration){
      textArray.push(this.narration);
    } 

    return textArray;
  }

  export() {
    return {
      xml : this
        .$template
        .find('Slide')[0]
        .outerHTML,
      text   : this.textArray()
    };
  }

  finish() {
    this.resolve( this.export() );
  }
}

module.exports = function(slideInfo, resolve, templateName) {
  return new Template(slideInfo, resolve, templateName);
};
