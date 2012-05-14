'use strict';

/* Services */

angular.module('myApp.services', []).
	factory('augmentController', [ '$injector', '$parse', '$window', function ($injector, $parse, $window) {
		return function augmentController (Class, controller, locals) {
			var scope = locals ? locals.$scope : {};

			if (angular.isString(Class)) {
			  var getter = $parse(Class);
			  Class = getter(scope) || getter($window);
			}

			var classPrototype = Class.prototype;
		    for(var key in classPrototype) {
		        controller[key] = angular.bind(controller, classPrototype[key]);
		    }

		    return $injector.invoke(Class, controller, locals);
		}
	}])
