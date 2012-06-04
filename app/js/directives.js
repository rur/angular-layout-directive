'use strict';

/* Directives */
angular.module('myApp.directives', [])
  /**
   * A Layout directive
   * 
   */
  .directive('aLayout', [ "windowResizeWatcher", function(windowResizeWatcher) {
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
          scope.name = iAttrs.withName;
          // init
          // binds a listener to window resize event, which calls $rootScope#$apply() when it changes
          windowResizeWatcher();
          ctrl.init();
        }
      } 
    }])  
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
          // dispose
          scope.$on("$destroy", function(){
            block = layoutScope = layout = null;
          });
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
           // var template = element.html();
           element.html("");
           //////////////
           // LINK
           return function(scope, iElement, iAttrs, controllers){
            // properties
            var overlay, 
                overlayScope, 
                parentScope,
                childScope,
                parentUn$watchers = [];;
            // 
            // get parent layout scope
            for (var i=0; i < 3; i++) {
             if(controllers[i]){
               parentScope = (controllers[i]).layoutScope;
             }
            };
            if(!parentScope) $exceptionHandler("No parent scope found!");
            // wire up properties
            scope._parent = parentScope;
            overlay = controllers[3];
            overlayScope = scope._overlay = overlay.layoutScope;
             //
             // Watchers and Listeners
             // add/remove template 
             overlayScope.$watch( "displaying()", 
                          function(newval, oldval){
                             if(newval == oldval) return;
                             toggleContent(newval)
                           });  
             // listen for transitionedOut event to dispose the overlay contents
             scope.$on("transitionedOut", clearContent);
             scope.$on("$destroy", function(){
               clearContent(); 
               parentScope.overlay_register.clear();
               parentScope.currentOverlay = null;
               overlayScope.$destroy();
               overlay = overlayScope = parentScope = null;
             });
             // 
             // Init
             overlay.init();
             watchParent();
             // 
             // 
             // private
             function watchParent () {
               unWatchParent();
              // watch the height of the element
              parentUn$watchers.push(parentScope.$watch( "height",
                            function(newval){ 
                              overlayScope.height = newval;
                            } ));
              // watch the width of the element
              parentUn$watchers.push(parentScope.$watch( "width",
                            function(newval){ 
                              overlayScope.width = newval;
                            }));
              parentUn$watchers.push(parentScope.$watch("transState",function(newval){
               switch(newval){
                 case "transitionedIn":
                   overlayScope.height = parentScope.height;
                   overlayScope.width = parentScope.width;
                   break;
                 case "transitioningOut":
                   unWatchParent();
                   break;
               }
              }));
             }
             function unWatchParent () {
               angular.forEach(parentUn$watchers, function(un$watch){
                 un$watch();
               });
               parentUn$watchers = [];
             }
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
     .directive('anOverlayPanel', ["$jQuery", function($jQuery){
      return{
        restrict: "EA",
        transclude: true,
        template: "<div class='an-overlay-panel'><div class='an-overlay-panel-content' style='display: inline-block; width: 100%;' ng-transclude></div></div>",
        replace: true,
        controller: OverlayPanelDirectiveCtrl,
        //////////////
        // LINK
        link: function(scope, elm, attrs, ctrl) {
          var panel = scope._panel,
              overlayUn$watchers = [];
          // watchers
          panel.$watch("width+'~'+height+'~'+align", function(){
            if(panel.transState == "transitionedIn") panel.reposition();
          });
          scope.$watch(function(){ return $jQuery(elm).children(".an-overlay-panel-content").height(); },
            function(newval){
              panel.height = newval;
            }
          );
          scope.$watch(function(){ return $jQuery(elm).children(".an-overlay-panel-content").width(); },
            function(newval){
              panel.width = newval;
            }
          );
          // 
          scope.$on("$destroy", function(){
            panel.$destroy()
            panel = null;
            ctrl.layoutScope.$destroy();
          })
          // init
          ctrl.init();
          // show it
          ctrl.transitionIn();
          watchParent();
          // private
          function watchParent () {
            unWatchParent();
            overlayUn$watchers.push(scope._overlay.$watch("width+'~'+height", function(){
              if(scope._overlay.transState == "transitionedIn") panel.reposition();
            }));
            overlayUn$watchers.push(scope._overlay.$watch("transState",function(newval){
              switch(newval){
                case "transitionedIn":
                  panel.width = $jQuery(elm).children(".an-overlay-panel-content").width();
                  panel.height = $jQuery(elm).children(".an-overlay-panel-content").height();
                  panel.reposition();
                  elm.css("top", panel.y);
                  elm.css("left", panel.x);
                  break;
                case "transitioningOut":
                  unWatchParent();
                  break;
              }
            }));
          }
          function unWatchParent () {
            angular.forEach(overlayUn$watchers, function(un$watch, key){
              un$watch();
            });
            overlayUn$watchers = [];
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
    
    