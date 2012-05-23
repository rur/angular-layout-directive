'use strict';

/**
 * LayoutDirectiveCtrl
 * 
 * 
 * 
 */
function LayoutDirectiveCtrl ($scope, $element, $attrs, transition, augmentController) {
  var self = this,
      trans = this.transition = transition($scope, $element),
      extCtrl = $attrs["withController"],
      locals,
      blocks = [],
      flowFunc;
  trans.state.config("init", {height: 0});
  trans.bind("height", "css-height");
  
  $element.css("width","100%");
  $element.css("position","absolute");
  
  this.addBlock = function(block){
    blocks.push(block);
  }
  
  this.addBlockAt = function(block, index){
    blocks.splice(index,0,block);
  }
  
  this.indexOfBlock = function(block){
    for (var i=0; i < blocks.length; i++) {
      if (block === blocks[i]) return i;
    };
    return -1;
  }
  
  this.removeBlock = function(block){
    var ind = self.indexOfBlock(block);
    if(ind > -1) blocks.splice(ind, 1);
  }
  
  this.getDefaultReflow = function(){
    return function (blocks, scope) {
      var pos = 0,
          width = 0;
      angular.forEach(blocks, function (block, ind){
        block.y = pos;
        pos += block.height;
        if(width < block.width) width = block.width;
      });
      scope.height = pos;
      scope.width = width;
    }
  }
  
  this.setReflow = function(func){
    flowFunc = func;
  }
  
  this.reflow = function(){
    flowFunc(blocks, $scope);
  }
  
  this.setReflow(self.getDefaultReflow());
  
  if(angular.isString(extCtrl) && extCtrl.length > 0) {
    locals = { $scope: $scope, 
               $element: $element, 
               $attrs: $attrs, 
               $trans: trans };
    augmentController(extCtrl, this, locals);
  }
}
LayoutDirectiveCtrl.$inject = ["$scope", "$element", "$attrs", "transition", "augmentController"];

/**
 * BlockDirectiveCtrl
 * 
 * 
 * 
 */
function BlockDirectiveCtrl ($scope, $element, $attrs, transition, augmentController) {
  var self = this,
      trans = this.transition = transition($scope, $element),
      extCtrl = $attrs["withController"],
      locals;
  trans.state.config("init", {height: 0});    
  trans.bind({ height: "css-height",
               y: "css-y", 
               opacity: "css-opacity" });
  
  $element.css("width","100%");
  $element.css("position","absolute");
  
  if(angular.isString(extCtrl) && extCtrl.length > 0) {
    locals = { $scope: $scope, 
               $element: $element, 
               $attrs: $attrs, 
               $trans: trans };
    augmentController(extCtrl, this, locals);
  }
}
LayoutDirectiveCtrl.$inject = ["$scope", "$element", "$attrs", "transition", "augmentController"];