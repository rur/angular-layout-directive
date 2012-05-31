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
        child.y = height;
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
  
  this.__super = this._super;
  this._super = angular.extend({}, this._super||{}, {
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
    * The default reflow layout function factory method
    */
   this.defaultLayout = function(){
     return function (children, scope) {
      var height = 0,
          width = 0;
       angular.forEach(children, function (child){
         height += child.calculateHeight();
         width = Math.max(child.calculateWidth(), width);
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
  this.__super = this._super;
  this._super = angular.extend({}, this._super||{}, {
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
function ScreenDirectiveCtrl($scope, $element, $attrs, augmentController){
  var self = this,
      screen = this.layoutScope,
      trans = this.transition,
      locals,
      extCtrl = $attrs["withController"];
  
  this.setLayoutScope(screen);
  this.addReflowWatcher("displaying()");
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
  screen.calculateHeight = function(args){
    return screen.displaying() ? screen.height : 0;
  }
  screen.calculateWidth = function(args){
    return screen.displaying() ? screen.width : 0;
  }
  
  screen.show = function(name){
    var name = name || screen.name;
    $scope._block.currentScreen = name;
  }
  
  screen.hide = function(){
    if(screen.displaying()){
      $scope._block.currentScreen = null;
    }
  }
  
  screen.displaying = function(){
    return ($scope._block.currentScreen == screen.name);
  }
  
  ////////////////
  // Ctrl API 
  // transition functions
  this.transitionIn = function(){
    self.__super.transitionIn();
    trans.state("show");
  }
  
  this.transitionOut = function(){
    self.__super.transitionOut();
    trans.state("hide");
  }
  
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
  this.__super = this._super;
  this._super = angular.extend({}, this._super||{}, {
    init: self.init, 
    transitionIn: self.transitionIn,
    transitionInComplete: self.transitionInComplete,
    transitionOut: self.transitionOut,
    transitionOutComplete: self.transitionOutComplete
  });
}
ScreenDirectiveCtrl.$inject = ["$scope", "$element", "$attrs", "augmentController"]

function OverlayDirectiveCtrl ($scope, $attrs, $element, augmentController) {
  var self = this,
      overlay = this.layoutScope,
      trans = this.transition,
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
  this.transitionIn = function(){
    self.__super.transitionIn();
    trans.state("show");
  }
  this.transitionOut = function(){
    self.__super.transitionOut();
    trans.state("hide");
  }
  
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
    this.__super = this._super;
    this._super = angular.extend({}, this._super||{}, {
      init: self.init, 
      transitionIn: self.transitionIn,
      transitionInComplete: self.transitionInComplete,
      transitionOut: self.transitionOut,
      transitionOutComplete: self.transitionOutComplete
    });
}

OverlayDirectiveCtrl.$inject = ["$scope", "$attrs", "$element", 'augmentController'];

function OverlayPanelDirectiveCtrl ($scope, $element, $attrs, $defer) {
  var self = this,
      panel = $scope._panel = this.layoutScope,
      trans = this.transition;
  $element.css("position", "absolute");
  $element.css("display", "block");
  trans.bind({x: "css-x", y: "css-y"});
  // panel api
  /**
   * The side of the overlay frame that the panel aligns to
   */
  panel.align = $attrs.anOverlayPanel.length > 0 ? $attrs.anOverlayPanel : "center";
  
  /**
   * repositions the panel in relation to the parent overlay
   */
  panel.reposition = function(){
    var ovW = $scope._overlay && $scope._overlay.width || 0,
        ovH = $scope._overlay && $scope._overlay.height || 0,
        plW = panel.width || 0,
        plH = panel.height || 0;
    switch(panel.align){
      case "right":
      case "topright":
      case "bottomright":
        panel.x = ovW-plW;
        break;
      case "center":
      case "top":
      case "bottom":
        panel.x = (ovW-plW)*0.5;
        break;
      case "left":
      case "topleft":
      case "bottomleft":
        panel.x = 0;
        break;
    }    
    switch(panel.align){
      case "bottom":
      case "bottomleft":
      case "bottomright":
        panel.y = ovH-plH;
        break;
      case "center":
      case "left":
      case "right":
        panel.y = (ovH-plH)*0.5;
        break;
      case "top":
      case "topleft":
      case "topright":
        panel.y = 0;
        break;
    }
  }
  
  // Controller members
  this.layoutScope = panel;
  
  this.init = function(){
    
  }
}
OverlayPanelDirectiveCtrl.$inject = ["$scope", "$element", "$attrs", "$defer"];

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
      $(element).animate(self.props, {duration: dur, queue: false}, onComplete);
      self.props = {};
    }
    // utils
    function isValidNumString (val) {
      return (angular.isString(val) || isValidNum(val));
    }
    function isValidNum (val) {
      return val != null && typeof val != "boolean" && !angular.isArray(val) && angular.isNumber(Number(val)) && !isNaN(val);
    }
 }
 // Extend controllers with base layout classes
 window.LayoutDirectiveCtrl   = layout_component_utils.extendController(LayoutContainerBase, LayoutDirectiveCtrl);
 window.BlockDirectiveCtrl    = layout_component_utils.extendController(LayoutContainerBlockBase, BlockDirectiveCtrl);
 window.ScreenDirectiveCtrl   = layout_component_utils.extendController(LayoutBlockBase, LayoutDisplayBase, ScreenDirectiveCtrl);
 window.OverlayDirectiveCtrl  = layout_component_utils.extendController(LayoutContainerBase, LayoutDisplayBase, OverlayDirectiveCtrl);
 window.OverlayPanelDirectiveCtrl = layout_component_utils.extendController(LayoutBlockBase, LayoutDisplayBase, OverlayPanelDirectiveCtrl);
 window.BeSlideyTransitionSuite = BeSlideyTransitionSuite;
})(window);