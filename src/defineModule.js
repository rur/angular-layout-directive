'use strict';

function declareLayoutModule(){
  angular.module('flLayout', [], ['$provide', 
    function flLayoutModule($provide) {
      // $provide.directive({
      //   aLayout: aLayoutDirective,
      //   aBlock: aBlockDirective,
      //   aScreen: aScreenDirective,
      //   anOverlay: anOverlayDirective,
      //   anOverlayPanel: anOverlayPanelDirective,
      //   beSlidey: beSlideyDirective
      // });
      $provide.provider({
        $jQuery: JQueryProvider,
        windowResizeWatcher: WindowResizeWatcherProvider,
        augmentController: AugmentControllerProvider,
        transition: TransitionProvider
      });
    }]);
}

