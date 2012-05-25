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
          //////
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
              block = controllers[1];
          //
          // Watchers and Listeners
          //
          scope.$watch("screenHeight", block.screenHeightUpdate);
          scope.$watch("displayingScreen()", function(newval){
            if(!newval){
              scope.screenHeight = 0;
            }
          })
          // 
          // init
          layout.addBlock(scope);
          scope.triggerReflow = function(){
            layout.reflow();
          }
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
                blockScope = scope._block = block.scope,
                id = scope._screen.id = block.registerScreen(iAttrs.withName),
                childScope;
            //
            // Watchers and Listeners
            //
            blockScope.$watch("currentScreen", function(newval, oldval){
              if(!scope.displaying && newval == id) {
                if(childScope){
                  childScope.$destroy();
                }
                childScope = scope.$new();
                iElement.html(template);
                $compile(iElement.contents())(childScope);
                screen.transitionIn();
                scope.displaying = true;
                blockScope.screenHeight = scope.height;
              } else if(scope.displaying && newval != id){
                screen.transitionOut();
                scope.displaying = false;
              }
            });
            scope.$watch( function(){ return $(iElement).height(); },
                          function(newval){ 
                            scope.height = newval;
                          } ); 
            scope.$watch("height", function (newval) {
              if(scope.displaying) blockScope.screenHeight = newval;
            });
            scope.$on("transitionedOut", function(){
             clearContent(); 
            })
            // 
            // init
            screen.init();
            // 
            // private
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
                opacity: "slidey-opacity"
              };
          angular.forEach(controllers,function(controller){
            if(controller == undefined) return;
            controller.transition.addSuite(BeSlideyTransitionSuite); // see layout.js
            angular.forEach(props, function(val){
              if(bindings.hasOwnProperty(val)){
                controller.transition.bind(val, bindings[val]);
              }
            });
          });
        } 
      }
    });
    
    