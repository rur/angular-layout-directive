'use strict';

/**
 * BlockDirectiveCtrl
 * extends LayoutContainerBase and LayoutBlockBase
 * 
 * 
 */
function BlockDirectiveCtrl ($scope, $element, $attrs, transition, augmentController) {
  var self = this,
      trans = this.transition = transition($scope, $element),
      extCtrl = $attrs["withController"],
      locals;
  
  this.addReflowWatcher("calculateHeight()");
  this.addReflowWatcher("calculateWidth()");
  
  trans.state.config("init", {height: 0});
  trans.bind("height", "css-height");
  trans.bind("y", "css-y");
  
  $element.css("width","100%");
  $element.css("overflow-x","hidden");
  $element.css("overflow-y","hidden");
  $element.css("position","absolute");
  
  ////////////////
  // Scope API
  // 
  /**
   * Calculate the height of this block, used by parent reflow function
   */
  $scope.calculateHeight = function(){
    return $scope.height;
  }
  /**
   * Calculate the width of this block, used by parent reflow function
   */
  $scope.calculateWidth = function(){
    return $scope.width;
  }
    
  /**
    * The default reflow layout function factory method
    */
  this.defaultLayout = function(){
   return function (children, scope) {
    var height = 0,
        width = 0;
     angular.forEach(children, function (child){
       height += child.calculateHeight();
       width = Math.max(child.calculateWidth(), width);
     });
     scope.height = height;
     scope.width = width;
   }
  }
  /** 
   * init function get called during linking phase
   */
  this.init = function(){
    // augment controller
    if(angular.isString(extCtrl) && extCtrl.length > 0) {
      locals = { $scope: $scope, 
                 $element: $element, 
                 $attrs: $attrs, 
                 $trans: trans };
      augmentController(extCtrl, this, locals);
    }
    trans.state("init");
  }
  
  // make it easier to override these functions
  var __super = this._super || {};
  this._super = angular.extend({}, __super, {
    defaultLayout: self.defaultLayout
  });
}
BlockDirectiveCtrl.$inject = ["$scope", "$element", "$attrs", "transition", "augmentController"];
BlockDirectiveCtrl = extendLayoutCtrl(LayoutContainerBase, LayoutBlockBase, BlockDirectiveCtrl);

/**
 * aBlock Directive
 * 
 * 
 */

var aBlockDirective =  function() {
   return {
     restrict:"EA",
     scope:{},
     require:["^aLayout","aBlock"],
     transclude:true,
     template:'<div class="a-block" ng-transclude></div>',
     replace:true,
     controller: BlockDirectiveCtrl,
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
 }
 
 