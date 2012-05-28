'use strict';

/**
 * LayoutDirectiveCtrl
 * 
 * 
 * 
 */
function LayoutDirectiveCtrl ($scope, $element, $attrs, transition, augmentController) {
  var self = this,
      trans = this.transition = transition($scope, $element),
      extCtrl = $attrs["withController"],
      locals;
  
  trans.state.config("init", {height: 0});
  trans.bind("height", "css-height");

  $element.css("width","100%");
  $element.css("position","relative");
  
  
  /**
   * The default reflow layout function factory
   */
  this.defaultLayout = function(){
    return function (children, scope) {
      var height = 0,
          width = 0;
      angular.forEach(blocks, function (child){
        height += child.calculateHeight();
        if(width < block.calculateWidth()) width = block.calculateWidth();
      });
      scope.height = pos;
      scope.width = width;
    }
  }
  
  /**
   * Initialize the contorller, called by the linking function
   */
  this.init = function(){  
    trans.state("init");
    // augment controller
    if(angular.isString(extCtrl) && extCtrl.length > 0) {
      locals = { $scope: $scope, 
                 $element: $element, 
                 $attrs: $attrs, 
                 $trans: trans };
      augmentController(extCtrl, this, locals);
    }
  }
  
  this._super = angular.extend(this._super||{}, {
    defaultLayout: self.defaultLayout
  });
}
LayoutDirectiveCtrl.$inject = ["$scope", "$element", "$attrs", "transition", "augmentController"];

/**
 * BlockDirectiveCtrl
 * 
 * 
 * 
 */
function BlockDirectiveCtrl ($scope, $element, $attrs, transition, augmentController, $exceptionHandler) {
  var self = this,
      trans = this.transition = transition($scope, $element),
      extCtrl = $attrs["withController"],
      locals;
  
  $element.css("width","100%");
  $element.css("overflow","hidden");
  $element.css("position","absolute");
  trans.state.config("init", {height: 0});    
  trans.state.config("hide", {height: 0});    
  trans.bind({ height: "css-height",
               y: "css-y", 
               opacity: "css-opacity" });
  
  ////////////////
  // Scope API
  // 
  /**
   * Show this block
   * 
   * triggers the show transition state
   */
  $scope.calculateHeight = function(){
    return $scope.height;
  }
  
  /**
   * Show this block
   * 
   * triggers the show transition state
   */
  $scope.calculateWidth = function(){
    return $scope.width;
  }
  
  /**
   * Show this block
   * 
   * triggers the show transition state
   */
  $scope.show = function(){
    trans.state("show");
  }
  
  /**
   * Hide this block
   * 
   * triggers the hide transition state
   */
  $scope.hide = function(){
    trans.state("hide");
  }
  
  /**
    * The default reflow layout function factory method
    */
   this.defaultLayout = function(){
     return function (children, scope) {
      var height = 0,
          width = 0;
       angular.forEach(children, function (child){
         height = Math.max(height, child.calculateHeight());
         width = Math.max(width, child.calculateWidth());
       });
       scope.height = height;
       scope.width = width;
     }
   }
  
  this.scope = $scope;
  
  /** 
   * init function get called during linking phase
   */
  this.init = function(){
    trans.state("init");
    self.addReflowWatcher("calculateHeight()");
    self.addReflowWatcher("calculateWidth()");
    // augment controller
    if(angular.isString(extCtrl) && extCtrl.length > 0) {
      locals = { $scope: $scope, 
                 $element: $element, 
                 $attrs: $attrs, 
                 $trans: trans };
      augmentController(extCtrl, this, locals);
    }
  }
  
  // make it easier to override these functions
  this._super = angular.extend(this._super||{}, {
    init: self.init
  });
}
LayoutDirectiveCtrl.$inject = ["$scope", "$element", "$attrs", "transition", "augmentController", "$exceptionHandler"];

/**
 * ScreenDirectiveCtrl
 * 
 * 
 * 
 */
