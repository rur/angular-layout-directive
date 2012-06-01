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
              layoutScope = layout.layoutScope;
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
        require:["^aLayout", "^aBlock", "aScreen"],
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
            var screen  = controllers[2],
                block   = controllers[1],
                layout  = controllers[0],
                screenScope = scope._screen = screen.layoutScope,
                blockScope  = scope._block  = block.layoutScope,
                layoutScope = scope._block  = layout.layoutScope,
                name = screenScope.name = block.addChild(screenScope, iAttrs.withName),
                childScope,
                un$watchers = [];
            //
            // Watchers and Listeners
            // add/remove template 
            un$watchers.push( screenScope.$watch("displaying()", function(newval, oldval){
                              if(newval == oldval) return;
                              toggleContent(newval)
                            }));
            // watch the height of the element
            un$watchers.push( screenScope.$watch( function(){ return $jQuery(iElement).height(); },
                          function(newval){ 
                            screenScope.height = newval;
                          } ));
            // watch the width of the element
            un$watchers.push(screenScope.$watch( function(){ return $jQuery(iElement).width(); },
                          function(newval){ 
                            screenScope.width = newval;
                          } ));
            // listeners
            scope.$on("transitionedOut", function(){
              clearContent();
            });
            scope.$on("$destroy", function(){
              angular.forEach(un$watchers, function(un$watch){
                try{
                  un$watch();
                } catch(err){}
              });
            })
            // 
            // Init
            // if this is first screen registered, show it
            screen.init();
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
            var overlay, 
                overlayScope, 
                parentScope, 
                name, 
                childScope, 
                masterOverlay,
                un$watchers = [];
            // 
            // get parent scope
            for (var i=0; i < 3; i++) {
             if(controllers[i]){
               parentScope = (controllers[i]).layoutScope;
             }
            };
            if(!parentScope) $exceptionHandler("No parent scope found!");
            // init the parent scope to manage overlays
            if(!parentScope.overlay_init){
              parentScope.overlays_by_id = {};
              parentScope.overlay_ids = [];
              parentScope.overlay = angular.bind( parentScope, function(name){
               name = name || this.currentOverlay || this.overlay_ids[0];
               return this.overlays_by_id[name];
              });
              parentScope.overlay_init = true;
            }
            // 
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
             un$watchers.push(overlayScope.$watch( "displaying()", 
                          function(newval, oldval){
                             if(newval == oldval) return;
                             toggleContent(newval)
                           }));
             // watch the height of the element
             un$watchers.push(parentScope.$watch( "height",
                           function(newval){ 
                             overlayScope.height = newval;
                           } ));
             // watch the width of the element
             un$watchers.push(parentScope.$watch( "width",
                           function(newval){ 
                             overlayScope.width = newval;
                           }));
             // listen for transitionedOut event to dispose the overlay contents
             un$watchers.push(parentScope.$watch("trasnState", function(){
                overlayScope.height = parentScope.height;
                overlayScope.width = parentScope.width;
              }));
             // listen for transitionedOut event to dispose the overlay contents
             scope.$on("transitionedOut", clearContent);
             scope.$on("$destroy", function(){
               var ids =  parentScope.overlay_ids;
               clearContent(); 
               delete parentScope.overlays_by_id[name];
               ids.splice(ids.indexOf(name), 1);
               parentScope.currentOverlay = null;
               angular.forEach(un$watchers, function(un$watch){
                try{
                  un$watch();
                }catch(err){}
               });
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
        //////////////
        // LINK
        link: function(scope, elm, attrs, ctrl) {
          var panel = scope._panel,
              responsiveness = !isNaN(attrs.responsiveness) ? Number(attrs.responsiveness) : 50,
              resizeCount = 0,
              un$watchers = [];
          // watchers
          un$watchers.push(scope._overlay.$watch("width+'~'+height", function(){
            if(scope._overlay.transState == "transitionedIn") panel.reposition();
          }));
          un$watchers.push(panel.$watch("width+'~'+height+'~'+align", function(){
            panel.reposition();
          }));
          un$watchers.push(scope.$watch(function(){ return $jQuery(elm).height(); },
            function(newval){
              if(panel.transState == "transitionedIn") panel.height = newval;
            }
          ));
          un$watchers.push(scope.$watch(function(){ return $jQuery(elm).width(); },
            function(newval){
              if(panel.transState == "transitionedIn") panel.width = newval;
            }
          ));
          un$watchers.push(scope._overlay.$watch("transState",function(newval){
            switch(newval){
              case "transitionedIn":
                panel.width = $jQuery(elm).width();
                panel.height = $jQuery(elm).height();
                panel.reposition();
                elm.css("top", panel.y);
                elm.css("left", panel.x);
                break;
            }
          }));
          // listeners
          scope.$on("transitioningOut", function(){
            toggleDisplay(false);
          })
          scope.$on("$dispose", function(){
            toggleDisplay(false);
            angular.forEach(un$watchers, function(un$watch){
              try{
                un$watch();
              } catch(err){}
            });
          })
          // init
          ctrl.init();
          // show it
          toggleDisplay(true);
          // 
          // private
          function toggleDisplay (show) {
            if(show){
              $jQuery($window).bind("resize", updateSize);
              ctrl.transitionIn();
            } else {
              $jQuery($window).unbind("resize", updateSize);
              ctrl.transitionOut();
            }
          }
          function updateSize () {
            $timeout((function(c){
              return function(){
                if(c < resizeCount) return;
                scope._parent.$apply();
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
                // TODO: implement these
                // "hidden[height]": "slidey-hide-height",
                // "hidden[fade]": "slidey-hide-fade"
              };
          angular.forEach(controllers,function(controller){
            if(!angular.isDefined(controller)) return;
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
    
    