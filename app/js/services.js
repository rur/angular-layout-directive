'use strict';

/* Services */

angular.module('myApp.services', [])
  /**
   * Augment Controller service
   */
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
  /**
   * Transition service
   */
  .provider("transition", function TransitionProvider () {
    var defaultSuites = [];
    this.addSuiteClass = function (suiteClass) {
      defaultSuites.push(suiteClass);
    }
    
    function DefaultTransitionSuite () {
      var props = {};
      this.register("x", function (newval, oldval) {
        newval = !isNaN(newval) ? newval.toString() + "px" : newval;
        props["left"] = newval;
      })
      
      this.register("y", function (newval, oldval) {
        newval = !isNaN(newval) ? newval.toString() + "px" : newval;
        props["top"] = newval;
      })
      
      this.register("width", function (newval, oldval) {
        newval = !isNaN(newval) ? newval.toString() + "px" : newval;
        props["width"] = newval;
      })
            
      this.register("height", function (newval, oldval) {
        newval = !isNaN(newval) ? newval.toString() + "px" : newval;
        props["height"] = newval;
      })
      
      this.fire = function(element, config){
        element.css(props);
        props = {};
      }
    }
    
    this.addSuiteClass(DefaultTransitionSuite);
    
    this.$get = [ "$exceptionHandler", function transitionFactory ($exceptionHandler) {
      /*
          TransitionService class
      */
      function TransitionService (scope, element) {
        var transition = new Transition( scope, element );
        for (var i=0; i < defaultSuites.length; i++) {
          var suite = defaultSuites[i];
          transition.addSuite(suite);
        };
        return transition;
      }
      return TransitionService;
      
      /*
          Transition class
      */
      function Transition ( scope, element ) {
        var trans = this,
            bindings = {},
            suites = [],
            doFire = false,
            fireParams,
            un$watchers = [];
        
        //////////////////////////
        // Initialisation
        //////////////////////////
        un$watchers.push(scope.$watch(function () {
          if(doFire){
            fire();
            doFire = false;
          }
        }));
        
        scope.$on("$destroy",function(){
          trans.dispose();
        });
        
        //////////////////////////
        // Public Properties
        //////////////////////////
        this.states = {};
        
        this.state = function(id) {
          var state = trans.states[id];
          trans.apply(state["props"], state["params"]);
        }
        
        this.state.config = function (id, hash, params){
          trans.states[id] = {props:hash, params:(params||{})};
        }
        
        this.dispose = function (){
          angular.forEach(un$watchers, function(un$watch){
            un$watch();
          });
          fireParams = null;
          scope = null;
          element = null;
        }
        
        this.bind = function  (scopeProp, transProp) {
          if(angular.isObject(arguments[0])){ 
            var bindingsHash = arguments[0];
            for(var prop in bindingsHash){
              trans.bind(prop, bindingsHash[prop]);
            }
            return;
          }
          
          scopeProp = validateAndTrimProperty(scopeProp, "scope");
          transProp = validateAndTrimProperty(transProp, "transition");
          if(!bindings.hasOwnProperty(scopeProp)){
            un$watchers.push( scope.$watch(scopeProp,function (newval, oldval) {
              (getTransitionPropertyFunction(scopeProp))(newval, oldval);
              doFire = true;
            }));
          }
          bindings[scopeProp] = transProp;
        }
        
        this.apply = function(props, params){
          var prop;
          for(prop in props){
            scope[prop] = props[prop];
          }
          fireParams = params || {};
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
              suite.fire( element, fireParams );
              suite.onCue = false;
            }
          };
          fireParams = undefined;
        }
        
        function getTransitionPropertyFunction (scopeProperty) {
          var suite,
              transFn,
              property = bindings[scopeProperty];
          if(!property) {
            $exceptionHandler( "Transition Service::Internal Error: "+
                               "No transition binding found for "+
                               scopeProperty+" but one was expected");
          }
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
        
        function trim(stringToTrim) {
        	return stringToTrim.replace(/^\s+|\s+$/g,"");
        }
        
        function validateAndTrimProperty (property, type) {
          if(!(angular.isString(property) && (property = trim(property)).length > 0 )){ 
            $exceptionHandler("Cannot bind "+type+" property '"+property+"'");
          }
          return property;
        }
        //////////////////////////
        // Private Classes
        //////////////////////////
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
