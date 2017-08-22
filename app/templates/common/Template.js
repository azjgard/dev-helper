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
    this.typeOfText = this.getType(),

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
        return xmlText
          .textItems[0].text
          .replace(/<.+?>/g, '');
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

  // removeUnusedNodes(nodeArray){
  //   nodeArray.forEach(node => {
  //     let $tag = this.$template.find(node);
  //     let tagId = $tag.attr('id');
  //     // remove tag
  //     $tag.remove();
  //     // remove cuelist for tag
  //     this.$template.find(`Effect[target='${tagId}']`).parent().remove();
  //   });
  // }

  setBullets(numBulletPoints) {
    // if(this.slideMeta.slideType.toLowerCase() === 'image'){
    //   // check the narration to see if things need to be split up
    //   if(this.narration.match(/<br\/><br\/>/)){
    //     let narr = this.narration.split(/<br\/><br\/>/);
    //     let arr = [];
    //     for(let i = 0; i < narr.length; i++){
    //       arr.push(`<Instructions>\n${narr[i]}\n</Instructions`);
    //       //make narr.length image slides
    //       //send them to html page
    //     }
    //   }
    // }

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
        return numBulletPoints + 1 === xmlText.textItems.length
          ? xmlText.textItems[i+1].text.replace(/<.+?>/g, '').trim()
          : null;
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
    this.setTxt('Instructions', `\n${this.narration}\n`);
  }

  setAudio() {
    this.setTxt('Audio', this.audio);
  }

  setTitle(){
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

    // if(this.narration){
    //   textArray.push(this.narration);
    // } 

    return textArray;
  }

  export() {
    return {
      xml : this
        .$template
        .find('Slide')[0]
        .outerHTML,
      text   : this.getTextArray()
    };
  }

  finish() {
    this.resolve( this.export() );
  }
}

module.exports = function(slideInfo, resolve, templateName) {
  return new Template(slideInfo, resolve, templateName);
};
