function ScreenDirectiveCtrl ($scope, $element, $attrs, transition, augmentController) {
  var ctrl = this,
      screen = $scope._screen = $scope.$new(true), // isolated scope for layout
      trans = this.transition = transition(screen, $element),
      extCtrl = $attrs.withController,
      locals;
  // it should create and configure transitions
  trans.state.config("init", {hidden: true});
  trans.state.config("show", {hidden: false});
  trans.state.config("hide", {hidden: true}, {onComplete: function(){
    $scope.$broadcast("clearContent");
  }});
  trans.bind("hidden", "css-hidden");
  // it should create an isolated scope for the screen api
  // it should add a show method to the screen api
  screen.show = function(id){
    id = id || self.id;
    ctrl.layout.showScreen(id);
    if(id == self.id) trans.state("show");
  }
  // it should add a hide method to the screen api
  screen.hide = function(){
    trans.state("hide");
  }
  // it should augment the controller
  if(angular.isString(extCtrl) && extCtrl.length > 0) {
    locals = { $scope: $scope, 
               $element: $element, 
               $attrs: $attrs, 
               $trans: trans };
    augmentController(extCtrl, this, locals);
  }
}
LayoutDirectiveCtrl.$inject = ["$scope", "$element", "$attrs", "transition", "augmentController"];
