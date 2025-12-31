var slideIndex = 0;
var timer;
var transitionTime = 10000;
carousel();

function carousel() {
  var i;
  var x = document.getElementsByClassName("mySlides");
  var xdot = document.getElementsByClassName("dot");
  var xcaption = document.getElementsByClassName("caption");
  for (i = 0; i < x.length; i++) {
    x[i].style.display = "none";
    xdot[i].style.opacity = 0.25;
    xcaption[i].style.display = "none";
  }
  slideIndex++;
  if (slideIndex > x.length) {slideIndex = 1}
  x[slideIndex-1].style.display = "block";
  xdot[slideIndex-1].style.opacity = 1;
  xcaption[slideIndex-1].style.display = "block";

  timer = setTimeout(carousel, transitionTime); // Change image every 2 seconds
}


function currentSlide(n) {
    var i;
    var x = document.getElementsByClassName("mySlides");
    var xdot = document.getElementsByClassName("dot");
    var xcaption = document.getElementsByClassName("caption");
    for (i = 0; i < x.length; i++) {
      x[i].style.display = "none";
      xdot[i].style.opacity = 0.25;
      xcaption[i].style.display = "none";
    }
    if (n > x.length || n==0) {slideIndex = 1}
    else{slideIndex = n}
    x[slideIndex-1].style.display = "block";
    xdot[slideIndex-1].style.opacity = 1;
    xcaption[slideIndex-1].style.display = "block";

    if (n==0){slideIndex=0}
    clearTimeout(timer);
    carousel();
  }