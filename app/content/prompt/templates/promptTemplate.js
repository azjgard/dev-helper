let slideTypesObj = require(`Templates/common/dependencies.js`);
let [slideType, slides] = getSlideTypes(slideTypesObj); 

function getSlideTypes(slideTypes){
  let htmlSlides = {};
  let arr = [];
  for(var key in slideTypes){
    arr.push(`<option>${firstLetterCap(slideTypes[key].name)}</option>`);
    htmlSlides[key] = require(`Templates/${key}/prompt.html`);
  }
  return getSlideString(arr, htmlSlides);
}

function firstLetterCap(string){
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getSlideString(arr, htmlSlides){
  console.log('--- arr ---');
  console.log(arr);
  return [
    `<p>What is the slide type?</p>
     <select name="slideType">
       ${arr.join('')}
     </select>`,
    htmlSlides
  ];
}

module.exports = {
  slideType,
  slides
};
