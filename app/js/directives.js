'use strict';

/* Directives */
angular.module('myApp.directives', [])
  /**
   * A Layout directive
   * 
   */
  .directive('aLayout', function() {
      return {
        restrict:"EA",
        scope:{},
        transclude:true,
        template:'<div class="a-layout" ng-transclude></div>',
        replace:true,
        controller: LayoutDirectiveCtrl, // see layout.js
        //////////////////
        // LINK
        link:function(scope, iElement, iAttrs, ctrl){
          // init
          ctrl.init();
        }
      } 
    })  
    /**
     * A Block directive
     * 
     */
    .directive('aBlock', function() {
      return {
        restrict:"EA",
        scope:{},
        require:["^aLayout","aBlock"],
        transclude:true,
        template:'<div class="a-block" ng-transclude></div>',
        replace:true,
        controller: BlockDirectiveCtrl, // see layout.js
        //////////////////
        // LINK
        link:function(scope, iElement, iAttrs, controllers){
          // properties
          var layout = controllers[0],
              block = controllers[1],
              name = scope.name = layout.addChild(scope, iAttrs.withName);
          // Init
          // override the default layout reflow function
          layout.layout(function(blocks, scope){
            var height = 0;
             angular.forEach(blocks, function (block){
               block.y = height;
               height += block.calculateHeight();
             });
             scope.height = height;
          });
          block.init();
        }
      } 
    })
    /**
     * A Screen Directive
     * 
     */
    .directive('aScreen', [ "$compile", function($compile) {
      return {
        restrict:"EA",
        scope:true,
        require:["^aBlock","aScreen"],
        controller: ScreenDirectiveCtrl,
        //////////////////
        // COMPILE
        compile:function(element, attr){
          var template = element.html();
          element.html("");
          //////////////
          // LINK
          return function(scope, iElement, iAttrs, controllers){
            // properties
            var screen = controllers[1],
                block = controllers[0],
                screenScope = scope._screen,
                blockScope = scope._block = block.scope,
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
            screenScope.$watch( function(){ return $(iElement).height(); },
                          function(newval){ 
                            screenScope.height = newval;
                          } );
            // listen for transitionedOut event to dispose the screen contents
            scope.$on("transitionedOut", function(){
              clearContent(); 
            });
            // 
            // Init
            // override the default block layout to handle screens
            block.layout(function (screens, blockScope) {
              var height = 0,
                  width = 0;
               angular.forEach(screens, function (screen){
                 if(screen.displaying()){
                   height = Math.max(height, screen.calculateHeight());
                   width = Math.max(width, screen.calculateWidth());
                 }
               });
               blockScope.height = height;
               blockScope.width = width;
             });
            screen.init();
            // if this is first screen registered, show it
            if(!blockScope.currentScreen) {
              screenScope.show();
              toggleContent(true);
            }
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
    }])
    /**
     * Be Slidey directive
     * 
     */
    .directive('beSlidey', function(){
      return {
        require: ["?aLayout", "?aBlock", "?aScreen"],
        //////////////
        // LINK
        link:function (scope, element, attrs, controllers) {
          // properties
          var props = (attrs["beSlidey"]).split(","),
              controllers = controllers || [],
              bindings = {
                x: "slidey-x",
                y: "slidey-y",
                width: "slidey-width",
                height: "slidey-height",
                opacity: "slidey-opacity",
                "hidden[height]": "slidey-hide-height",
                "hidden[fade]": "slidey-hide-fade"
              };
          // init
          angular.forEach(controllers,function(controller){
            if(controller == undefined) return;
            controller.transition.addSuite(BeSlideyTransitionSuite); // see layout.js
            angular.forEach(props, function(val){
              if(bindings.hasOwnProperty(val)){
                var scopeProp = val.replace(/\[.*\]/, "");
                controller.transition.bind(scopeProp, bindings[val]);
              }
            });
          });
        } 
      }
    });
    
    