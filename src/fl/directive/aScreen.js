'use strict';

/**
 * ScreenDirectiveCtrl
 * 
 * extends LayoutBlockBase & LayoutDisplayBase
 * 
 */
function ScreenDirectiveCtrl($scope, $element, $attrs, augmentController){
  var self = this,
      screen = this.layoutScope,
      trans = this.transition,
      locals,
      extCtrl = $attrs["withController"];
  // 
  this.addReflowWatcher("displaying()");
  this.addReflowWatcher("calculateHeight()");
  this.addReflowWatcher("calculateWidth()");
  // 
  $element.css("width","100%");
  $element.css("display","block");
  $element.css("position","absolute");
  ////////////////
  // setup the screen api
  //
  screen.calculateHeight = function(args){
    return screen.displaying() ? screen.height : 0;
  }
  // 
  screen.calculateWidth = function(args){
    return screen.displaying() ? screen.width : 0;
  }
  // 
  screen.show = function(name){
    var name = name || screen.name;
    $scope._block.currentScreen = name;
  }
  // 
  screen.hide = function(){
    if(screen.displaying()){
      $scope._block.currentScreen = null;
    }
  }
  // 
  screen.displaying = function(){
    return ($scope._block.currentScreen == screen.name);
  }
  // 
  // init function get called during linking phase
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
  // 
  // make it easier to override these functions
  var __super = this._super || {};
  this._super = angular.extend({}, __super, {
    // add any instance methods as properties of this hash
  });
}
ScreenDirectiveCtrl.$inject = ["$scope", "$element", "$attrs", "augmentController"]

/**
 * aScreen Directive
 * 
 */
 
 var aScreenDirective = [ "$compile", "$jQuery", function($compile, $jQuery) {
   return {
     restrict:"EA",
     scope:true,
     require:["^aLayout", "^aBlock", "aScreen"],
     controller: extendLayoutCtrl(LayoutBlockBase, LayoutDisplayBase, ScreenDirectiveCtrl),
     //////////////////
     // COMPILE
     compile:function(element, attr){
       var template = '<div class="a-screen-content" style="display: inline-block; width: 100%;">'+element.html()+"</div>";
       // var template = element.html();
       element.html("");
       //////////////
       // LINK
       return function(scope, iElement, iAttrs, controllers){
        // properties
        var screen  = controllers[2],
            block   = controllers[1],
            layout  = controllers[0],
            screenScope = scope._screen = screen.layoutScope,
            blockScope  = scope._block  = block.layoutScope,
            layoutScope = scope._layout  = layout.layoutScope,
            name = screenScope.name = block.addChild(screenScope, iAttrs.withName),
            childScope;
        //
        // Watchers and Listeners
        // add/remove template 
        screenScope.$watch("displaying()", function(newval, oldval){
                          if(newval == oldval) return;
                          toggleContent(newval)
                        });
        // watch the height of the element
        screenScope.$watch( function(){ return $jQuery(iElement).children(".a-screen-content").height(); },
                      function(newval){ 
                        screenScope.height = newval;
                      } );
        // watch the width of the element
        screenScope.$watch( function(){ return $jQuery(iElement).children(".a-screen-content").width(); },
                      function(newval){ 
                        screenScope.width = newval;
                      } );
        // listeners
        scope.$on("transitionedOut", function(){
          clearContent();
        });
        // 
        // Init
        // if this is first screen registered, show it
        screen.init();
        if(!blockScope.currentScreen) {
          screenScope.show();
          toggleContent(true);
        }
        // dispose
        scope.$on("$destroy", function(){
          screen = block = layout = null;
          screenScope = blockScope = layoutScope = null;
          scope._layout = scope._block = scope._screen = null;
        });
        // 
        // private
        function toggleContent (show) {
          if(show) {
            if(childScope){
              childScope.$destroy();
            }
            childScope = scope.$new();
            iElement.html(template);
            $compile(iElement.contents())(childScope);
            screen.transitionIn();
          } else {
            screen.transitionOut();
          }
        }
        function clearContent(){
          if (childScope) {
            childScope.$destroy();
            childScope = null;
          }
          iElement.html('');
        };
       }
     }
   } 
 }]
 
 