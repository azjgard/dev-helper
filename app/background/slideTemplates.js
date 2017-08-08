let path = require('path');

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
