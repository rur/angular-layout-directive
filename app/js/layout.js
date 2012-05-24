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
      triggered = false,
      flowFunc;
  trans.state.config("init", {height: 0});
  trans.bind("height", "css-height");
  
  $element.css("width","100%");
  $element.css("position","relative");
  
  this.addBlock = function(block){
    blocks.push(self.removeBlock(block));
    return block;
  }
  
  this.addBlockAt = function(block, index){
    blocks.splice(index,0,self.removeBlock(block));
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
    return block;
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
    if(!triggered){
      $scope.$evalAsync(function(){
        flowFunc(blocks, $scope);
        triggered = false;
      });
      triggered = true;
    }
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
function BlockDirectiveCtrl ($scope, $element, $attrs, transition, augmentController, $exceptionHandler) {
  var self = this,
      trans = this.transition = transition($scope, $element),
      extCtrl = $attrs["withController"],
      locals,
      ids = [],
      un$watchers = [];  
  
  $element.css("width","100%");
  $element.css("position","absolute");
  trans.state.config("init", {height: 0});    
  trans.bind({ height: "css-height",
               y: "css-y", 
               opacity: "css-opacity" });
  
  this.registerScreenID = function(id){
    id = safeIncrKey(id);
    ids.push(id);
    return id;
  }
  
  this.getScreenIndex = function (id){
    for (var i=0; i < ids.length; i++) {
      if(ids[i] == id) return i;
    };
    return -1;
  }
  
  this.showScreen = function(id){
    if(self.getScreenIndex(id) > -1){
      $scope.currentScreen = id;
    } else {
      $exceptionHandler("Cannot show screen '"+id+"' there is no screen registered with that id");
    }
  }
  
  this.deltaID = function(delta, startID){
    var d, ind, start;
    if(startID){
      start = self.getScreenIndex(startID);
      if(start == -1) $exceptionHandler("Screen ID '" +startID+"' not found, cannot retreive delta ID");
    } else {
      start = 0;
    }
    d = (start+delta) % ids.length;
    ind = d>-1 ? d : d+ids.length;
    return ids[ind];
  }
  
  this.screenHeight = function(height){
    $scope.height = height;
  }

  this.triggerReflow = function(){
    $scope.triggerReflow();
  }
  
  $scope.$watch("height", self.triggerReflow);
  
  if(angular.isString(extCtrl) && extCtrl.length > 0) {
    locals = { $scope: $scope, 
               $element: $element, 
               $attrs: $attrs, 
               $trans: trans };
    augmentController(extCtrl, this, locals);
  }
  
  function safeIncrKey(key){
    if(!(angular.isString(key) && (key = trim(key)).length>0)){
      key = ids.length.toString();
    }
    var reg = RegExp("^"+key+"(_\\d+)?$"),
        matches = [];
    angular.forEach(ids, function(id){
      if(reg.test(id)){
        matches.push(id);
      }
    });
    if(matches.length > 0 ){
      return key+"_"+matches.length;
    }
    return key;
  }
  function trim(stringToTrim) {
  	return stringToTrim.replace(/^\s+|\s+$/g,"");
  }
}
LayoutDirectiveCtrl.$inject = ["$scope", "$element", "$attrs", "transition", "augmentController", "$exceptionHandler"];

/**
 * ScreenDirectiveCtrl
 * 
 * 
 * 
 */
function ScreenDirectiveCtrl($scope, $element, $attrs, transition, augmentController){
  var self = this,
      screen = $scope._screen = $scope.$new(true), // isolated scope for layout
      extCtrl = $attrs["withController"],
      trans = this.transition = transition(screen, $element),
      locals;
  
  trans.state.config("init", {hidden: true});
  trans.state.config("show", {hidden: false});
  trans.state.config("hide", {hidden: true});
  trans.bind({ hidden: "css-hidden" });
  
  screen.show = function(id){
    id = id || screen.id;
    self.layout.showScreen(id);
    if(id == screen.id) trans.state("show");
  }
  
  screen.hide = function(){
    trans.state("hide");
  }
  
  if(angular.isString(extCtrl) && extCtrl.length > 0) {
    locals = { $scope: $scope, 
               $element: $element, 
               $attrs: $attrs, 
               $trans: trans };
    augmentController(extCtrl, this, locals);
  }
}
ScreenDirectiveCtrl.$inject = ["$scope", "$element", "$attrs", "transition", "augmentController"]




