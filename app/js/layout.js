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
      locals,
      triggered = false,
      flowFunc;
  
  trans.state.config("init", {height: 0});
  trans.bind("height", "css-height");

  $element.css("width","100%");
  $element.css("position","relative");
  
  $scope.blocks = [];
  
  ////////////////
  // Ctrl API
  this.addBlock = function(block){
    $scope.blocks.push(block);
  }
  
  /**
   * Get the default reflow function
   */
  this.getDefaultReflow = function(){
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
   * Set the function that will be responsible for carrying out the reflow.
   * 
   * Here is the signature: function(block_scopes_array, layout_scope){...}
   * 
   * It must position each block and set the dimensions of the layout scope
   */
  this.setReflow = function(func){
    flowFunc = func;
  }
  
  /**
   * Trigger the current reflow function to be called
   */
  this.reflow = function(){
    if(!triggered){
      $scope.$evalAsync(function(){
        flowFunc($scope.blocks, $scope);
        triggered = false;
      });
      triggered = true;
    }
  }
  
  /**
   * Initialize the contorller, called by the linking function
   */
  this.init = function(){  
    trans.state("init");
    self.setReflow(self.getDefaultReflow());
  }
  
  this._super = {
    getDefaultReflow: self.getDefaultReflow,
    setReflow: self.setReflow,
    reflow: self.reflow,
    addBlock: self.addBlock
  }
  
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
      locals,
      reflowWatchExprs = {};
  
  $element.css("width","100%");
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
  $scope.currentScreen = '';
  
  /**
   * List of registerded screen ids
   */
  $scope.screens = [];
  
  /**
   * Computed Boolean to check if a screen is currently being displayed
   * @returns {boolean} 
   */
  $scope.displayingScreen = function(){
    return $scope.screens.indexOf($scope.currentScreen) > -1;
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
  
  
  ////////////////
  // Ctrl API
  // 
  /**
   * get a unique screen id
   * 
   * @param {optional string} name Perferred id, it will be appended with '_#' if it's not unique
   */
  this.registerScreen = function(name){
    if(!angular.isString(name)){
      name = "screen"
    }
    var newN = name,
    step = 0;
    while($scope.screens.indexOf(newN) > -1){
      newN = name+"_"+(++step);
    }
    $scope.screens.push(newN);
    if($scope.screens.length == 1) $scope.currentScreen = newN;
    return newN;
  }
  
  // because screen needs it
  this.scope = $scope;
  
  /**
   * add a watch expression which will trigger a layout reflow
   * 
   * @param {string} expression A string expression which when it evaluates to a different number will trigger the reflow
   */
  this.addReflowWatcher = function(expression){
    if(!angular.isString(expression)){
      $exceptionHandler("Sorry this method can only watch expression strings for reflow!")
    }
    if(!reflowWatchExprs.hasOwnProperty(expression)){
      reflowWatchExprs[expression] = $scope.$watch(expression, $scope.triggerReflow);
    }
  }
  
  /**
   * remove a watch expression, this will call the un$watch function
   * 
   * @param {string} expression A string expression
   */
  this.removeReflowWatcher = function(expression){
    var un$watcher = reflowWatchExprs[expression];
    try{
      un$watcher();
    }catch(e){}
    delete reflowWatchExprs[expression];
  }
  
  this.screenHeightUpdate = function(newval){
    $scope.height = newval;
  }
  
  /** 
   * init function get called during linking phase
   */
  this.init = function(){
    trans.state("init");
    self.addReflowWatcher("height");
  }
  
  this._super = {
    init: self.init,  
    addReflowWatcher: self.addReflowWatcher,
    removeReflowWatcher: self.removeReflowWatcher  
  }
  
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
  screen.show = function(id){
    id = id || screen.id;
    $scope._block.currentScreen = id;
  }
  
  screen.hide = function(){
    $scope._block.currentScreen = null;
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
  }
  
  // make it easier to override these functions
  this._super = {
    init: self.init, 
    transitionIn: self.transitionIn,
    transitionInComplete: self.transitionInComplete,
    transitionOut: self.transitionOut,
    transitionOutComplete: self.transitionOutComplete
  }
  
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

