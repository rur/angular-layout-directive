'use strict';

/**
 * Add slidey animation behavior to the transtions of
 * layout element
 */
var beSlideyDirective = function(){
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
}

