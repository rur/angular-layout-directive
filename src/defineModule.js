'use strict';

function declareLayoutModule(){
  angular.module('flLayout', [], ['$provide', '$compileProvider',
    function flLayoutModule($provide, $compileProvider) {
      $compileProvider.directive({
              aLayout: aLayoutDirective,
              aBlock: aBlockDirective,
            //   aScreen: aScreenDirective,
            //   anOverlay: anOverlayDirective,
            //   anOverlayPanel: anOverlayPanelDirective,
            //   beSlidey: beSlideyDirective
            });
      $provide.provider({
        $jQuery: JQueryProvider,
        windowResizeWatcher: WindowResizeWatcherProvider,
        augmentController: AugmentControllerProvider
      });
      $provide.provider("transition", TransitionProvider)
          .addSuiteClass(DefaultTransitionSuite);
    }]);
}


