function BlockDirectiveCtrl ($scope, $element, $attrs, transition, augmentController) {
  var self = this,
      trans = this.transition = transition($scope, $element),
      extCtrl = $attrs["withController"],
      locals,
      ids = [];
  
  this.scope = $scope;
  
  // it should register a screen id returning a unique key
  
  this.registerScreenID = function(id){
    id = safeIncrKey(id);
    ids.push(id);
    if(!$scope.currentScreen) $scope.currentScreen = id;
    return id
  }
  
  // it should set the currentScreen
  
  this.showScreen = function(id){
    $scope.currentScreen = id;
  }
  
  // it should provide the index of the screen id supplied
  
  this.getScreenIndex = function(id){
    angular.forEach(ids, function(_id, ind){
      if(id == _id) return ind;
    });
    return -1;
  }
  
  // it should provide the id at a delta
  
  this.deltaID = function(delta, start_id){
    var start, d, ind;
    if(start_id){
      start  = getScreenIndex(start_id);
      if(start == -1) throw "Screen ID '" +id+"' not found, cannot retreive delta ID.";
    } else {
      start = 0;
    }
    d = (start+delta) % ids.length;
    ind = d>-1 ? d : d+ids.length;
    return ids[ind];
  }
  
  // it should set screenHeight
  
  this.screenHeight = function(height){
    $scope.height = height;
  }
  
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
LayoutDirectiveCtrl.$inject = ["$scope", "$element", "$attrs", "transition", "augmentController"];
