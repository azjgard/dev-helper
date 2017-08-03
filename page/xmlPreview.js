
// <!-- TODO: Bring the key listener handling to the html file -->
// <!-- https://vuejs.org/v2/guide/events.html#Modifier-Keys -->

// TODO: add syntax highlighting for the xml

let testData = {
  slide_active: {
    id: "10%",
    slideText: [
      { text: "hehehe" },
      { text: "hehehe" },
      { text: "hehehe" },
      { text: "hehehe" },
    ]
  } ,
  slides: []
};

var app = new Vue({
  el      : 'body',
  data    : testData,
  methods : {

    init: function() {
      for (var i = 0; i < 10; i++) {
	this.addContent();
      }

      this.setActiveSlide(
	this.getAllSlides()[0]
      );
    },

    addContent: function() {
      let obj = {
	id : Math.floor(Math.random() * 20) + '%',
	classList : {
	  slide       : true,
	  active      : false,
	  childActive : false
	},
	slideText: [
	  { text: makeid() },
	  { text: makeid() },
	  { text: makeid() },
	  { text: makeid() },
	],
	xmlBlocks : [
	  {
	    text : makeid(),
	    classList : {
	      xmlBlock : true,
	      active   : false
	    }
	  },
	  {
	    text : makeid(),
	    classList : {
	      xmlBlock : true,
	      active   : false
	    }
	  }
	]
      };

      let num = Math.floor(Math.random() * 10);

      for (var i = 0; i < num; i++) {
	obj.xmlBlocks.push({
	  text: makeid(),
	  classList: {
	    xmlBlock: true,
	    active: false
	  }
	});
      }

      this._data.slides.push(obj);
    },

    // get the app data
    getData : function() {
      return this._data;
    },

    // determine whether an element is active
    isActive: function(element) {
      return element.classList.active;
    },

    executeOnElements: function(elements, cb) {
      for (let i = 0; i < elements.length; i++) {
	cb(elements[i]);
      }
    },

    // set the status of an array of elements
    setElementStatus: function(elements, attrs, status, cb) {
      this.executeOnElements(elements, function(element) {
	for (let x = 0; x < attrs.length; x++) {
	  Vue.set(element.classList, attrs[x].attr, attrs[x].status);
	}
	if (cb) cb(element);
      });
    },

    setActiveSlide: function(slide) {
      Vue.set(this._data, 'slide_active', slide);
    },

    getAllSlides: function() {
      return this._data.slides;
    },

    getActiveSlide: function() {
      return this._data.slide_active;
    },

    getActiveSlideId: function() {
      return this.getActiveSlide().id;
    },

    getActiveXmlInfo: function() {
      let activeSlide = this.getActiveSlide();
      let activeBlock = null;

      this.executeOnElements(activeSlide.xmlBlocks, xmlBlock => {
	if (this.isActive(xmlBlock)) {
	  activeBlock = xmlBlock;
	}
      });

      return { slide: activeSlide, xmlBlock: activeBlock };
    },

    resetActiveBlocks : function() {
      this.setElementStatus(
	this.getData().slides, [
	  { attr: 'active',      status: false },
	  { attr: 'activeChild', status: false },
	], false,
	slide => this.setElementStatus(slide.xmlBlocks, [
	  { attr: 'active', status: false }
	], false));
    },

    setActiveElement: function(elementInfo) {
      let element = elementInfo.target || elementInfo;
      let parent  = elementInfo.parent;

      this.resetActiveBlocks();

      // set the active properties
      if (parent) Vue.set(parent.classList, 'activeChild', true);
      Vue.set(element.classList, 'active', true);

      // set the active_slide object
      if (parent && parent.classList.hasOwnProperty('slide')) {
	Vue.set(this._data, 'slide_active', parent);
      }
      else if (element && element.classList.hasOwnProperty('slide')) {
	Vue.set(this._data, 'slide_active', element);
      }
    },

    changeElementPosition: function(parentArray, element, upOrDown) {
      let temp            = element;
      let elementIndex    = parentArray.indexOf(element);
      let newElementIndex = elementIndex + upOrDown;
      let swapElement     = parentArray[newElementIndex];

      if (newElementIndex >= 0 && newElementIndex < parentArray.length) {
	parentArray.splice(elementIndex, 1, swapElement);
	parentArray.splice(newElementIndex, 1, temp);
      }
    }
  }
});

let moveUp   = 38;
let moveDown = 40;
let control  = 17;

let controlPressed = false;

document.addEventListener('keydown', function(event) {
  let keyCode = event.which;

  if (controlPressed) {
    if (keyCode === moveUp || keyCode === moveDown) {
      event.preventDefault();

      let activeXmlInfo = app.getActiveXmlInfo();

      if (activeXmlInfo.xmlBlock) {
	app.changeElementPosition(activeXmlInfo.slide.xmlBlocks,
				  activeXmlInfo.xmlBlock,
				  keyCode === moveUp ? -1 : 1);
      }
      else {
	let slides = app.getAllSlides();
	let slide  = app.getActiveSlide();
	app.changeElementPosition(slides,
				  slide,
				  keyCode === moveUp ? -1 : 1);
      }
    }
  }
  else if (keyCode === control) {
    controlPressed = true;
  }
});

document.addEventListener('keyup', function(event) {
  let keyCode = event.which;

  switch(keyCode) {
  case control:
    controlPressed = false;
    break;
  }
});

app.init();

// exclusively for testing
function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < Math.floor(Math.random() * 500); i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}
