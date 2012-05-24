'use strict';

/* Directives */
angular.module('myApp.directives', [])
  .directive('aLayout', function() {
      return {
        restrict:"EA",
        scope:{},
        transclude:true,
        template:'<div class="a-layout" ng-transclude></div>',
        replace:true,
        controller: LayoutDirectiveCtrl, // see layout.js
        link:function(scope, iElement, iAttrs, ctrl){
          ctrl.transition.state("init");
        }
      } 
    })  
    .directive('aBlock', function() {
      return {
        restrict:"EA",
        scope:{},
        require:["^aLayout","aBlock"],
        transclude:true,
        template:'<div class="a-block" ng-transclude></div>',
        replace:true,
        controller: BlockDirectiveCtrl, // see layout.js
        link:function(scope, iElement, iAttrs, controllers){
          var layout = controllers[0],
              block = controllers[1],
              reflow_un$watchers = {};
          iElement.css("width","100%");
          iElement.css("position","absolute");
          layout.addBlock(scope);
          scope.triggerReflow = function(){
            layout.reflow();
          }
        }
      } 
    })
    .directive('aScreen', [ "$compile", function($compile) {
      return {
        restrict:"EA",
        scope:true,
        require:["^aBlock","aScreen"],
        controller: ScreenDirectiveCtrl,
        compile:function(element, attr){
          var template = element.html();
          element.html("");
          return function(scope, iElement, iAttrs, controllers){
            var screen = controllers[1],
                block = screen.block = controllers[0],
                id = scope._screen.id = block.registerScreenName(iAttrs.withName),
                childScope;
            screen.transition.state("init");
            
            block.scope.$watch("currentScreen", function(newval, oldval){
              if(newval == oldval) return;
              if(oldval == id){
                scope._screen.hide();
              } else if(newval == id) {
                if(childScope){
                  childScope.$destroy();
                }
                childScope = scope.$new();
                element.html(template);
                $compile(element.contents())(childScope);
                scope._screen.show();
              }
            });
            
            block.scope.$on("clearContent", function(event){
              if (childScope) {
                childScope.$destroy();
                childScope = null;
              }
              iElement.html('');
            });
            
            scope.$watch(function(){
                return $(element).height();
              },
              function(newval, oldval){
                block.screenHeight(newval);
              });
        }}
      } 
    }])
    // // .directive('beSlidey', function(){
    //   return {
    //     require: ["?aLayout", "?aBlock", "?aScreen"],
    //     link:function (scope, element, attrs, controllers) {
    //       var props = (attrs["beSlidey"]).split(","),
    //           controllers = controllers || [],
    //           bindings = {
    //             x: "slidey-x",
    //             y: "slidey-y",
    //             width: "slidey-width",
    //             height: "slidey-height",
    //             opacity: "slidey-opacity"
    //           };
    //       angular.forEach(controllers,function(controller){
    //         if(controller == undefined) return;
    //         controller.transition.addSuite(SlideyTransitionSuite);
    //         angular.forEach(props, function(val){
    //           if(bindings.hasOwnProperty(val)){
    //             controller.transition.bind(val, bindings[val]);
    //           }
    //         });
    //       });
    //       
    //       function SlideyTransitionSuite () {
    //         var props = {};
    //          this.register("slidey-x", function (newval, oldval) {
    //            newval = !isNaN(newval) ? newval.toString() + "px" : newval;
    //            props["left"] = newval;
    //          })
    // 
    //          this.register("slidey-y", function (newval, oldval) {
    //            newval = !isNaN(newval) ? newval.toString() + "px" : newval;
    //            props["top"] = newval;
    //          })
    // 
    //          this.register("slidey-width", function (newval, oldval) {
    //            newval = !isNaN(newval) ? newval.toString() + "px" : newval;
    //            props["width"] = newval;
    //          })
    // 
    //          this.register("slidey-height", function (newval, oldval) {
    //            newval = !isNaN(newval) ? newval.toString() + "px" : newval;
    //            props["height"] = newval;
    //          })
    // 
    //          this.register("slidey-opacity", function (newval, oldval) {
    //            if(isNaN(newval)) return;
    //            props["opacity"] = newval;
    //          })
    // 
    //          this.fire = function(element, config){
    //            var dur = config["duration"] || 300,
    //                onComplete = config["slideyComplete"] || angular.noop;
    //            $(element).animate(props, dur, onComplete);
    //            props = {};
    //          }
    //         
    //       }
    //     } 
    //   }
    // });
    
    