
const $ = require('jquery');

//
// addAllTextToNewXml
//// descr - 
//// @params
////   - newXmlObject - 
////   - oldHtmlTextAll - 
////   - xmlFromHtml - 
////   - narration - 
////   - newSlideXml - 
//// @return
////   - completedNewXml - 
function addAllTextToNewXml(newXmlObject, oldHtmlTextAll, xmlFromHtml, narration, newSlideXml){
  let newXmlWithNarr = addNarration(narration, newSlideXml);
  let combinedXmlHtml = combineOldHtmlAndXml(newXmlObject, oldHtmlTextAll, xmlFromHtml);
  let completedNewXml = addTextFromXmlAndHtml(combinedXmlHtml, newXmlWithNarr);
  
  return {completedNewXml : $(completedNewXml)[0].children[0].outerHTML, allText : combinedXmlHtml.allText};
}

function combineOldHtmlAndXml(newXmlObject, oldHtmlTextAll, xmlFromHtml){
  let headerText = xmlFromHtml.headerText         === undefined ? '' : xmlFromHtml.headerText,
      bulletText = xmlFromHtml.bulletText         === undefined ? '' : xmlFromHtml.bulletText,
      other      = newXmlObject.other             === undefined ? '' : newXmlObject.other,
      ul         = newXmlObject.ul                === undefined ? '' : newXmlObject.ul,
      all        = newXmlObject.allTextFromOldXml === undefined ? [] : newXmlObject.allTextFromOldXml;
  
  let header  = (headerText + other).trim();
  let bullets = (bulletText + ul).trim();
  let allText = oldHtmlTextAll.concat(all);

  return {header, bullets, allText};
}

function addTextFromXmlAndHtml(combinedXmlHtml, newWithNarr){
  let bulletList = $(newWithNarr).find('BulletPointList');
  if(combinedXmlHtml.bullets){
    bulletList
      .empty()
      .append(combinedXmlHtml.bullets);
  }

  let text = $(newWithNarr).find('Text');
  if(combinedXmlHtml.header){
    text.remove();
    bulletList.before(combinedXmlHtml.header);
  }

  return newWithNarr;
}

function addNarration(narration, newSlideXml){
  //// ADD NARRATION TO NEW SLIDE
  if(narration){
    let instructions = $(newSlideXml).find('Instructions');
    let narrationText = narration;

    //TODO - somehow figure out how to let the bms guys know that they shouldn't copy in the title of the tag
    //We could get rid of it by using this .split(/<br\/><br\/>.+?<br\/>/g)
    if(narrationText.match(/<br\/><br\/>/g)){
      narrationText = narrationText
        .split(/<br\/><br\/>/g)
        .map(cc => { return cc.replace(/<.+?>/g, ' ').trim(); });
    }
    else {
      narrationText = narrationText
        .replace(/<.+?>/g, ' ')
        .trim();
    }

    // TODO - figure out how to match the text from the pages with multiple narrations to the corrent narrations
    instructions.empty();
    instructions.append(narrationText);
    return newSlideXml;
  }
  return null;
}

module.exports = addAllTextToNewXml;
