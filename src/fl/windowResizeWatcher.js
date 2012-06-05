'use strict';

/**
 * Window resize watcher service binds a listener to the window resize event.
 * When it fires it calls $apply on the root scope. 
 * 
 * This is usefull where scope values depend on the size of the window
 */
function WindowResizeWatcherProvider () {
  this.$get = [ "$window", "$rootScope", "$timeout", function($window, $rootScope, $timeout){
     var resizeCount = 0,
         _resp;
     function onResize () {
        $timeout((function(count){
          return function(){
            if(count < resizeCount) return;
            $rootScope.$apply(resizeCount);
          }
        })(++resizeCount), _resp, false);
     };
     return function( responsiveness ){
       responsiveness = responsiveness || 50;
       if(_resp == responsiveness) return;
       angular.element($window).unbind("resize", onResize );
       angular.element($window).bind("resize", onResize );
     };
   }];
}

