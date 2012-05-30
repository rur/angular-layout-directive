'use strict';
(function(window){
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
      angular.forEach(children, function (child){
        height += child.calculateHeight();
        width = Math.max( width, child.calculateWidth());
      });
      scope.height = height;
      scope.width = width;
    }
  }
  
  this.layoutScope = $scope;
  
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
  
  this.addReflowWatcher("calculateHeight()");
  this.addReflowWatcher("calculateWidth()");
  
  $element.css("width","100%");
  $element.css("overflow-x","hidden");
  $element.css("overflow-y","hidden");
  $element.css("position","absolute");
  trans.state.config("init", {height: 0});    
  trans.state.config("hide", {height: 0});    
  trans.state.config("show", function(){self.layout()});    
  trans.bind({ height: "css-height",
               y: "css-y", 
               opacity: "css-opacity" });
  
  ////////////////
  // Scope API
  // 
  /**
   * Calculate the height of this block, used by parent reflow function
   */
  $scope.calculateHeight = function(){
    return $scope.height;
  }
  
  /**
   * Calculate the width of this block, used by parent reflow function
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
         height = Math.max( height, child.calculateHeight());
         width += child.calculateWidth();
       });
       scope.height = height;
       scope.width = width;
     }
   }
  
  this.layoutScope = $scope;
  
  /** 
   * init function get called during linking phase
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
  
  // make it easier to override these functions
  this._super = angular.extend(this._super||{}, {
    init: self.init
  });
}
BlockDirectiveCtrl.$inject = ["$scope", "$element", "$attrs", "transition", "augmentController", "$exceptionHandler"];

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
  this.addReflowWatcher("displaying");
  this.addReflowWatcher("calculateHeight()");
  
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
  
  ////////////////
  // setup the screen api
  //
  screen.show = function(name){
    var name = name || screen.name;
    $scope._block.currentScreen = name;
  }
  
  screen.hide = function(){
    if(screen.displaying()){
      $scope._block.currentScreen = null;
    }
  }
  
  screen.calculateHeight = function () {
   return screen.height;
  } 
  
  screen.calculateWidth = function () {
   return screen.width;
  }
  
  screen.displaying = function(){
    return ($scope._block.currentScreen == screen.name);
  }
  
  ////////////////
  // Ctrl API 
  // transition functions
  // nb: Notice that transition events are broadcast on the directive scope, not the isolated 
  //     layout scope. This makes them available to your app controllers
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
  
  this.layoutScope = screen;
  
  // init function get called during linking phase
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

function OverlayDirectiveCtrl ($scope, $attrs, $element, transition, augmentController) {
  var self = this,
      overlay = $scope._overlay = $scope.$new(true),
      trans = this.transition = transition(overlay, $element),
      extCtrl = $attrs.withController,
      locals;
  
  $element.css("width","100%");
  $element.css("height","100%");
  $element.css("overflow-x","hidden");
  $element.css("overflow-y","hidden");
  $element.css("position","absolute");
  $element.css("z-index","100");
  $element.css("top","0px");
  $element.css("left","0px");
  trans.state.config("init", {hidden: true});    
  trans.state.config("show", {hidden: false}, {onComplete:function(){
      self.transitionInComplete();
    }
  });
  trans.state.config("hide", {hidden: true}, {onComplete:function(){
      self.transitionOutComplete();
    }
  });   
  trans.bind({ hidden: "css-hidden",
                opacity: "css-opacity"});
  
  ////////////////
  // Scope API
  //
  overlay.show = function(name){
    var name = name || overlay.name;
    $scope._parent.currentOverlay = name;
  }
  
  overlay.hide = function(){
    $scope._parent.currentOverlay = null;
  }
  
  overlay.displaying = function(name){
    var name = name || overlay.name;
    return ($scope._parent.currentOverlay == name);
  }
  
  ////////////////
  // Ctrl API 
  // transition functions
  // nb: Notice that transition events are broadcast on the directive scope, not the isolated 
  //     layout scope. This makes them available to your app controllers
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
  
  this.layoutScope = overlay;
  
  // init function get called during linking phase
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
  
  // make it easier to override these functions
  this._super = angular.extend(this._super||{}, {
    init: self.init, 
    transitionIn: self.transitionIn,
    transitionInComplete: self.transitionInComplete,
    transitionOut: self.transitionOut,
    transitionOutComplete: self.transitionOutComplete
  });
}

OverlayDirectiveCtrl.$inject = ["$scope", "$attrs", "$element", "transition", 'augmentController'];


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
      newval = !isNaN(newval) ? newval.toString() + "px" : newval;
      self.props["left"] = newval;
    });

    this.register("slidey-y", function (newval, oldval) {
      if( !isValidNumString(newval) ) return false;
      newval = !isNaN(newval) ? newval.toString() + "px" : newval;
      self.props["top"] = newval;
    });

    this.register("slidey-width", function (newval, oldval) {
      if( !isValidNumString(newval) ) return false;
      newval = !isNaN(newval) ? newval.toString() + "px" : newval;
      self.props["width"] = newval;
    });

    this.register("slidey-height", function (newval, oldval) {
      if( !isValidNumString(newval) ) return false;
      newval = !isNaN(newval) ? newval.toString() + "px" : newval;
      self.props["height"] = newval;
    });

    this.register("slidey-opacity", function (newval, oldval) {
      if( !isValidNum(newval) ) return false;
      self.props["opacity"] = newval;
    });

    this.fire = function(element, config){
      var dur = config && config["duration"] || 300,
          onComplete = config && config["onComplete"] || angular.noop;
      $(element).animate(self.props, {duration: dur, queue: false}, onComplete);
      self.props = {};
    }
    // utils
    function isValidNumString (val) {
      return (angular.isString(val) || isValidNum(val));
    }
    function isValidNum (val) {
      return val && typeof val != "boolean" && !angular.isArray(val) && (angular.isNumber(val) || !isNaN(val)) ;
    }
 }
 // Extend controllers with base layout classes
 window.LayoutDirectiveCtrl   = layout_component_utils.extendController(LayoutContainerBase, LayoutDirectiveCtrl);
 window.BlockDirectiveCtrl    = layout_component_utils.extendController(LayoutContainerBlockBase, BlockDirectiveCtrl);
 window.ScreenDirectiveCtrl   = layout_component_utils.extendController(LayoutBlockBase, ScreenDirectiveCtrl);
 window.OverlayDirectiveCtrl  = layout_component_utils.extendController(LayoutContainerBase, OverlayDirectiveCtrl);
 window.BeSlideyTransitionSuite = BeSlideyTransitionSuite;
})(window);