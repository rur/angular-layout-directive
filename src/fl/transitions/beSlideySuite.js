'use strict';

/**
 * Be Slidey Transition Suite
 * 
 * 
 */ 
 function BeSlideyTransitionSuite () {
   var self = this;
   this.props = {};
    this.register("slidey-x", function (newval, oldval) {
      if( !isValidNumString(newval) ) return false;
      newval = isValidNum(newval) ? newval.toString() + "px" : newval;
      self.props["left"] = newval;
    });

    this.register("slidey-y", function (newval, oldval) {
      if( !isValidNumString(newval) ) return false;
      newval = isValidNum(newval) ? newval.toString() + "px" : newval;
      self.props["top"] = newval;
    });

    this.register("slidey-width", function (newval, oldval) {
      if( !isValidNumString(newval) ) return false;
      newval = isValidNum(newval) ? newval.toString() + "px" : newval;
      self.props["width"] = newval;
    });

    this.register("slidey-height", function (newval, oldval) {
      if( !isValidNumString(newval) ) return false;
      newval = isValidNum(newval) ? newval.toString() + "px" : newval;
      self.props["height"] = newval;
    });

    this.register("slidey-opacity", function (newval, oldval) {
      if( !isValidNum(newval) ) return false;
      self.props["opacity"] = newval;
    });

    this.fire = function(element, config){
      var dur = config && config["duration"] || 300,
          onComplete = config && config["onComplete"] || angular.noop;
      $(element).animate(self.props, {duration: dur, queue: false, complete: onComplete});
      self.props = {};
    }
 }
 
 
 