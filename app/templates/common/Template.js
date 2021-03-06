class Template {

  constructor({HTML, XML, XMLtext, Narration, SlideID, SlideAudio, SlideMeta}, resolution, templateName) {
    let $        = require('jquery');
    let template = this.setIds(require(`Templates/${templateName}/template.xml`));
    this.$       = $,
    this.resolve = resolution;


    // DATA
    this.narration      = Narration;
    this.multipleSlides = this.checkNarration();
    this.$multiTemplate  = null;
    this.stringTemplate = template;
    this.$template      = $(this.$.parseXML(template));
    this.audio          = SlideAudio;
    this.xmlText        = Object.keys(XML).length > 0 ? XML : null;
    this.xmlTextAll     = XMLtext;
    this.htmlText       = this.getText(this.$, this.parser(HTML, 'text/html'));
    this.slideId        = SlideID;
    this.slideMeta      = SlideMeta;
    this.typeOfText     = this.getType(),

    // COMMON FUNCTIONS
    this.setAudio();
    this.setCC(); //fix cc 

    // SPECIFIC FUNCTIONS
    // if(this.slideMeta.slideType === 'ImageSomething'){
    this.setTitle(); //only for navigation image slides
    // }
  }

  setHeader() {
    this.setTxt('Header', getHeader(this.typeOfText, this.htmlText, this.xmlText));

    function getHeader(type, {header, headerMargin}, xmlText){
      if(type === 'both'){
        return header
          ? header.trim()
          : headerMargin.trim();
      }
      else if(type === 'xml'){
        return xmlText.textItems !== undefined
          ? xmlText.textItems[0].text.replace(/<.+?>/g, '')
          : 'Sample_Header_Text';
      }
      else if(type === 'html'){
        return header
          ? header.trim()
          : headerMargin.trim();
      }
      return "Sample_Header_Text";
    }
  }

  removeNode(node, position, reference){
    if(node !== undefined && position !== undefined && reference !== undefined){
      let $ref = this.$template.find(reference);
      let pos = position === 'before'
            ? 'prev'
            : position    === 'after'
            ? 'next'
            : position    === 'child'
            ? 'children'
            : null;
      if(!pos) throw new Error("You must provide the position of the node you are looking for");

      let $selected = $ref[pos]();
      if($selected.length > 0 && $selected[0].tagName === node){
        // remove node
        let $tag = this.$($selected[0]);
        let tagId = $tag.attr('id');
        // remove tag
        $tag.remove();
        // remove cuelist for tag
        this.$template.find(`Effect[target='${tagId}']`).parent().remove();
      }
    }
    else {
      throw new Error("You must provide a node to remove, the position of that node, and a reference node");
    }
  }

  setBullets(numBulletPoints) {
    numBulletPoints      = parseInt(numBulletPoints, 10);
    let $BulletPointList = this.$template.find('BulletPointList'),
        $CueList         = this.$template.find('CueList'),
        headerText;

    // clear sample bullet and cuelist
    $BulletPointList.empty();
    $CueList.find('Cue>Effect[target="bullet1"]').parent().remove();

    // add bullets and cuelists
    for (var i = 0; i < numBulletPoints; i++) {
      let bulletText  = getBulletText(i, this.htmlText, this.xmlText, this.typeOfText, numBulletPoints),
          id          = `bullet${(i+1)}`,
          text        = bulletText ? bulletText : `Example_Text_${(i+1)}`,
          duration    = 0.5,
          triggerTime = 1.0 + (.25 * i); 
      $BulletPointList.append(`<BulletPoint id="${id}">${text}</BulletPoint>\n`);
      $CueList.append(
        `<Cue>
         <Trigger triggerType="Timed" triggerTime="${triggerTime}" />
         <Effect effectType="Visibility" displayMode="Show" target="${id}" effect="fade" duration="${duration}" />
       </Cue>\n`);
    }

    function getBulletText(i, {content}, xmlText, type, numBulletPoints){
      if(type === 'both'){
        // the only xml present here should be callout text,
        // which won't go inside BulletPoints
        return numBulletPoints === content.length
          ? content[i].trim()
          : null;
      }
      else if(type === 'xml'){
        if(xmlText.textItems !== undefined){
          return numBulletPoints + 1 === xmlText.textItems.length
            ? xmlText.textItems[i+1].text.replace(/<.+?>/g, '').trim()
            : null;
        }
        else return null;
      }
      else if(type === 'html'){
        return numBulletPoints === content.length
          ? content[i].trim()
          : null;
      }
      else return null;
    }
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

  runCode(fn) {
    fn(this.$, this.$template);
  }

  setAttr(selector, att, value) {
    this.$template.find(selector).attr(att, value);
  }

  // replaces sample ids with the correct ids at start
  setIds(template) {
    return template
      .replace(/(id="\w+)Id(")/g, '$11$2')
      .replace(/(target="\w+)Id(")/g, '$11$2');
  }

  setTxt(selector, text) {
    this.$template.find(selector).text(text);
  }

  setCC() {
    if(this.multipleSlides){
      let $         = this.$,
          arr       = '<Section>',
          xml       = this.stringTemplate,
          xmlDoc    = this.$template,
          narration = this.narration
            .split(/<br\/><br\/>/)
            .filter (n => { return n.replace(/<.+?>/g, '').trim() ? true : false; });

      narration.forEach((slide, index) => {
        if(index === 0){
          let $instructions = xmlDoc.find('Instructions');
          $instructions.text(`\n${slide.replace(/.+<.+?>(.+)/g, '$1').replace(/<.+?>/g, '').trim()}\n`);
          arr += xmlDoc.find('Slide')[0].outerHTML;
        }
        else {
          let newDoc = $(this.parser(xml, 'text/xml'));
          let $instructions = $(newDoc).find('Instructions');
          $instructions.text(`\n${slide.replace(/.+<.+?>(.+)/g, '$1').replace(/<.+?>/g, '').trim()}\n`);
          arr += $(newDoc).find('Slide')[0].outerHTML;
        }
      });
      this.$multiTemplate = $(this.parser(arr + '</Section>', 'text/xml'));
    }
    else {
      this.setTxt('Instructions', `\n${this.narration.replace(/<.+?>/g, '')}\n`);
    }
  }

  setAudio() {
    this.setTxt('Audio', this.audio);
  }

  setTitle(){
  }

  checkNarration(){
    let narration = this.narration;
    if(narration.match(/<br\/><br\/>/)) { return true; }
    else                                { return false; }
  }

  createNode({referenceNode, newNode, text, attr, type}){
    if(referenceNode !== undefined && newNode !== undefined){
      let str = `<${newNode}`;
      let $reference = this.$template.find(referenceNode);

      // create node
      if(attr !== undefined){
        str = addAttrAndText(attr, str);
      }
      else {
        str = addTextOnly(str);
      }

      // add node to document
      if     (type === 'after')   { $reference.after(str); }
      else if(type === 'before')  { $reference.before(str); }
      else if(type === 'append')  { $reference.append(str); }
      else if(type === 'prepend') { $reference.prepend(str); }
      else {
        throw new Error("You must provide the type of action you want to perform (append, prepend, after, before)");
      }
    }
    else {
      throw new Error("You must provide a referenceNode and a newNode property to the object you pass in to $template.createNode");
    }

    function addTextOnly(string){
      return string += `>${text !== undefined ? text : 'Filler_Text'}</${newNode}>`;
    }

    function addAttrAndText(at, string){
      at.forEach(a => {
        string += ` ${a.name}="${a.value}"`;
      });
      return addTextOnly(string);
    }
  }

  getTextArray(){
    let textArray = [];

    if(this.htmlText){
      for(let key in this.htmlText){
        if(this.htmlText[key]){
          if(typeof this.htmlText[key] === 'string'){
            textArray.push(this.htmlText[key]);
          }
          else {
            textArray = textArray.concat(this.htmlText[key]);
          }
        }
      }
    } 

    if(this.xmlTextAll){
      for(let i = 0; i < this.xmlTextAll.length; i++){
        textArray.push(this.xmlTextAll[i]);
      }
    } 

    // if(this.narration){
    //   textArray.push(this.narration);
    // } 

    return textArray;
  }

  export() {
    if(this.multipleSlides){
      return {
        xml : this
          .$multiTemplate
          .find('Section')[0]
          .outerHTML
          .replace(/<\/Slide>/g, '</Slide>\n\n'),
        text   : this.getTextArray()
      };
    }
    else {
      return {
        xml : this
          .$template
          .find('Slide')[0]
          .outerHTML,
        text   : this.getTextArray()
      };
    }
  }

  finish() {
    this.resolve( this.export() );
  }
}

module.exports = function(slideInfo, resolve, templateName) {
  return new Template(slideInfo, resolve, templateName);
};
