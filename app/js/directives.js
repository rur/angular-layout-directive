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
              name = scope.name = layout.addChild(scope, iAttrs.withName),
              layoutScope = scope.layout = layout.layoutScope;
          // Init
          block.init();
        }
      } 
    })
    /**
     * A Screen Directive
     * 
     */
    .directive('aScreen', [ "$compile", "$jQuery", function($compile, $jQuery) {
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
                screenScope = scope._screen = screen.layoutScope,
                blockScope = scope._block = screenScope.block = block.layoutScope,
                layoutScope,
                name = screenScope.name = block.addChild(screenScope, iAttrs.withName),
                childScope;
            //
            // Watchers and Listeners
            // get the root layout scope when it becomes available
            scope.$evalAsync(function(){
                layoutScope = scope._layout = blockScope.layout;
              });
            // add/remove template 
            screenScope.$watch("displaying()", function(newval, oldval){
                              if(newval == oldval) return;
                              toggleContent(newval)
                            });
            // watch the height of the element
            screenScope.$watch( function(){ return $jQuery(iElement).height(); },
                          function(newval){ 
                            screenScope.height = newval;
                          } );
            // watch the width of the element
            screenScope.$watch( function(){ return $jQuery(iElement).width(); },
                          function(newval){ 
                            screenScope.width = newval;
                          } );
            // listen for transitionedOut event to dispose the overlay contents
            scope.$on("transitionedIn", function(){
              // screenScope.height = $jQuery(iElement).height();
              // screenScope.width = $jQuery(iElement).width();
            });
            // listen for transitionedOut event to dispose the screen contents
            scope.$on("transitionedOut", function(){
              clearContent();
            });
            // 
            // Init
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
      * An Overlay Directive
      * 
      */
     .directive('anOverlay', [ "$compile", "$exceptionHandler", "$jQuery", function($compile, $exceptionHandler, $jQuery) {
       return {
         restrict:"EA",
         scope:true,
         require:["^?aLayout", "^?aBlock","^?aScreen", "anOverlay"],
         controller: OverlayDirectiveCtrl,
         //////////////////
         // COMPILE
         compile:function(element, attr){
           var template = element.html();
           element.html("");
           //////////////
           // LINK
           return function(scope, iElement, iAttrs, controllers){
            // properties
            var overlay, overlayScope, parentScope, name, childScope, masterOverlay;
            // 
            // get parent controller and
            // init the parent layout scope
            for (var i=0; i < 3; i++) {
             if(controllers[i]){
               parentScope = (controllers[i]).layoutScope;
             }
            };
            if(!parentScope) $exceptionHandler("No parent scope found!");
            if(!parentScope.overlay_ids){
              parentScope.overlays_by_id = {};
              parentScope.overlay_ids = [];
              parentScope.overlay = angular.bind( parentScope, function(name){
               name = name || this.currentOverlay || this.overlay_ids[0];
               return this.overlays_by_id[name];
              });
            }
            // wire up properties
            scope._parent = parentScope;
            overlay = controllers[3];
            overlayScope = scope._overlay = overlay.layoutScope;
            name = overlayScope.name = overlay.getUniqueID( iAttrs.withName, parentScope.overlay_ids, "overlay_");
            parentScope.overlay_ids.push(name);
            parentScope.overlays_by_id[name] = overlayScope; 
             //
             // Watchers and Listeners
             // add/remove template 
             overlayScope.$watch( "displaying()", 
                          function(newval, oldval){
                             if(newval == oldval) return;
                             toggleContent(newval)
                           });
             // watch the height of the element
             parentScope.$watch( "height",
                           function(newval){ 
                             overlayScope.height = newval;
                           } );
             // watch the width of the element
             parentScope.$watch( "width",
                           function(newval){ 
                             overlayScope.width = newval;
                           } );
              // listen for transitionedOut event to dispose the overlay contents
              scope.$on("transitionedIn", function(){
                overlayScope.height = parentScope.height;
                overlayScope.width = parentScope.width;
              });
             // listen for transitionedOut event to dispose the overlay contents
             scope.$on("transitionedOut", function(){
               clearContent(); 
             });
             scope.$on("$destroy", function(){
               var ids =  parentScope.overlay_ids;
               clearContent(); 
               delete parentScope.overlays_by_id[name];
               ids.splice(ids.indexOf(name), 1);
               parentScope.currentOverlay = null;
             });
             // 
             // Init
             overlay.init();
             // 
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
                 overlay.transitionIn();
               } else {
                 overlay.transitionOut();
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
     .directive('anOverlayPanel', ["$jQuery","$window", "$timeout", function($jQuery, $window, $timeout){
      return{
        restrict: "EA",
        controller: OverlayPanelDirectiveCtrl,
        link: function(scope, elm, attrs, ctrl) {
          var panel = scope._panel,
              responsiveness = !isNaN(attrs.responsiveness) ? Number(attrs.responsiveness) : 300,
              resizeCount = 0;
          scope._overlay.$watch("width+'~'+height", function(){
            if(scope._overlay.transState == "transitionedIn") panel.reposition();
          });
          panel.$watch("width+'~'+height+'~'+align", function(){
            panel.reposition();
          })
          scope.$watch(function(){
              return $jQuery(elm).height();
            },
            function(newval){
              if(panel.transState == "transitionedIn") panel.height = newval;
            }
          );
          scope.$watch(function(){ return $jQuery(elm).width(); },
            function(newval){
              if(panel.transState == "transitionedIn") panel.width = newval;
            }
          );
          scope.$on("transitionedIn", function () {
            panel.width = $jQuery(elm).width();
            panel.height = $jQuery(elm).height();
            panel.reposition();
          })
          scope._overlay.$watch("displaying()", function(newval, oldval){
            if(oldval == newval) return;
            else if (newval) toggleBinding(true);
            else toggleBinding();
          })
          // init
          toggleBinding(true);
          ctrl.init();
          // 
          // private
          function toggleBinding (bind) {
            if(bind){
              $jQuery($window).bind("resize", updateSize);
            } else {
              $jQuery($window).unbind("resize", updateSize);
            }
          }
          function updateSize () {
            $timeout((function(c){
              return function(){
                if(c < resizeCount) return;
                scope._parent.$digest();
              }
            })(++resizeCount), responsiveness, false);
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
        require: ["?aLayout", "?aBlock", "?aScreen", "?anOverlay", "?anOverlayPanel"],
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
    
    