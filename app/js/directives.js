'use strict';

/* Directives */
angular.module('myApp.directives', [])
  .directive('aLayout', function() {
      return {
        restrict:"E",
        scope:{},
        transclude:true,
        template:'<div class="a-layout" ng-transclude></div>',
        replace:true,
        controller: LayoutDirectiveCtrl, // see layout.js
        link:function(scope, iElement, iAttrs, ctrl){
          ctrl.transition.bind("width", "css-width");
          ctrl.transition.bind("height", "css-height");
          ctrl.transition.apply({width: "100%"}, {afterFire: function(){
            // stop width from being changed again
            ctrl.transition.bind("width", "noop");
          } });
        }
      } 
    })  
    // .directive('aBlock', ['transition','augmentController','$log', function(transition, augmentController, $log) {
    //   return {
    //     restrict:"E",
    //     scope:{},
    //     require:["^aLayout","aBlock"],
    //     transclude:true,
    //     template:'<div class="a-block" ng-transclude></div>',
    //     replace:true,
    //     controller: function controller ($scope, $element, $attrs) {
    //       
    //     },
    //     link:function(scope, iElement, iAttrs, controllers){
    //       var layout = controllers[0],
    //           block = controllers[1];
    //     }
    //   } 
    // }])
    // .directive('aScreen', ['transition','augmentController','$log', function(transition, augmentController, $log) {
    //   return {
    //     restrict:"E",
    //     scope:true,
    //     require:["^aBlock","aScreen"],
    //     controller: function controller ($scope, $element, $attrs) {
    //       
    //     },
    //     link:function(scope, iElement, iAttrs, controllers){
    //       var block = controllers[0],
    //           screen = controllers[1];
    //       
    //     }
    //   } 
    // }])
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
    
    