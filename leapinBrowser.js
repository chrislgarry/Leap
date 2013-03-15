// ==UserScript==
// @name        Leap Motion Reddit Browsing
// @include     http://*.amazon.com/*
// @include     https://*.amazon.com/*
// @version     1
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js
// @require     http://rishibaldawa.com/tech/leap.min.js
// @require     http://rishibaldawa.com/tech/jqfloat.min.js
// ==/UserScript==
console.log("Loaded Leap Motion Reddit Browsing User Script");

// append the red box and store it in
$('body').prepend('<div class="redsquare" style="height:10px; width:10px; background:red; position:fixed; overflow:hidden; left: 150px; top: 150px; z-index: 9999"/>');
var box = $(($('div.redsquare')).get(0));


// Store frame for motion functions
var previousFrame;
var paused = false;
var pauseOnGesture = false;
var previousGestureTime = {};

// Setup Leap loop with frame callback function
var controllerOptions = {enableGestures: true};

//on reddit control
if(document.URL.indexOf("amazon.com") !== -1) { 
    $(document).ready(function() {
        
        $('button,a').click(function () {
            $(this).css ('background', 'red'); // to show demo
            var clickEvent  = document.createEvent ('MouseEvents');
            clickEvent.initEvent ('click', false, true);
            this.dispatchEvent (clickEvent);
        });
        
        if(typeof Leap !== 'undefined') {
            console.log("leap found");
            Leap.loop(controllerOptions, function(frame) {
                
                
                if (typeof frame.gestures !== 'undefined' && frame.gestures.length > 0) {
                    var i = 0;
                    
                    for (var i = 0; i < frame.gestures.length; i++) {
                        var gesture = frame.gestures[i];
                        
                        /*/ check if this gesture should be ignored
                        if(shouldIgnoreThisGesture(gesture.type)) {
                        continue;
                        } else {
                        previousGestureTime[gesture.type] = new Date().getTime();
                        }*/
                        
                        switch (gesture.type) {
                            case "screenTap":
                            case "keyTap":
                                clickNearestElementTo(gesture.position);
                                break;
                            case "circle":
                                if(circleTooSmall(gesture.radius)) {
                                    clickNearestElementTo(gesture.center);
                                    break;
                                } else {
                                    if(vectorClockwiseY(gesture.normal)) {
                                        window.history.go(1);
                                    } else {
                                        window.history.go(-1);
                                    } 
                                }
                                break;
                            case "swipe":
                                if(isSwipeLeft(gesture.direction)) {
                                    navigateAlsoBought("back");
                                }
                                if(isSwipeRight(gesture.direction)) {
                                    navigateAlsoBought("next");
                                }
                                break;
                            default:
                        }
                        console.log(gesture);
                    }
                }
                
                if (frame.pointables.length > 0) {
                    for (var i = 0; i < frame.pointables.length; i++) {
                        var pointable = frame.pointables[i];                        
                        moveBoxTo(pointable.tipPosition);
                        scrollIfOutOfBoundary(pointable.tipPosition);
                    }
                }
            });
        }
    });
} else {
    console.log("amazon not found." + document.URL);
}

/*
check if this gesture should be ignored
*/
function shouldIgnoreThisGesture(gestureType) {
    var currentTime = new Date().getTime();
    return previousGestureTime[gestureType] && currentTime - previousGestureTime[gestureType] < 2000;
}

/*
functions to detect left and right swipes
*/
function isSwipeLeft(direction) {
    return Math.abs(direction[0]) > 0.9 && direction[0] < 0.0;
}

function isSwipeRight(direction) {
    return Math.abs(direction[0]) > 0.9 && direction[0] > 0.0;
}

function pauseForGestures() {
    if (document.getElementById("pauseOnGesture").checked) {
        pauseOnGesture = true;
    } else {
        pauseOnGesture = false;
    }
}

function vectorClockwiseY(vector) {
    // 1 is Y axis
    return ( vector[1] < 0 );
}

function togglePause() {
    paused = !paused;
}

function vectorToString(vector, digits) {
    if (typeof digits === "undefined") {
        digits = 1;
    }
    return "(" + vector[0].toFixed(digits) + ", "
    + vector[1].toFixed(digits) + ", "
    + vector[2].toFixed(digits) + ")";
}

function getNormalizedX(vector) {
    
    var middle = (window.innerWidth/2);
    var mapped = middle + (8*vector[0]);    
    return mapped.toFixed();
}

function getNormalizedY(vector) {
    
    var height = window.innerHeight;
    var mapped = height - 5*vector[1] + 150;
    
    console.log("vector y: " + vector[1]);
    console.log("bottom: " + window.innerHeight);
    console.log("mapped: " + mapped);
    return mapped.toFixed();
}

function circleTooSmall(radius) { // to reduce sensitivity
    if(radius < 30) { //20 mm 
        return true;
    } else {
        return false;
    }
}

function moveBoxTo(tipPosition) {
    var leftValue = getNormalizedX(tipPosition);
    var topValue = getNormalizedY(tipPosition);
    // console.log('left' + leftValue + 'px , top' + topValue + 'px');
    box.css({ 'left': leftValue + 'px', 'top': topValue + 'px' });
}

// scrollBy const
var SCROLL_BY = 50; // px

function scrollIfOutOfBoundary(tipPosition) {
    scrollUpIfUnderflow(tipPosition);
    scrollDownIfOverflow(tipPosition);
    scrollLeftIfUnderflow(tipPosition);
    scrollRightIfOverflow(tipPosition);
}

function scrollUpIfUnderflow(tipPosition) {
    if(getNormalizedY(tipPosition) < 0) {
        window.scrollBy(0, -1 * SCROLL_BY);
    }
}

function scrollDownIfOverflow(tipPosition) {
    if(getNormalizedY(tipPosition) > window.innerHeight) {
        window.scrollBy(0, SCROLL_BY);
    }
}

function scrollLeftIfUnderflow(tipPosition) {
    if(getNormalizedX(tipPosition) < 0) {
        window.scrollBy(-1 * SCROLL_BY,0);
    }
}

function scrollRightIfOverflow(tipPosition) {
    if(getNormalizedX(tipPosition) > window.innerWidth) {
        window.scrollBy(SCROLL_BY, 0);
    }
}

function clickNearestElementTo(position) {
    var normalizedX = getNormalizedX(position);
    var normalizedY = getNormalizedY(position);
    var elementBelow = $(document.elementFromPoint(normalizedX - 1, normalizedY - 1));
    console.log(elementBelow.get(0));
    elementBelow.click();
}

/*
* navigate "Customer Who Bought This Item Also Bought"
* take parameter direction as string "back" or "next"
*/
function navigateAlsoBought(direction) {
    if(direction == "back") {
        jQuery("a.back-button").click();
    } else if(direction == "next") {
        jQuery("a.next-button").click();
    }
}
