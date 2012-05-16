'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/view1', {template: 'partials/partial1.html', controller: MyCtrl1});
    $routeProvider.when('/view2', {template: 'partials/partial2.html', controller: MyCtrl2});
    $routeProvider.otherwise({redirectTo: '/view1'});
  }]);


///// Angular Utils //// 
var my_angular_utils = {
  /*/
    Extend an Angular controller
    The Base class MUST have $inject declared or it will screw up
  //*/
  extendController:function(base, child){ 
    // new joint constructor.   
    function C(){     
      base.apply(this, arguments.splice(0, Base.$inject.length));     
      child.apply(this, arguments.splice(Base.$inject.length));   
    }; 
    function Inherit(){};   
    Inherit.prototype = base.prototype; 
    C.prototype = new Inherit(); // instantiate it without calling constructor 
    // ask for everything.   
    C.$inject = [].concat(base.$inject).concat(child.$inject);   
    return C; 
  }
}