function ScreenDirectiveCtrl($scope, $element, $attrs, transition, augmentController){
  var self = this,
      screen = $scope._screen = $scope.$new(true),
      trans = this.transition = transition(screen, $element),
      locals,
      extCtrl = $attrs["withController"];
  
  this.setLayoutScope(screen);
  
  $element.css("width","100%");
  $element.css("display","block");
  $element.css("position","absolute");
  
  trans.state.config("init", {hidden: true});
  trans.state.config("show", {hidden: false}, {onComplete:function(){
      self.transitionInComplete();
    }
  });
  trans.state.config("hide", {hidden: true}, {onComplete:function(){
      self.transitionOutComplete();
    }
  });
  trans.bind({ hidden: "css-hidden" });
  
  $scope.displaying = false;
  
  ////////////////
  // setup the screen api
  //
  screen.show = function(name){
    var name = name || screen.name;
    screen._block.currentScreen = name;
  }
  
  screen.hide = function(){
    if(screen.displaying()){
      screen._block.currentScreen = null;
    }
  }
  
  screen.calculateHeight = function () {
   return screen.height;
  } 
  
  screen.calculateWidth = function () {
   return screen.width;
  }
  
  screen.displaying = function(){
    return (screen._block.currentScreen == screen.name);
  }
  
  ////////////////
  // Ctrl API 
  // transition functions
  this.transitionIn = function(){
    $scope.$broadcast("transitioningIn");
    trans.state("show");
  }
  
  this.transitionInComplete = function(){
    $scope.$broadcast("transitionedIn");
  }
  
  this.transitionOut = function(){
    $scope.$broadcast("transitioningOut");
    trans.state("hide");
  }
   
  this.transitionOutComplete = function(){
    $scope.$broadcast("transitionedOut");
  }
  
  // init function get called during linking phase
  this.init = function(){
    trans.state("init");
    self.addReflowWatcher("displaying");
    self.addReflowWatcher("calculateHeight()");
    // augment controller
    if(angular.isString(extCtrl) && extCtrl.length > 0) {
      locals = { $scope: $scope, 
                 $element: $element, 
                 $attrs: $attrs, 
                 $trans: trans };
      augmentController(extCtrl, this, locals);
    }
  }
  
  // make it easier to override these functions
  this._super = angular.extend(this._super||{}, {
    init: self.init, 
    transitionIn: self.transitionIn,
    transitionInComplete: self.transitionInComplete,
    transitionOut: self.transitionOut,
    transitionOutComplete: self.transitionOutComplete
  });
}
ScreenDirectiveCtrl.$inject = ["$scope", "$element", "$attrs", "transition", "augmentController"]

/**
 * Be Slidey Transition Suite
 * 
 * 
 */ 
 function BeSlideyTransitionSuite () {
   var props = {};
    this.register("slidey-x", function (newval, oldval) {
      if( !(angular.isString(newval) || angular.isNumber(newval)) ) return false;
      newval = !isNaN(newval) ? newval.toString() + "px" : newval;
      props["left"] = newval;
    });

    this.register("slidey-y", function (newval, oldval) {
      if( !(angular.isString(newval) || angular.isNumber(newval)) ) return false;
      newval = !isNaN(newval) ? newval.toString() + "px" : newval;
      props["top"] = newval;
    });

    this.register("slidey-width", function (newval, oldval) {
      if( !(angular.isString(newval) || angular.isNumber(newval)) ) return false;
      newval = !isNaN(newval) ? newval.toString() + "px" : newval;
      props["width"] = newval;
    });

    this.register("slidey-height", function (newval, oldval) {
      if( !(angular.isString(newval) || angular.isNumber(newval)) ) return false;
      newval = !isNaN(newval) ? newval.toString() + "px" : newval;
      props["height"] = newval;
    });

    this.register("slidey-opacity", function (newval, oldval) {
      if(isNaN(newval)) return false;
      props["opacity"] = newval;
    });

    this.fire = function(element, config){
      var dur = config && config["duration"] || 300,
          onComplete = config && config["onComplete"] || angular.noop;
      $(element).stop();
      $(element).animate(props, dur, onComplete);
      props = {};
    }
   
 }

