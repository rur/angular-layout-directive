'use strict';

/**
 * AnOverlayDirectiveCtrl
 * 
 * extends LayoutContainerBase & LayoutDisplayBase
 * 
 */
 function OverlayDirectiveCtrl ($scope, $attrs, $element, augmentController, $exceptionHandler) {
   var self = this,
       overlay = this.layoutScope,
       trans = this.transition,
       extCtrl = $attrs.withController,
       locals;
   // standard css
   $element.css("width","100%");
   $element.css("height","100%");
   $element.css("overflow-x","hidden");
   $element.css("overflow-y","hidden");
   $element.css("position","absolute");
   $element.css("z-index","100");
   $element.css("top","0px");
   $element.css("left","0px");
   ////////////////
   // Scope API
   //
   overlay.show = function(name){
     var name = name || overlay.name;
     if($scope._parent.overlay_register.contains(name)){
       $scope._parent.currentOverlay = name;
     }
   }
   // 
   overlay.hide = function(){
     $scope._parent.currentOverlay = null;
   }
   // 
   overlay.displaying = function(name){
     var name = name || overlay.name;
     return ($scope._parent.currentOverlay == name);
   }
   // 
   // init function get called during linking phase
   this.init = function(parentScope){
     ////////////////
     // Setup parent scope for overlays
     //// This adds propeties and functions to the parent
     //// layout scope to manage overlays
     if (!parentScope.overlay) {
       parentScope.overlay_register = new Registry("Overlay Register");
       parentScope.overlay = function(name){
         var reg = this.overlay_register;
         if(angular.isDefined(name)) {
           if( !reg.contains(name)) $exceptionHandler("Overlay with name'"+name+"' not found");
           return reg.get(name)
         }else if(angular.isString(this.currentOverlay)){
           if( !reg.contains(this.currentOverlay)) $exceptionHandler("The current overlay value is not a registered overlay name");
           return reg.get(this.currentOverlay)
         }else{
           return reg.first();
         }
       }
     }
     // register this overlay
     overlay.name = getUniqueID( $attrs.withName, parentScope.overlay_register.ids, "overlay_");
     parentScope.overlay_register.add(overlay.name, overlay);
     // 
     // augment controller
     if(angular.isString(extCtrl) && extCtrl.length > 0) {
       locals = { $scope: $scope, 
                  $element: $element, 
                  $attrs: $attrs, 
                  _trans: trans,
                  _overlay: overlay,
                  _parent: parentScope };
       augmentController(extCtrl, this, locals);
     }
   }
   // 
   // make it easier to override these functions
   var __super = this._super || {};
   this._super = angular.extend({}, __super, {
   });
 }

OverlayDirectiveCtrl.$inject = ["$scope", "$attrs", "$element", 'augmentController', "$exceptionHandler"];
OverlayDirectiveCtrl = extendLayoutCtrl(LayoutContainerBase, LayoutDisplayBase, OverlayDirectiveCtrl);

/**
 * anOverlay Directive
 * 
 */
 
 var anOverlayDirective = [ "$compile", "$exceptionHandler", "$jQuery", function($compile, $exceptionHandler, $jQuery) {
    return {
      restrict:"EA",
      scope:true,
      require:["^?aLayout", "^?aBlock","^?aScreen", "anOverlay"],
      controller: OverlayDirectiveCtrl,
      //////////////////
      // COMPILE
      compile:function(element, attr){
        var template = element.html();
        // var template = element.html();
        element.html("");
        //////////////
        // LINK
        return function(scope, iElement, iAttrs, controllers){
         // properties
         var overlay, 
             overlayScope, 
             parentScope,
             childScope,
             parentUn$watchers = [];;
         // 
         // get parent layout scope
         for (var i=0; i < 3; i++) {
          if(controllers[i]){
            parentScope = (controllers[i]).layoutScope;
          }
         };
         if(!parentScope) $exceptionHandler("No parent scope found!");
         // wire up properties
         scope._parent = parentScope;
         overlay = controllers[3];
         overlayScope = scope._overlay = overlay.layoutScope;
          //
          // Watchers and Listeners
          // add/remove template 
          overlayScope.$watch( "displaying()", 
                       function(newval, oldval){
                          if(newval == oldval) return;
                          toggleContent(newval)
                        });  
          // listen for transitionedOut event to dispose the overlay contents
          scope.$on("transitionedOut", clearContent);
          scope.$on("$destroy", function(){
            clearContent(); 
            parentScope.overlay_register.clear();
            parentScope.currentOverlay = null;
            overlayScope.$destroy();
            overlay = overlayScope = parentScope = null;
          });
          // 
          // Init
          overlay.init(parentScope);
          watchParent();
          // 
          // 
          // private
          function watchParent () {
            unWatchParent();
           // watch the height of the element
           parentUn$watchers.push(parentScope.$watch( "height",
                         function(newval){ 
                           overlayScope.height = newval;
                         } ));
           // watch the width of the element
           parentUn$watchers.push(parentScope.$watch( "width",
                         function(newval){ 
                           overlayScope.width = newval;
                         }));
           parentUn$watchers.push(parentScope.$watch("transState",function(newval){
            switch(newval){
              case "transitionedIn":
                overlayScope.height = parentScope.height;
                overlayScope.width = parentScope.width;
                break;
              case "transitioningOut":
                unWatchParent();
                break;
            }
           }));
          }
          function unWatchParent () {
            angular.forEach(parentUn$watchers, function(un$watch){
              un$watch();
            });
            parentUn$watchers = [];
          }
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
  }];
  
  