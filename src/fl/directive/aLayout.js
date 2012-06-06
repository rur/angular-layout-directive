'use strict';

/**
 * LayoutDirectiveCtrl
 * 
 * extends LayoutContainerBase
 * 
 */
function LayoutDirectiveCtrl ($scope, $element, $attrs, transition, augmentController) {
  var self = this,
      trans = this.transition = transition($scope, $element),
      extCtrl = $attrs["withController"],
      locals;
  
  trans.state.config("init", {height: 0});
   trans.bind("height", "css-height");
  
   $element.css("width","100%");
   $element.css("position","relative");
   /**
    * The default reflow layout function factory
    */
   this.defaultLayout = function(){
     return function (children, scope) {
       var height = 0,
           width = 0;
       angular.forEach(children, function (child){
         child.y = height;
         height += child.calculateHeight();
         width = Math.max( width, child.calculateWidth());
       });
       scope.height = height;
       scope.width = width;
     }
   }
   /**
    * Initialize the contorller, called by the linking function
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
   }
   // 
   var __super = this._super || {};
   this._super = angular.extend({}, __super, {
     defaultLayout: self.defaultLayout
   });
}
LayoutDirectiveCtrl.$inject = ["$scope", "$element", "$attrs", "transition", "augmentController"];
LayoutDirectiveCtrl = extendLayoutCtrl(LayoutContainerBase, LayoutDirectiveCtrl)


/**
 * aLayout Directive
 * 
 */
var aLayoutDirective = [ "windowResizeWatcher", function(windowResizeWatcher) {
    return {
      restrict:"EA",
            scope:{},
            transclude:true,
            template:'<div class="a-layout" ng-transclude></div>',
            replace:true,
      controller: LayoutDirectiveCtrl,
      //////////////////
      // LINK
      link:function(scope, iElement, iAttrs, ctrl){
        scope.name = iAttrs.withName;
                 // init
                 // binds a listener to window resize event, which calls $rootScope#$apply() when it changes
                 windowResizeWatcher();
                 ctrl.init();
      }
    } 
  }];

  