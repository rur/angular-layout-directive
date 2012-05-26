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
  
  $scope.blocks = [];
  
  
  /**
   * The default reflow layout function factory
   */
  this.defaultLayout = function(){
    return function (blocks, scope) {
      var pos = 0,
          width = 0;
      angular.forEach(blocks, function (block, ind){
        block.y = pos;
        pos += block.height;
        if(width < block.width) width = block.width;
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
  }
  
  this._super = angular.extend(this._super||{}, {
    defaultLayout: self.defaultLayout
  });
  
  //////////
  // augment controller
  if(angular.isString(extCtrl) && extCtrl.length > 0) {
    locals = { $scope: $scope, 
               $element: $element, 
               $attrs: $attrs, 
               $trans: trans };
    augmentController(extCtrl, this, locals);
  }
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
   * the id of the currentScreen
   */
  $scope.currentScreen = null;
  
  /**
   * Computed Boolean to check if a screen is currently being displayed
   * @returns {boolean} 
   */
  $scope.displayingScreen = function(){
    return $scope.children.indexOf($scope.currentScreen) > -1;
  }
  
  /**
   * Display a specified screen, speficied by name or scope
   * 
   * If the value passed is invalid, the new screen will be null
   * 
   * If the new screen and the current screen are equal then nothing will happen
   * 
   * @param {string|angular.ng.$rootScope.Scope} screen Screen scope or screen name of screen to be selected
   * @event screenChange Broadcasts event from the scope if the screen is changed
   */
  $scope.showScreen = function(screen){
    var cur = $scope.currentScreen,
        neu = angular.isString(screen) ? $scope.childrenByName[screen] : screen;
    if(cur == neu) return;
    $scope.currentScreen = neu;
    $scope.$broadcast("screenChange", screen && screen.name);
  }
  
  
  /**
   * Hide a specified screen if its the currentScreen, speficied by name or scope
   * 
   * If the value passed is invalid, or the screen is not the current screen, nothing will happen
   * 
   * @param {string|angular.ng.$rootScope.Scope} screen Screen scope or screen name of screen to be deselected
   * @event screenChange Broadcasts event from the scope if the screen is changed
   */
  $scope.hideScreen = function(screen){
    var screen = angular.isString(screen) ? $scope.childrenByName[screen] : screen;
    if(screen && $scope.currentScreen == screen){
      $scope.currentScreen = null;
      $scope.$broadcast("screenChange");
    }
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
     return function (screens, scope) {
      var height = 0;
       angular.forEach(blocks, function (screen, ind){
         if(screen.displayed){
           height = Math.max(height, screen.height);
         }
       });
       scope.screenHeight = height;
     }
   }
  
  // because the screen directive needs it
  this.scope = $scope;
  
  /**
   * watch listener attached to $scope.screenHeight property
   * 
   * By default this sets the block height to match screen height
   */
  this.screenHeightUpdate = function(newval){
    $scope.height = newval;
  }
  
  /** 
   * init function get called during linking phase
   */
  this.init = function(){
    trans.state("init");
    self.addReflowWatcher("height");
    $scope.$watch("screenHeight", self.screenHeightUpdate);
  }
  
  // make it easier to override these functions
  this._super = angular.extend(this._super||{}, {
    init: self.init
  });
  
  //////////
  // augment controller
  if(angular.isString(extCtrl) && extCtrl.length > 0) {
    locals = { $scope: $scope, 
               $element: $element, 
               $attrs: $attrs, 
               $trans: trans };
    augmentController(extCtrl, this, locals);
  }
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
    var ref = name || screen;
    scope._block.showScreen(ref);
  }
  
  screen.hide = function(){
    scope._block.hideScreen(screen);
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
    self.addReflowWatcher("height");
  }
  
  // make it easier to override these functions
  this._super = angular.extend(this._super||{}, {
    init: self.init, 
    transitionIn: self.transitionIn,
    transitionInComplete: self.transitionInComplete,
    transitionOut: self.transitionOut,
    transitionOutComplete: self.transitionOutComplete
  });
  
  //////////
  // augment controller
  if(angular.isString(extCtrl) && extCtrl.length > 0) {
    locals = { $scope: $scope, 
               $element: $element, 
               $attrs: $attrs, 
               $trans: trans };
    augmentController(extCtrl, this, locals);
  }
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

