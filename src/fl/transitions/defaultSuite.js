'use strict';

/**
 * DefautTransitionSuite 
 * This is the default transition suite definition which applies basic positioning and resizing 
 * to an element based upon the following mapping to css properties:
 * 
 * "css-x"{Number|String} -> "left"
 * "css-y"{Number|String} -> "top"
 * "css-width"{Number|String} -> "width"
 * "css-height"{Number|String} -> "height"
 * "css-opacity"{decimal Number} -> "opacity", "-moz-opacity", "filter:alpha(opacity={value*100}))"
 * "css-hidden"{Boolean} -> "display"
 * 
 * x, y, width and height will apply string values directly to css. 
 * If a number is recieved it casts a String with 'px' appended.
 * 
 * 'hidden' works in a similar way to jQuery show/hide
 * 
 * @constructor
 */
function DefaultTransitionSuite () {
  var self = this,
      display,
      defaultDisplay;
  
  this.props = {};
  
  this.register("css-x", function (newval, oldval) {
    if( !isValidNumString(newval) ) return false;
    newval = isValidNum(newval) ? newval.toString() + "px" : newval;
    self.props["left"] = newval;
  })
  
  this.register("css-y", function (newval, oldval) {
    if( !isValidNumString(newval) ) return false;
    newval = isValidNum(newval) ? newval.toString() + "px" : newval;
    self.props["top"] = newval;
  })
  
  this.register("css-width", function (newval, oldval) {
    if( !isValidNumString(newval) ) return false;
    newval = isValidNum(newval) ? newval.toString() + "px" : newval;
    self.props["width"] = newval;
  })
        
  this.register("css-height", function (newval, oldval) {
    if( !isValidNumString(newval) ) return false;
    newval = isValidNum(newval) ? newval.toString() + "px" : newval;
    self.props["height"] = newval;
  })
  
  this.register("css-hidden", function (newval, oldval) {
    display = newval ? "hide" : "show";
  })
  
  this.register("css-opacity", function (newval, oldval) {
    var ieVal;
    if(!isValidNum(newval)) return false;
    self.props["opacity"] = newval;
    self.props["-moz-opacity"] = newval;
    ieVal = Math.round(newval*100);
    self.props["filter"] = "alpha(opacity="+ieVal+")";
  });
  
  this.fire = function(element, config){
    var onComplete = config && config["onComplete"] || angular.noop;
    if(!defaultDisplay && element.css("display") != "none") defaultDisplay = element.css("display");
    switch(display){
      case "show":
        self.props["display"] = defaultDisplay ? defaultDisplay : "block";
        break;
      case "hide":
        self.props["display"] = "none";
        break;
    }
    element.css(self.props);
    display = null;
    self.props = {};
    onComplete();
  }
}

