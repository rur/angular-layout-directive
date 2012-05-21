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
    
    /**
     * TransitionProvider#addSuiteClass
     * This adds a transition suite class as one of the defaults passed to all newly created Transition instances.
     * The transition properties registed in this class will therefore be available to all transition
     * bindings in the application.
     * 
     * Transition property bindings are resolved in a last-added first-preference order so this may override exisitng 
     * transition properties or in turn be overridden by suites added subsequently
     * 
     * See Transition#addSuite for more details on how to create a TransitionSuite.
     * 
     * @param {function} constructor Transition Suite constructor which registers properties and defines a 'fire' method which
     *    applies the transition changes to the element. 
     */
    this.addSuiteClass = function (constructor) {
      defaultSuites.push(constructor);
    }
    
    /**
     * DefautTransitionSuite 
     * This is the default transition suite definition which applies basic positioning and resizing 
     * to an element based upon the following mapping to css properties:
     * 
     * "x"{Number|String} -> "left"
     * "y"{Number|String} -> "top"
     * "width"{Number|String} -> "width"
     * "height"{Number|String} -> "height"
     * "opacity"{decimal Number} -> "opacity", "-moz-opacity", "filter:alpha(opacity={value*100}))"
     * "hidden"{Boolean} -> "display"
     * 
     * x, y, width and height will apply string values directly to css. 
     * If a number is recieved it casts a String with 'px' appended.
     * 
     * 'hidden' works in a similar way to jQuery show/hide
     * 
     * @constructor
     */
    function DefaultTransitionSuite () {
      var props = {},
          display,
          defaultDisplay;
      
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
      
      this.register("hidden", function (newval, oldval) {
        display = newval ? "hide" : "show";
      })
      
      this.register("opacity", function (newval, oldval) {
        var ieVal;
        if(isNaN(newval)) return;
        props["opacity"] = newval;
        props["-moz-opacity"] = newval;
        ieVal = Math.round(newval*100);
        props["filter"] = "alpha(opacity="+ieVal+")";
      });
      
      this.fire = function(element, config){
        if(!defaultDisplay && element.css("display") != "none") defaultDisplay = element.css("display");
        switch(display){
          case "show":
            props["display"] = defaultDisplay ? defaultDisplay : "block";
            break;
          case "hide":
            props["display"] = "none";
            break;
        }
        element.css(props);
        display = null;
        props = {};
      }
    }
    
    this.addSuiteClass(DefaultTransitionSuite);
    
    this.$get = [ "$exceptionHandler", function transitionFactory ($exceptionHandler) {
      /**
       * TransitionService 
       * Creates a new Transition instance which allows the provided scopes properties to be 
       * bound to properties which are defined in transition suites.
       * 
       * The returned object can be used to configure and trigger complex transitions while 
       * delegating the implementation on the element to Transition Suites. See Transition#addSuite
       *
       * @param {angular.module.ng.$rootScope.Scope} scope The scope to bind transiton properties to
       * @param {angular.element} element A jqLite/jQuery element to apply transions to
       * @returns {Transition} Newly created transition object
       */
       // TODO: This could be used to provide centralised control of transitions, figure out how/if this would be useful.
      function transitionService (scope, element) {
        var transition = new Transition( scope, element );
        for (var i=0; i < defaultSuites.length; i++) {
          var suite = defaultSuites[i];
          transition.addSuite(suite);
        };
        return transition;
      }
      return transitionService;
      
      /**
       * Transition 
       * This object binds scope object properties to transitions which get applied to an element
       *
       * @constructor
       * @param {angular.module.ng.$rootScope.Scope} scope The scope to bind transiton properties to
       * @param {angular.element} element A jqLite/jQuery element to apply transions to
       */
      function Transition ( scope, element ) {
        var trans = this,
            bindings = {noop: "noop"},
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
        /**
         * Hash map with the configued transition states.
         * 
         * Use Transition#state.config function to add and configure states.
         */
        this.states = {};
        
        /**
         * Trigger a configured transition state to be applied.
         * 
         * @param {string} id The id of the state you want to trigger
         */
        this.state = function(id) {
          var state = trans.states[id];
          trans.apply(state["props"], state["params"]);
        }
        
        /**
         * Configure a transition state
         * 
         * example psudo: 
         *    tarnsition.state.configure("init", {x: 100, y: 200, width: "100%", height: "200px"}, {onComplete:func..});
         * 
         * @param {string} id The id of the new/existing state you want to configure
         * @param {object} hash A key-value pair with corresponds to the scope properties and value you want applied 
         * @param {object} params A config hash which gets passed to the transition fire function
         */
        this.state.config = function (id, hash, params){
          trans.states[id] = {props:hash, params:(params||{})};
        }
        
        
        /**
         * Prepare this transition object for garbage collection.
         * The instance is not recoverable once this has been called.
         * 
         * This gets called automatically when the bound scope broadcasts the $destroy event
         */
        this.dispose = function (){
          angular.forEach(un$watchers, function(un$watch){
            un$watch();
          });
          fireParams = null;
          scope = null;
          element = null;
        }
        
        /**
         * Bind a scope property to the a transition property, one way.
         * 
         * This uses scope#$watch to trigger a transition property function registered in 
         * one of the default or added suites.
         * 
         * @param {string|object<string,string>} 
         */
        this.bind = function  (property, transProp) {
          var scopeProp,
              transProp,
              bindingsHash,
              prop;
          // handle a hash, call bind using the key-value pairs
          if(angular.isObject(property)){ 
            bindingsHash = property;
            for(prop in bindingsHash){
              trans.bind(prop, bindingsHash[prop]);
            }
            return;
          }
          // validate, create a scope watcher if required, then register binding
          scopeProp = validateAndTrimProperty(property, "scope");
          transProp = validateAndTrimProperty(transProp, "transition");
          if(!bindings.hasOwnProperty(scopeProp)){
            un$watchers.push( scope.$watch(scopeProp,function (newval, oldval) {
              (getTransitionPropertyFunction(scopeProp))(newval, oldval);
              doFire = true;
            }));
          }
          bindings[scopeProp] = transProp;
        }
        
        /**
         * Apply a set of properties and values to the scope. Any transition bindings will be triggered as a result.
         * 
         * The main difference between this and just applying values to the scope directly is that
         * you can pass a configuration hash which will be available to all transition fire methods that
         * get triggered in this scope.$digest cycle. This is what Transition#state uses to apply the state to the scope
         * 
         * @param {Object} props A hash of properties and their values that will be applied to the scope using scope[key] = value
         * @param {Object} params A configuration hash which will be passed to all TransitionSuite#fire methods that get triggered
         */
        this.apply = function(props, params){
          var prop;
          for(prop in props){
            scope[prop] = props[prop];
          }
          fireParams = params || {};
        }
        
        /**
         * Invokes a transition suite constructor extending the TransitionSuiteBase class
         * 
         * The application of transtions onto the actual element are delegated to Transtion Suites.
         * The constructor allows you to add transtion properties each matched to a listener function. 
         * These listener functions prep the suite before the transition is fired at the end of the digest cycle.
         * 
         * To create your own TransitionSuite you must register transitions in your constructor and implement a 'this.fire' method.
         * 
         * Example:
         *    function OpacityTransitionSuite () {
         *      var value;
         *      this.register("opacity", function(newvalue,oldvalue){
         *        // some validation here
         *        value = newval;
         *      });
         *      
         *      this.fire = function(element, config){
         *        element.css("opacity", value);
         *        value = null;
         *      }
         *    }
         *    ...
         *    transition.addSuite(OpacityTransitionSuite);
         *    transition.bind("myOpacity", "opacity");
         *    ...
         *    $scope.myOpacity = .5; // will apply css 'opacity: .5' to element
         * 
         * Only transtion suite instances that have received changes will have their 'fire' method called.
         * 
         * You can add any of your transition suites as application defaults, applied to all transition instances
         * using the TransitionProvider#addSuiteClass method
         * 
         * @param {function} constructor A transition suite constructor implementing a fire method and registering transition listeners
         */
        this.addSuite = function(constructor){
          var suite = new (extendClass(TransitionSuiteBase, constructor))();
          if(!angular.isFunction(suite.fire)){ 
            $exceptionHandler("Transition suite ["+constructor.name+"] Class must have a 'fire' instance method.");
          }
          suites.unshift(suite);
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
            $exceptionHandler( "Transition Service "+
                               "No transition binding found for "+
                               scopeProperty+" but one was expected");
          }
          for (var i=0; i < suites.length; i++) {
            suite = suites[i]
            transFn = suite.transitionProps[property];
            if(angular.isFunction(transFn)) {
              return transFn;
            }
          }
          return angular.noop;
        }
        
        // used when extending TransitionSuiteBase
        function extendClass(base, child){
          // notice this method doesn't bother with constructor arguments
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
          this.transitionProps = {};
          this.onCue = false;
        }
        TransitionSuiteBase.prototype = {
          register:function(prop, fn){
            var self = this,
                reserved = ["noop"];
            angular.forEach(reserved, function(reservedProp){
              if(prop == reservedProp) $exceptionHandler("Cannot register transition property '"+prop+"' it is reserved.");
            });
            this.transitionProps[prop] = function (newval, oldval) {
              fn(newval, oldval);
              self.onCue = true;
            };
          }
        }
      }
    }]
  });
