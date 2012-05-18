/*
 In the controller
*/

function SomeDirectiveController ($scope, $element, $attr, transition) {
  var transition = transition($scope, $element);
  transition.addSuite(SlideyTransitionSuite);
  transition.state.config("hidden", { height: 0, opacity: 0 });
  transition.state.config("expanded", { height: "100%", opacity: 1 }, {delay:.3, onComplete:function (argument) {
    // do something when this transition completes
  }});
  transition.bind("opacity", "slide-alpha");
  transition.bind("height", "slide-height");
  
  this.show = function () {
    transition.state("expanded");
  }
  
  this.hide = function (){
    transition.state("hidden");
  }
  
  transition.apply({})
}

/*
  Example Transition Suite implementation
*/ 

function SlideyTransitionSuite () {
 var params = {};
  
  this.register("slide-height", function(newval,oldvalue){
    params["height"] = newval;
  });
  
  this.register("slide-width", function(newval,oldvalue){
    params["width"] = newval;
  });
  
  this.register("slide-alpha", function(newval,oldvalue){
    params["alpha"] = newval;
  });
  
  this.register("slide-top", function(newval,oldvalue){
    params["top"] = newval;
  });
  
  this.register("slide-left", function(newval,oldvalue){
    params["left"] = newval;
  });
  
  this.fire = function (element, props) {
    props = props || {};
    var dur = props["duration"] || 300,
        delay = props["delay"] || 0,
        onComplete = props["onComplete"] || angular.noop();
    $(element).animate(params, dur, onComplete);
    params = {};
  }
}

/*
  Transition Suite Base implementation
*/

function BaseTransitionSuite () {
  this.transitions = {};
  this.onCue = false;
}

BaseTransitionSuite.prototype = {
  register:function(transProp, fn){
    var self = this;
    this.transitions[transProp] = function () {
      self.onCue = true;
      var args = Array.prototype.slice.call(arguments);
      // copy-cat optimization from the the invoke method in Angulars injector
      switch(args.length){
        case  0: return fn();
        case  1: return fn(args[0]);
        case  2: return fn(args[0], args[1]);
        case  3: return fn(args[0], args[1], args[2]);
        case  4: return fn(args[0], args[1], args[2], args[3]);
        case  5: return fn(args[0], args[1], args[2], args[3], args[4]);
        case  6: return fn(args[0], args[1], args[2], args[3], args[4], args[5]);
        case  7: return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
        case  8: return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
        case  9: return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]);
        case 10: return fn(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
        default: return fn.apply(self, args);
      }
    }
  }
}
