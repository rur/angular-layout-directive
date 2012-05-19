'use strict';

/* Controllers */


function AppCtrl ($scope) {
  $scope.test = "value123";
}

function SubCtrl ($scope) {
  $scope.positions = function(){
    return {
      x: $scope.xPosition,
      y: $scope.yPosition,
      height: $scope.height,
      width: $scope.width,
      opacity: $scope.opacity
    }
  }
  $scope.update = function(){
    if(isNaN($scope.xPosition)) return;
    $scope.setPosition({x: (Number($scope.xPosition)+ (100*Math.random()))});
    $scope.setPosition({x: (Number($scope.xPosition)+ (100*Math.random()))});
  }
}
