'use strict';

/*/
  Base controller class to add transition binding 
  to a layout directive controller
//*/
function TransitionDirectiveCtrl ($scope, $element, transition) {
  $scope.transitions = {};
  // method to bind a scope property to a transition definition key
  this.bindTransitions = function (hash){
   for(var key in hash){
     if(!$scope.transitions.hasOwnProperty(key)){
       $scope.$watch(key,(function(prop){
         return function( newVal, oldVal){
           var trans = transition( $scope.transitions[prop] );
           trans($element, newVal, oldVal);
         }
       })(key));
     }
     $scope.transitions[key] = hash[key];
   }
  }
}
TransitionDirectiveCtrl.$inject = ["$scope", "$element", "transition"]
// 
// function LayoutCtrlFactory () {
//   function LayoutCtrl ($scope, $element, $attr) { // extends TransitionDirectiveCtrl
//      var blocks = [],
//        reflowFunction;
// 
//      // add/removes a block scope to the list of blocks
//      // This also registers a listeners to the $destroy event
//      this.addBlock = function  (blockScope) {
//        return addBlockAt(blockScope, blocks.length);
//      }
//      
//      this.addBlockAt = function(blockScope, ind){
//         blockScope.$on("$destroy",function (event) {
//           this.removeBlock(event.target)
//         })
//         ind = Math.min(ind, blockScope.lenght);
//         blockScope.splice(ind,0,blockScope);
//         return ind;
//      }
//      
//      this.removeBlock = function  (blockScope) {
//        var ind = blocks.indexOf(blockScope);
//        if(ind > -1){
//          blocks.splice(ind, 1);
//        }
//      }
// 
//      // apply a flow function
//      this.setReflowFunction = function  (func) {
//        reflowFunction = func;
//      }
// 
//      this.defaultReflowFunction = function(){
//        return function(blx, layout){
//          var top = 0,
//              blc,
//              i;
//          for (i=0; i < blx.length; i++) {
//            blc = blx[i];
//            blc.y = top;
//            top += blc.height;
//          };
//          layout.height = top;
//        }
//      }
// 
//      // Triggers the reflow
//      this.reflow = function () {
//        reflowFunction(blocks, $scope);
//      }
//      
//      // set defaults
//      this.setReflowFunction(this.defaultReflowFunction());
//      this.bindTransitions({ height:"height", width:"width" });
// 
//      // include user layout controller if provided
//      var extCtrl = $attr["withController"];
//      if(extCtrl){
//        var locals = { 
//            $scope:$scope,
//            $element:$element,
//            $attr:$attr  
//          };
//        augmentController(extCtrl, this, locals);
//      }
//    }
//    
//    return my_angular_utils.extendController(TransitionDirectiveCtrl, LayoutCtrl)
// }
