function OverlayDirectiveCtrl ($scope, $attrs, $element, transition, augmentController) {
  var self = this,
      overlay = $scope._overlay = $scope.$new(true),
      trans = this.transition = trasnition(overlay, $element),
      extCtrl = $attrs.withController;
  
  $element.css("width","100%");
  $element.css("height","100%");
  $element.css("overflow-x","hidden");
  $element.css("overflow-y","hidden");
  $element.css("position","absolute");
  $element.css("z-index","100");
  trans.state.config("init", {hidden: true});    
  trans.state.config("hide", {hidden: true});    
  trans.state.config("show", {hidden: false});    
  trans.bind({ hidden: "css-hidden" });
  
  ////////////////
  // Scope API
  //
  overlay.show = function(name){
    var name = name || overlay.name;
    $scope._parent.currentOverlay = name;
  }
  
  overlay.hide = function(){
    $scope._parent.currentOverlay = null;
  }
  
  overlay.displaying = function(name){
    var name = name || overlay.name;
    return ($scope._parent.currentOverlay == name);
  }
  
  ////////////////
  // Ctrl API 
  // transition functions
  // nb: Notice that transition events are broadcast on the directive scope, not the isolated 
  //     layout scope. This makes them available to your app controllers
  this.transitionIn = function(){
    $scope.$broadcast("transitioningIn");
    trans.state("show");
  }
  
  this.transitionInComplete = function(){
    $scope.$broadcast("transitionedIn");
  }
  
  this.transitionOut = function(){
    $scope.$broadcast("transitioningOut");
    trans.state("hide");
  }
   
  this.transitionOutComplete = function(){
    $scope.$broadcast("transitionedOut");
  }
  
  this.layoutScope = overlay;
  
  // init function get called during linking phase
  this.init = function(){
    trans.state("init");
    // augment controller
    if(angular.isString(extCtrl) && extCtrl.length > 0) {
      locals = { $scope: $scope, 
                 $element: $element, 
                 $attrs: $attrs, 
                 $trans: trans };
      augmentController(extCtrl, this, locals);
    }
  }
  
  // make it easier to override these functions
  this._super = angular.extend(this._super||{}, {
    init: self.init, 
    transitionIn: self.transitionIn,
    transitionInComplete: self.transitionInComplete,
    transitionOut: self.transitionOut,
    transitionOutComplete: self.transitionOutComplete
  });
}

OverlayDirectiveCtrl.$inject = ["$scope", "$attrs", "$element", "transition", 'augmentController'];

 /**
   * A overlay Directive
   * 
   */
  .directive('anOverlay', [ "$compile", "$exceptionHandler" function($compile, $exceptionHandler) {
    return {
      restrict:"EA",
      scope:true,
      require:["^?aLayout", "^?aBlock","^?aScreen", "anOverlay"],
      controller: OverlayDirectiveCtrl,
      //////////////////
      // COMPILE
      compile:function(element, attr){
        var template = element.html();
        element.html("");
        //////////////
        // LINK
        return function(scope, iElement, iAttrs, controllers){
          // properties
          var overlay, overlayScope, parentScope, name, childScope;
          // 
          // get parent controller
          for (var i=0; i < 3; i++) {
            if(controllers[i]){
              parentScope = (controllers[i]).layoutScope;
            }
          };
          if(!parentScope) $exceptionHandler("No parent scope found!");
          scope._parent = parentScope;
          overlay = controllers[3];
          overlayScope = scope._overlay;
          //
          // Watchers and Listeners
          // add/remove template 
          overlayScope.$watch("displaying()", function(newval, oldval){
                            if(newval == oldval) return;
                            toggleContent(newval)
                          });
          // watch the height of the element
          overlayScope.$watch( function(){ return $(iElement).height(); },
                        function(newval){ 
                          overlayScope.height = newval;
                        } );
          // watch the width of the element
          overlayScope.$watch( function(){ return $(iElement).width(); },
                        function(newval){ 
                          overlayScope.width = newval;
                        } );
          // listen for transitionedOut event to dispose the overlay contents
          scope.$on("transitionedOut", function(){
            clearContent(); 
          });
          // 
          // Init
          overlay.init();
          // 
          if(!parentScope.overlay){
            parentScope.overlay = overlayScope;
          }
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