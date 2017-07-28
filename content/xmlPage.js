// THIS IS STRICTLY FOR TESTING
// Button for sending requests to background
// var btn = document.createElement('button');
// btn.style.width = "100px";
// btn.style.height = "100px";
// btn.innerHTML = "Send Message";
// btn.style.position = "fixed";
// btn.style.left = "0";
// btn.style.top = "0";
// btn.id = "sendMessage";

// // test data to send to the page
// const testData = {
//   primaryKey: "ddsdfi2u34fnsjnkdfjnsdfzxxx@@@",
//   hey: "guy",
//   what: "is",
//   your: "name"
// };


// getElement('body', 0, 5000, test);

// function test() {
//   document.body.appendChild(btn);
//   document.getElementById('sendMessage').addEventListener('click', function() {
//     chrome.runtime.sendMessage({
//       message: 'new-html-page',
//       data: testData
//     });
//   });
// }

function getElement(querySelector, currentTimeout, maxTimeout, cb) {
  // try to get the element
  var el = document.querySelector(querySelector);
  // time to wait before searching again
  var waitTime = 100;

  // reset if we still haven't found the element and still haven't
  // reached the timeout
  if (el === null && currentTimeout < maxTimeout) {
    setTimeout(
      () => getElement(querySelector, currentTimeout + waitTime, maxTimeout, cb), waitTime
    );
  }
  // if we've reached the max timeout and still haven't found the element,
  // then exit the function
  else if (el === null) {
    console.log('Could not find the element.');
    return;
  }
  // do something with the element once it's found
  else {
    cb(el);
  }
}
