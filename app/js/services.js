'use strict';

/* Services */

angular.module('myApp.services', [])
  .factory('augmentController', [ '$injector', '$parse', '$window', function ($injector, $parse, $window) {
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
  .provider("transition", function TransitionProvider () {
    this.$get = [ "$exceptionHandler", function transitionFactory ($exceptionHandler) {
      /*
          TransitionService class
      */
      function TransitionService (scope, element) {
        return new Transition( scope );
      }      
      return TransitionService;
      /*
          Transition class
      */
      function Transition ( scope ) {
        var trans = this,
            suites = [],
            doFire = false;
        
        //////////////////////////
        // Initialisation
        //////////////////////////
        
        scope.$watch(function () {
          if(doFire){
            scope.$evalAsync(fire);
            doFire = false;
          }
        });
        
        scope.$on("$destroy",function(){
          // tear-down
        });
        
        //////////////////////////
        // Public Properties
        //////////////////////////
        this.states = {};
        
        this.state = State;
        
        this.bind = function  (scopeProp, transProp) {
          scope.$watch(scopeProp,function (newval, oldval) {
            (getTransitionPropertyFunction(transProp)).call(undefined, newval, oldval);
            doFire = true;
          })
        }
        
        this.apply = function(props){
          var prop;
          for(prop in props){
            scope[prop] = props[prop];
          }
        }
        
        this.addSuite = function(Klass){
          var suite = new (extendClass(TransitionSuiteBase, Klass))();
          if(!angular.isFunction(suite.fire)){ 
            $exceptionHandler("Transition suite ["+Klass.name+"] class must have a 'fire' instance method.");
          }
          suites.push(suite);
        }
        
        
        //////////////////////////
        // Private methods
        //////////////////////////
        function fire () {
          var suite;
          for (var i=0; i < suites.length; i++) {
            suite = suites[i]
            if(suite.onCue){
              suite.fire();
              suite.onCue = false;
            }
          };
        }
        
        function getTransitionPropertyFunction (property) {
          var suite,
              transFn;
          for (var i=0; i < suites.length; i++) {
            suite = suites[i]
            transFn = suite.props[property];
            if(angular.isFunction(transFn)) {
              return transFn;
            }
          }
          return angular.noop;
        }
        
        // used when extending TransitionSuiteBase
        function extendClass(base, child){
          function Extended(){
            base.apply(this);
            child.apply(this);
          }
          function Inherit(){};
          Inherit.prototype = angular.extend({}, base.prototype, child.prototype);
          Extended.prototype = new Inherit();
          return Extended;
        }
        
        //////////////////////////
        // Private Classes
        //////////////////////////
        /*
          State
        */
        function State (id) {
          trans.apply(trans.states[id]);
        }
        State.config = function (id, hash){
          trans.states[id] = hash;
        }
        
        /*
          TransitionSuiteBase
        */
        function TransitionSuiteBase () {
          this.props = {};
          this.onCue = false;
        }
        TransitionSuiteBase.prototype = {
          register:function(prop, fn){
            var self = this;
            this.props[prop] = function (newval, oldval) {
              fn(newval, oldval);
              self.onCue = true;
            };
          }
        }
      }
    }]
  });
