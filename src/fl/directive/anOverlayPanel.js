'use strict';

/**
 * OverlayPanel Directive Controller
 * 
 * extends LayoutBlockBase & LayoutDisplayBase
 * 
 */
function OverlayPanelDirectiveCtrl ($scope, $element, $attrs) {
  var self = this,
      panel = $scope._panel = this.layoutScope,
      name = panel.name = $attrs.withName,
      trans = this.transition;
  $element.css("position", "absolute");
  $element.css("display", "block");
  
  trans.bind({x: "css-x", y: "css-y"});
  // panel api
  /**
   * The side of the overlay frame that the panel aligns to
   */
  panel.align = $attrs.anOverlayPanel;
  
  /**
   * repositions the panel in relation to the parent overlay
   */
  panel.reposition = function(){
    var ovW = $scope._overlay && $scope._overlay.width || 0,
        ovH = $scope._overlay && $scope._overlay.height || 0,
        plW = panel.width || 0,
        plH = panel.height || 0;
    switch(panel.align){
      case "right":
      case "topright":
      case "bottomright":
        panel.x = ovW-plW;
        break;
      case "left":
      case "topleft":
      case "bottomleft":
        panel.x = 0;
        break;
      case "center":
      case "top":
      case "bottom":
      default:
        panel.x = (ovW-plW)*0.5;
    }    
    switch(panel.align){
      case "bottom":
      case "bottomleft":
      case "bottomright":
        panel.y = ovH-plH;
        break;
      case "top":
      case "topleft":
      case "topright":
        panel.y = 0;
        break;
      case "center":
      case "left":
      case "right":
      default:
        panel.y = (ovH-plH)*0.5;
    }
  }
  
  this.init = function(){
    
  }
}
OverlayPanelDirectiveCtrl.$inject = ["$scope", "$element", "$attrs"];
OverlayPanelDirectiveCtrl = extendLayoutCtrl(LayoutBlockBase, LayoutDisplayBase, OverlayPanelDirectiveCtrl);

/**
 * anOverlayPanel Directive 
 * 
 */
 
var anOverlayPanelDirective = ["$jQuery", function($jQuery){
   return{
     restrict: "EA",
     transclude: true,
     template: "<div class='an-overlay-panel'><div class='an-overlay-panel-content' style='display: inline-block; width: 100%;' ng-transclude></div></div>",
     replace: true,
     controller: OverlayPanelDirectiveCtrl,
     //////////////
     // LINK
     link: function(scope, elm, attrs, ctrl) {
       var panel = scope._panel,
           overlayUn$watchers = [];
       // watchers
       panel.$watch("width+'~'+height+'~'+align", function(){
         if(panel.transState == "transitionedIn") panel.reposition();
       });
       scope.$watch(function(){ return $jQuery(elm).children(".an-overlay-panel-content").height(); },
         function(newval){
           panel.height = newval;
         }
       );
       scope.$watch(function(){ return $jQuery(elm).children(".an-overlay-panel-content").width(); },
         function(newval){
           panel.width = newval;
         }
       );
       // 
       scope.$on("$destroy", function(){
         panel.$destroy()
         panel = null;
         ctrl.layoutScope.$destroy();
       })
       // init
       ctrl.init();
       // show it
       ctrl.transitionIn();
       watchParent();
       // private
       function watchParent () {
         unWatchParent();
         overlayUn$watchers.push(scope._overlay.$watch("width+'~'+height", function(){
           if(scope._overlay.transState == "transitionedIn") panel.reposition();
         }));
         overlayUn$watchers.push(scope._overlay.$watch("transState",function(newval){
           switch(newval){
             case "transitionedIn":
               panel.width = $jQuery(elm).children(".an-overlay-panel-content").width();
               panel.height = $jQuery(elm).children(".an-overlay-panel-content").height();
               panel.reposition();
               elm.css("top", panel.y);
               elm.css("left", panel.x);
               break;
             case "transitioningOut":
               unWatchParent();
               break;
           }
         }));
       }
       function unWatchParent () {
         angular.forEach(overlayUn$watchers, function(un$watch, key){
           un$watch();
         });
         overlayUn$watchers = [];
       }
     }
   }
  }]
  
