let path = require('path');

// these are all going to have to be redone. I was removing all of the CDATA
// tags so that it becomes easier for us to parse the templates, but then
// I realized that they will have to be in the final template.. which is why
// they're present in the first place.
let assembleComponents = require('./templates/assembleComponents.xml');
let clickMe            = require('./templates/clickMe.xml');
let exam               = require('./templates/exam.xml');
let html               = require('./templates/html_clickMeWithVideo.xml');
let htmlMultiImage     = require('./templates/html_multi_imageHandlerSlide.xml');
let htmlSequential     = require('./templates/html_sequentialIllustrationOfSystems.xml');
let htmlSlide          = require('./templates/html_slide.xml');
let htmlVideo          = require('./templates/html_video.xml');
let image              = require('./templates/image.xml');
let imageGallery       = require('./templates/imageGallery.xml');
let quiz               = require('./templates/quiz.xml');
let video              = require('./templates/video.xml');

module.exports = {
  assembleComponents	,
  clickMe		,
  exam			,
  html			,
  htmlMultiImage	,
  htmlSequential	,
  htmlVideo		,
  image			,
  imageGallery		,
  quiz			,
  video
};
