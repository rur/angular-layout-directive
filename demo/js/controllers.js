'use strict';

/* Controllers */


function AppCtrl ($scope) {
  $scope.test = "value123";
}

function SubCtrl ($scope) {
  $scope.$on("show", function(event, screenname){
    $scope._screen.show(screenname);
  })
}
