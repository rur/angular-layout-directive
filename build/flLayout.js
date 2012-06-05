/**
 * @license Ruaidhrí Devery
 * (c) 2010-2012 Fluid Media. http://fluid.ie
 * License: MIT
 */
(function(window, angular) {
'use strict';

// indexOf IE Fix
if(!Array.indexOf){
    Array.prototype.indexOf = function(obj){
        for(var i=0; i<this.length; i++){
            if(this[i]==obj){
                return i;
            }
        }
        return -1;
    }
}

// utils
function Registry (name) {
  this.name = name;
  this.ids = []; 
  this.by_id = {};
}

Registry.prototype = {
  clear: function(){
    this.ids = [];
    this.by_id = {};
  },
  contains: function(name){
    return this.by_id.hasOwnProperty(name);
  },
  add: function(name, value){
    this.ids.push(name);
    this.by_id[name] = value;
  },
  get: function(name){
    return this.by_id[name];
  }, 
  first: function(){
    return this.by_id[this.ids[0]];
  }
}

function trim(stringToTrim) {
	return stringToTrim.replace(/^\s+|\s+$/g,"");
}

// utils
function isValidNumString (val) {
  return (angular.isString(val) || isValidNum(val));
}
function isValidNum (val) {
  return val != null && typeof val != "boolean" && !angular.isArray(val) && angular.isNumber(Number(val)) && !isNaN(val);
}

function declareLayoutModule(){
  angular.module('flLayout', [], ['$provide', 
    function flLayoutModule($provide) {
      $provide.directive({
        aLayout: aLayoutDirective,
        aBlock: aBlockDirective,
        aScreen: aScreenDirective,
        anOverlay: anOverlayDirective,
        anOverlayPanel: anOverlayPanelDirective,
        beSlidey: beSlideyDirective
      });
      $provide.provider({
        $jQuery: $JQueryProvider,
        windowResizeWatcher: WindowResizeWatcherProvider,
        augmentController: AugmentControllerProvider,
        transition: TransitionProvider
      });
    }]);
}

/**
 * This is a service which can be used to augment an angular controller
 * from within its constructor.
 */
function AugmentControllerProvider () {
  this.$get = [ '$injector', '$parse', '$window', function ($injector, $parse, $window) {
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
  }];
}

/**
 * The jQuery service exists to make it easier to test code that relies on jQuery
 * 
 * Rather than obtaining the instance of jQuery from the window directly it is simply
 * passed in as a dependency by the DI system
 * 
 * This is also useful for showing a meaningful failure when jquery is required by an applciation
 * but is not present
 */
function JQueryProvider () {
  this.$get = [ "$exceptionHandler", function($exceptionHandler){
    if(!window.jQuery) $exceptionHandler("jQuery is required by this application");
    return window.jQuery;
  }]
}

/**
 * Transition service provider
 * 
 */
function TransitionProvider () {
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
     * @return {Transition} Newly created transition object
     */
     // TODO: This could be used to provide centralised control of transitions, figure out how/if this would be useful.
     var transId = 0;
    function transitionService (scope, element) {
      var transition = new Transition( scope, element );
      transition.id = "transition_"+(++transId);
      for (var i=0; i < defaultSuites.length; i++) {
        var suite = defaultSuites[i];
        transition.addSuite(suite);
      };
      return transition;
    }
    return transitionService;
    
    /**
     * Transition 
     * This object binds scope properties to transitions which get applied to an element
     *
     * @constructor
     * @param {angular.module.ng.$rootScope.Scope} scope The scope to bind transiton properties to
     * @param {angular.element} element A jqLite/jQuery element to apply transions to
     */
    function Transition ( scope, element ) {
      var trans = this,
          suites = [],
          doFire = false,
          fireParams,
          un$watchers = [],
          un$watchersHash = {},
          disposed = false;
      
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
       * Hash map with the configured scope property to transition property bindings
       * 
       * You MUST use Transition#bind and Transition#unbind to edit this
       */ 
      this.bindings = {};
      
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
       * @param {object|Function} hash A key-value pair with corresponds to the scope properties and value you want applied. You can also pass a function, see #apply
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
        un$watchers = null;
        fireParams = null;
        scope = null;
        element = null;
        disposed = true;
      }
      
      /**
       * Bind a scope property to the a transition property, one way.
       * 
       * This uses scope#$watch to trigger a transition property function registered in 
       * one of the default or added suites.
       * 
       * @param {string|object<string,string>} 
       * @param {string} 
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
        if(!trans.bindings.hasOwnProperty(scopeProp)){
          un$watchers.push( scope.$watch(scopeProp,function (newval, oldval) {
            (getTransitionPropertyFunction(scopeProp))(newval, oldval);
            doFire = true;
          }));
          un$watchersHash[scopeProp] = un$watchers[un$watchers.length-1];
        }
        trans.bindings[scopeProp] = transProp;
      }
      
      /**
       * Remove a binding
       * 
       * This will remove any watchers that are applied to this expression.
       * 
       * @param {string|Array} property A single string or array of scope expression that were previously bound
       */
      this.unbind = function(property){
        if(angular.isArray(property)){
          angular.forEach(property, function(prop){
            trans.unbind(prop);
          })
          return;
        }
        var un$watcher = un$watchersHash[property];
        if(angular.isFunction(un$watcher)){
          un$watcher();
          un$watchersHash[property] = null;
          for (var i = un$watchers.length - 1; i >= 0; i--){
            if(un$watchers[i] === un$watcher) {
              un$watchers.splice(i,1);
              break;
            }
          };
        }
        trans.bindings[property] = null;
      }
      
      /**
       * Apply a set of properties and values to the scope. Any transition bindings will be triggered as a result.
       * 
       * The main difference between this and just applying values to the scope directly is that
       * you can pass a configuration hash which will be available to all transition fire methods that
       * get triggered in this scope.$digest cycle. This is what Transition#state uses to apply the state to the scope
       * 
       * @param {Object|Function} props A hash of properties and their values that will be applied to the scope using scope[key] = value, 
       *                          if a function is encountered it will be called. A function as a value will have its return value applied to the scope property
       * @param {Object} params A configuration hash which will be passed to all TransitionSuite#fire methods that get triggered
       */
      this.apply = function(props, params){
        var prop,
            value;
        if(angular.isFunction(props)){
          props.call(scope);
        } else {
          for(prop in props){
            value = props[prop];
            if(angular.isFunction(value)){
              scope[prop] = value.call(scope);
            } else {
              scope[prop] = value;
            }
          }
          fireParams = params || {};
        }
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
       *      this.register("css-opacity", function(newvalue,oldvalue){
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
       *    transition.bind("opacity", "css-opacity");
       *    ...
       *    $scope.opacity = .5; // will apply css 'opacity: .5' to element
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
        if(fireParams && angular.isFunction(fireParams["afterFire"])){
          (fireParams["afterFire"])();
        }
        fireParams = undefined;
      }
      
      function getTransitionPropertyFunction (scopeProperty) {
        var suite,
            transFn,
            property = trans.bindings[scopeProperty];
        if(!property) {
          $exceptionHandler( "Transition: No transition binding found for "+
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
      // TODO: Allow the transition suite definitions to be injectable
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
            // if the transition function returns a false boolean object the suite isn't put on cue
            if(fn(newval, oldval) !== false){
              self.onCue = true;
            }
          };
        }
      }
    }
  }]
}

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

/**
 * Base classes for Layout Directive Controllers
 */

 /**
  * Base class for a layout container.
  * 
  * It has methods to make managing and positioning child layout blocks easier and consistant
  * 
  * @constructor
  */
 function LayoutContainerBase ($scope, $exceptionHandler) {
   var self = this,
       layoutFn,
       triggered = false,
       layoutScope = this.layoutScope = $scope,
       children = [],
       childrenByName = {},
       ids = [];
   /** 
    * Add child block to this container
    * 
    * @param {angular.ng.$rootScope.Scope} child This is the layout scope of a child element
    * @param {string optional} name The name identifier
    * @return {string} The name/id of the child
    */
   this.addChild = function (child, name){
     // if a valid name is supplied it will throw an error for a duplicate, 
     // otherwise it silently creates a new unique id
     if((name = self.validateAndTrim(name))){
       if( childrenByName.hasOwnProperty(name)) {
         $exceptionHandler("Sorry but this Layout Container already has a child with the name '"+name+"'");
       }
     } else {
       name = self.getUniqueID("child_"+(ids.length+1), ids);
     }
     ids.push(name);
     child.$on("reflow", onChildReflow);
     children.push(child);
     childrenByName[name] = child;
     return name;
   }
 
   /** 
    * This like a jQuery sytle getter/setter only this is a triggerer/setter
    * 
    * If you provide a function parameter it will set the current layout funciton
    * 
    * Called without params it will cause the current layout function to be called
    * 
    * @param {option function} setlayout A function with the following signature funciton(children, scope){...}
    */
   this.layout = function(setlayout){
     if(angular.isFunction(setlayout)){
       layoutFn = setlayout;
     } else if(arguments.length == 0){
       if(!triggered){
         layoutScope.$evalAsync(function(){
                             layoutFn(children, layoutScope);
                             triggered = false;
                           });
         triggered = true;
       }
     }
   }
 
   /** 
    * This is a factory method for the default layout function.
    * 
    * You must implement this in your subclass
    */
    this.defaultLayout = function(){ 
      return angular.noop;
   }
   
   
   /** 
    * Set the scope to use as the layout scope.
    * 
    * This is useful if you want to have a separate scope object to control your layout
    * 
    * This is set to the injected local scope by default
    * 
    * @param {angular.ng.$rootScope.Scope} scope The scope you want to use for layout
    */
   this.setLayoutScope = function(scope){
     __super.setLayoutScope && __super.setLayoutScope(scope);
     self.layoutScope = layoutScope = scope;
   }
   
   /**
    * Trigger a reflow which causes the layout function to be called
    */
   
   this.reflow = function(){
     __super.reflow && __super.reflow();
     self.layout();
   }
   
   /**
    * Utility function for obtaining a unique id from a specified array of ids
    * 
    * @param {string} name The perferred name, it will be incremented if it is a dup
    * @param {array} collection The array of keys it needs to be unique within
    * @param {string optional} prepend The string to use to prepend a generated id
    * @return {string} an id which is unique within the collection received
    */
   this.getUniqueID = function(name, collection, prepend){
     var step = 1, 
         base = name;
     if(!angular.isString(name = self.validateAndTrim(name))){
       base = prepend;
       name = base+(step++);
     }
     while(collection.indexOf(name) > -1){
       name = base+(step++);
     }
     return name;
   }
   
   /**
    * Makes sure a value is valid as an key for a hash
    * 
    * It must be a string, and when trimmed, it must be longer than 0
    * 
    * @param {string} id The string to make sure if valid
    * @return {string|boolean} If it is valid it will return a trimmed valid id, if validation failes it will return false
    */
   this.validateAndTrim = function (id) {
     if( !angular.isString(id) ) return false;
     id = id.replace(/^\s+|\s+$/g,"");
     if( id.length == 0 ) return false;
     return id;
   }
   
 
   /** 
    * Init function called at some point after instanciation, before use
    */
   this.init = function(){ 
     layoutScope.children = children;
     layoutScope.childrenByName = childrenByName;
     layoutScope.reflow = function(){
         self.reflow();
     }
     self.layout(self.defaultLayout())
   }
   
   
   /**
    * hash which stores the methods of this base class, 
    * makes it a little handier to extend methods in a sub class
    */
    var __super = this._super || {};
    this._super = angular.extend({}, __super, {
      init: self.init, 
      addChild: self.addChild,
      layout: self.layout,
      reflow: self.reflow,
      defaultLayout: self.defaultLayout,
      setLayoutScope: self.setLayoutScope, 
      getUniqueID: self.getUniqueID,
      validateAndTrim: self.validateAndTrim
    });
   
   // private
   function onChildReflow () {
     self.layout();
   }
 }

 LayoutContainerBase.$inject = ["$scope", "$exceptionHandler"];

 /**
  * Base class for a Layout block which is within a LayoutContainer
  * 
  * It add methods for triggering reflow on its parent based upon changes in its layout scope.
  * 
  * @constructor
  */
 function LayoutBlockBase ($scope, $exceptionHandler) {
   var self = this,
       reflow$watchers = {},
       layoutScope = $scope;
   /**
    * Add an expression watcher to the current scope which will 'triggerReflow'
    * 
    * @param {string} expression A string expression to evaluate agaisnt the scope to trigger reflow on parent
    */
   this.addReflowWatcher = function(expression){
     if(!angular.isString(expression)) $exceptionHandler("You can only add a string expression as a reflow watcher");
     if(reflow$watchers.hasOwnProperty(expression)) return;
     reflow$watchers[expression] = layoutScope.$watch(expression, function(){ self.reflow() });
   }
 
   /**
    * remove an added watcher expression
    * 
    * @param {string} expression The expression you wish to remove
    */
   this.removeReflowWatcher = function(expression){
     var un$watcher = reflow$watchers[expression];
     try{
       un$watcher();
     } catch(er){}
     delete reflow$watchers[expression];
   }
 
   /**
    * this will emit a "reflow" event from the current scope
    * 
    * It will cause the parent layout element to carry out a reflow
    */
   this.reflow = function () {
     __super.reflow && __super.reflow();
     layoutScope.$emit("reflow");
   }
   
   /** 
    * Set the scope to use as the layout scope.
    * 
    * This is useful if you want to have a separate scope object to control your layout
    * than for your directive. Usually one that is isolated.
    * 
    * This is set to the injected local scope by default
    * 
    * @param {angular.ng.$rootScope.Scope} scope The scope you want to use for layout
    */
   this.setLayoutScope = function(scope){
      __super.setLayoutScope && __super.setLayoutScope(scope);
     self.layoutScope = layoutScope = scope;
   }
   
   /**
    * Init function called at some point after instanciation, before use
    */
   this.init = function(){ 
    layoutScope.reflow = function(){
      self.reflow();
     }
   }
   
   /**
    * hash which stores the methods of this base class, 
    * makes it a little handier to extend methods in a sub class
    */
     var __super = this._super || {};
     this._super = angular.extend({}, __super, {
      reflow: self.reflow, 
      setLayouScope: self.setLayoutScope, 
      transitionIn: self.transitionIn,
      transitionInComplete: self.transitionInComplete,
      transitionOut: self.transitionOut,
      transitionOutComplete: self.transitionOutComplete
    });
 }
 LayoutBlockBase.$inject = ["$scope", "$exceptionHandler"];
 
 /**
  * Base class for layout blocks that need to manage their own display
  * 
  * It creates an isolated scope for layout and has methods for managing transition states
  * 
  */
 function LayoutDisplayBase ( $scope, $element, transition ) {
   var self = this,
       layout = this.layoutScope = $scope.$new(true),
       trans = this.transition = transition(layout, $element);
   
   trans.state.config("init", {hidden: true});    
   trans.state.config("show", {hidden: false}, {onComplete:function(){
       self.transitionInComplete();
     }
   });
   trans.state.config("hide", {hidden: true}, {onComplete:function(){
       self.transitionOutComplete();
     }
   });   
   trans.bind({ hidden: "css-hidden"});
   
   /**
    * compute the height of this display
    */
   layout.calculateHeight = function () {
    return layout.hidden ? 0 : layout.height;
   } 
   /**
    * compute the width of this display
    */
   layout.calculateWidth = function () {
    return layout.hidden ? 0 : layout.width;
   }
   
   ////////////////
   // Ctrl API 
   // transition functions
   // nb: Notice that transition events are broadcast on the directive scope, not the isolated 
   //     layout scope. This makes them available to your app controllers
   layout.transState = "initializing";
   
   this.transitionIn = function(){
     layout.transState = "transitioningIn";
     trans.state("show");
   }
   
   this.transitionInComplete = function(){
     layout.transState = "transitionedIn";
   }
   
   this.transitionOut = function(){
     layout.transState = "transitioningOut";
     trans.state("hide");
   }
   
   this.transitionOutComplete = function(){
     layout.transState = "transitionedOut";
   }
   
   this.init = function(){
     trans.state("init");
   }
   
   // make it easier to override these functions
   var __super = this._super || {};
   this._super = angular.extend({}, __super, {
     transitionIn: self.transitionIn,
     transitionInComplete: self.transitionInComplete,
     transitionOut: self.transitionOut,
     transitionOutComplete: self.transitionOutComplete
   });
   if(angular.isFunction(self.setLayoutScope)){
     this.setLayoutScope(layout);
   }
 }
 LayoutDisplayBase.$inject = ["$scope", "$element", "transition"];

/**
 * Method used to extend layout directive controllers
 * 
 * It has a few non standard features from an normal extend method.
 * - It concats $inject 
 * - It carries forward the init function on all sub classes
 * 
 * This is a recursive and will handle more than two constructors as arguments
 * 
 * @param {function} base The base layout directive controller to be extended
 * @param {function} child The extending class.
 * 
 */
function extendLayoutCtrl (base, child){ 
   var args = Array.prototype.slice.call(arguments);
   // new joint constructor.   
   function C(){     
     var self = this,
         inits = [],
         args = Array.prototype.slice.call(arguments);
     base.apply(this, args.slice(0, base.$inject.length));
     inits.push(this.init||angular.noop);
     child.apply(this, args.slice(base.$inject.length));   
     inits.push(this.init||angular.noop);
     this.init = function(){
       angular.forEach(inits, function(initFn){
         initFn.call(self);
       });
     }
   }; 
   function Inherit(){};   
   Inherit.prototype = angular.extend({},base.prototype, child.prototype); 
   C.prototype = new Inherit(); // instantiate it without calling constructor 
   // ask for everything.   
   C.$inject = [].concat(base.$inject).concat(child.$inject);
   // makes this process recursive
   if(args.length > 2) C = extendLayoutController.apply(null, [C].concat(args.slice(2)))
   return C; 
}

/**
 * BlockDirectiveCtrl
 * extends LayoutContainerBase and LayoutBlockBase
 * 
 * 
 */
function BlockDirectiveCtrl ($scope, $element, $attrs, transition, augmentController) {
  var self = this,
      trans = this.transition = transition($scope, $element),
      extCtrl = $attrs["withController"],
      locals;
  
  this.addReflowWatcher("calculateHeight()");
  this.addReflowWatcher("calculateWidth()");
  
  trans.state.config("init", {height: 0});
  trans.bind("height", "css-height");
  trans.bind("y", "css-y");
  
  $element.css("width","100%");
  $element.css("overflow-x","hidden");
  $element.css("overflow-y","hidden");
  $element.css("position","absolute");
  
  ////////////////
  // Scope API
  // 
  /**
   * Calculate the height of this block, used by parent reflow function
   */
  $scope.calculateHeight = function(){
    return $scope.height;
  }
  /**
   * Calculate the width of this block, used by parent reflow function
   */
  $scope.calculateWidth = function(){
    return $scope.width;
  }
    
  /**
    * The default reflow layout function factory method
    */
  this.defaultLayout = function(){
   return function (children, scope) {
    var height = 0,
        width = 0;
     angular.forEach(children, function (child){
       height += child.calculateHeight();
       width = Math.max(child.calculateWidth(), width);
     });
     scope.height = height;
     scope.width = width;
   }
  }
  /** 
   * init function get called during linking phase
   */
  this.init = function(){
    // augment controller
    if(angular.isString(extCtrl) && extCtrl.length > 0) {
      locals = { $scope: $scope, 
                 $element: $element, 
                 $attrs: $attrs, 
                 $trans: trans };
      augmentController(extCtrl, this, locals);
    }
    trans.state("init");
  }
  
  // make it easier to override these functions
  var __super = this._super || {};
  this._super = angular.extend({}, __super, {
    defaultLayout: self.defaultLayout
  });
}
BlockDirectiveCtrl.$inject = ["$scope", "$element", "$attrs", "transition", "augmentController"];


/**
 * aBlock Directive
 * 
 * 
 */

var aBlockDirective =  function() {
   return {
     restrict:"EA",
     scope:{},
     require:["^aLayout","aBlock"],
     transclude:true,
     template:'<div class="a-block" ng-transclude></div>',
     replace:true,
     controller: extendController(LayoutContainerBase, LayoutBlockBase, BlockDirectiveCtrl),
     //////////////////
     // LINK
     link:function(scope, iElement, iAttrs, controllers){
       // properties
       var layout = controllers[0],
           block = controllers[1],
           name = scope.name = layout.addChild(scope, iAttrs.withName),
           layoutScope = layout.layoutScope;
       // Init
       block.init();
       // dispose
       scope.$on("$destroy", function(){
         block = layoutScope = layout = null;
       });
     }
   } 
 }

/**
 * LayoutDirectiveCtrl
 * 
 * extends LayoutContainerBase
 * 
 */
function LayoutDirectiveCtrl ($scope, $element, $attrs, transition, augmentController) {
  var self = this,
      trans = this.transition = transition($scope, $element),
      extCtrl = $attrs["withController"],
      locals;
  
  trans.state.config("init", {height: 0});
  trans.bind("height", "css-height");

  $element.css("width","100%");
  $element.css("position","relative");
  /**
   * The default reflow layout function factory
   */
  this.defaultLayout = function(){
    return function (children, scope) {
      var height = 0,
          width = 0;
      angular.forEach(children, function (child){
        child.y = height;
        height += child.calculateHeight();
        width = Math.max( width, child.calculateWidth());
      });
      scope.height = height;
      scope.width = width;
    }
  }
  /**
   * Initialize the contorller, called by the linking function
   */
  this.init = function(){  
    // augment controller
    if(angular.isString(extCtrl) && extCtrl.length > 0) {
      locals = { $scope: $scope, 
                 $element: $element, 
                 $attrs: $attrs, 
                 $trans: trans };
      augmentController(extCtrl, this, locals);
    }
  }
  // 
  var __super = this._super || {};
  this._super = angular.extend({}, __super, {
    defaultLayout: self.defaultLayout
  });
}
LayoutDirectiveCtrl.$inject = ["$scope", "$element", "$attrs", "transition", "augmentController"];

/**
 * aLayout Directive
 * 
 */
var aLayoutDirective = [ "windowResizeWatcher", function(windowResizeWatcher) {
    return {
      restrict:"EA",
      scope:{},
      transclude:true,
      template:'<div class="a-layout" ng-transclude></div>',
      replace:true,
      controller: extendLayoutCtrl(LayoutContainerBase, LayoutDirectiveCtrl),
      //////////////////
      // LINK
      link:function(scope, iElement, iAttrs, ctrl){
        scope.name = iAttrs.withName;
        // init
        // binds a listener to window resize event, which calls $rootScope#$apply() when it changes
        windowResizeWatcher();
        ctrl.init();
      }
    } 
  }]

/**
 * ScreenDirectiveCtrl
 * 
 * extends LayoutBlockBase & LayoutDisplayBase
 * 
 */
function ScreenDirectiveCtrl($scope, $element, $attrs, augmentController){
  var self = this,
      screen = this.layoutScope,
      trans = this.transition,
      locals,
      extCtrl = $attrs["withController"];
  // 
  this.addReflowWatcher("displaying()");
  this.addReflowWatcher("calculateHeight()");
  this.addReflowWatcher("calculateWidth()");
  // 
  $element.css("width","100%");
  $element.css("display","block");
  $element.css("position","absolute");
  ////////////////
  // setup the screen api
  //
  screen.calculateHeight = function(args){
    return screen.displaying() ? screen.height : 0;
  }
  // 
  screen.calculateWidth = function(args){
    return screen.displaying() ? screen.width : 0;
  }
  // 
  screen.show = function(name){
    var name = name || screen.name;
    $scope._block.currentScreen = name;
  }
  // 
  screen.hide = function(){
    if(screen.displaying()){
      $scope._block.currentScreen = null;
    }
  }
  // 
  screen.displaying = function(){
    return ($scope._block.currentScreen == screen.name);
  }
  // 
  // init function get called during linking phase
  this.init = function(){
    // augment controller
    if(angular.isString(extCtrl) && extCtrl.length > 0) {
      locals = { $scope: $scope, 
                 $element: $element, 
                 $attrs: $attrs, 
                 $trans: trans };
      augmentController(extCtrl, this, locals);
    }
  }
  // 
  // make it easier to override these functions
  var __super = this._super || {};
  this._super = angular.extend({}, __super, {
    // add any instance methods as properties of this hash
  });
}
ScreenDirectiveCtrl.$inject = ["$scope", "$element", "$attrs", "augmentController"]

/**
 * aScreen Directive
 * 
 */
 
 var aScreenDirective = [ "$compile", "$jQuery", function($compile, $jQuery) {
   return {
     restrict:"EA",
     scope:true,
     require:["^aLayout", "^aBlock", "aScreen"],
     controller: extendLayoutCtrl(LayoutBlockBase, LayoutDisplayBase, ScreenDirectiveCtrl),
     //////////////////
     // COMPILE
     compile:function(element, attr){
       var template = '<div class="a-screen-content" style="display: inline-block; width: 100%;">'+element.html()+"</div>";
       // var template = element.html();
       element.html("");
       //////////////
       // LINK
       return function(scope, iElement, iAttrs, controllers){
        // properties
        var screen  = controllers[2],
            block   = controllers[1],
            layout  = controllers[0],
            screenScope = scope._screen = screen.layoutScope,
            blockScope  = scope._block  = block.layoutScope,
            layoutScope = scope._layout  = layout.layoutScope,
            name = screenScope.name = block.addChild(screenScope, iAttrs.withName),
            childScope;
        //
        // Watchers and Listeners
        // add/remove template 
        screenScope.$watch("displaying()", function(newval, oldval){
                          if(newval == oldval) return;
                          toggleContent(newval)
                        });
        // watch the height of the element
        screenScope.$watch( function(){ return $jQuery(iElement).children(".a-screen-content").height(); },
                      function(newval){ 
                        screenScope.height = newval;
                      } );
        // watch the width of the element
        screenScope.$watch( function(){ return $jQuery(iElement).children(".a-screen-content").width(); },
                      function(newval){ 
                        screenScope.width = newval;
                      } );
        // listeners
        scope.$on("transitionedOut", function(){
          clearContent();
        });
        // 
        // Init
        // if this is first screen registered, show it
        screen.init();
        if(!blockScope.currentScreen) {
          screenScope.show();
          toggleContent(true);
        }
        // dispose
        scope.$on("$destroy", function(){
          screen = block = layout = null;
          screenScope = blockScope = layoutScope = null;
          scope._layout = scope._block = scope._screen = null;
        });
        // 
        // private
        function toggleContent (show) {
          if(show) {
            if(childScope){
              childScope.$destroy();
            }
            childScope = scope.$new();
            iElement.html(template);
            $compile(iElement.contents())(childScope);
            screen.transitionIn();
          } else {
            screen.transitionOut();
          }
        }
        function clearContent(){
          if (childScope) {
            childScope.$destroy();
            childScope = null;
          }
          iElement.html('');
        };
       }
     }
   } 
 }]

/**
 * AnOverlayDirectiveCtrl
 * 
 * extends LayoutContainerBase & LayoutDisplayBase
 * 
 */
 function OverlayDirectiveCtrl ($scope, $attrs, $element, augmentController, $exceptionHandler) {
   var self = this,
       overlay = this.layoutScope,
       trans = this.transition,
       extCtrl = $attrs.withController,
       locals;
   // standard css
   $element.css("width","100%");
   $element.css("height","100%");
   $element.css("overflow-x","hidden");
   $element.css("overflow-y","hidden");
   $element.css("position","absolute");
   $element.css("z-index","100");
   $element.css("top","0px");
   $element.css("left","0px");
   ////////////////
   // Scope API
   //
   overlay.show = function(name){
     var name = name || overlay.name;
     if($scope._parent.overlay_register.contains(name)){
       $scope._parent.currentOverlay = name;
     }
   }
   // 
   overlay.hide = function(){
     $scope._parent.currentOverlay = null;
   }
   // 
   overlay.displaying = function(name){
     var name = name || overlay.name;
     return ($scope._parent.currentOverlay == name);
   }
   // 
   // init function get called during linking phase
   this.init = function(){
     ////////////////
     // Setup parent scope for overlays
     //// This adds propeties and functions to the parent
     //// layout scope to manage overlays
     var parentScope = $scope._parent;
     if (!parentScope.overlay) {
       parentScope.overlay_register = layout_component_utils.new_registry("Overlay Register");
       parentScope.overlay = function(name){
         var reg = this.overlay_register;
         if(angular.isDefined(name)) {
           if( !reg.contains(name)) $exceptionHandler("Overlay with name'"+name+"' not found");
           return reg.get(name)
         }else if(angular.isString(this.currentOverlay)){
           if( !reg.contains(this.currentOverlay)) $exceptionHandler("The current overlay value is not a registered overlay name");
           return reg.get(this.currentOverlay)
         }else{
           return reg.first();
         }
       }
     }
     // register this overlay
     overlay.name = self.getUniqueID( $attrs.withName, parentScope.overlay_register.ids, "overlay_");
     parentScope.overlay_register.add(overlay.name, overlay);
     // 
     // augment controller
     if(angular.isString(extCtrl) && extCtrl.length > 0) {
       locals = { $scope: $scope, 
                  $element: $element, 
                  $attrs: $attrs, 
                  $trans: trans };
       augmentController(extCtrl, this, locals);
     }
   }
   // 
   // make it easier to override these functions
   var __super = this._super || {};
   this._super = angular.extend({}, __super, {
   });
 }

 OverlayDirectiveCtrl.$inject = ["$scope", "$attrs", "$element", 'augmentController', "$exceptionHandler"];


/**
 * anOverlay Directive
 * 
 */
 
 var anOverlayDirective = [ "$compile", "$exceptionHandler", "$jQuery", function($compile, $exceptionHandler, $jQuery) {
    return {
      restrict:"EA",
      scope:true,
      require:["^?aLayout", "^?aBlock","^?aScreen", "anOverlay"],
      controller: extendLayoutCtrl(LayoutContainerBase, LayoutDisplayBase, OverlayDirectiveCtrl),
      //////////////////
      // COMPILE
      compile:function(element, attr){
        var template = element.html();
        // var template = element.html();
        element.html("");
        //////////////
        // LINK
        return function(scope, iElement, iAttrs, controllers){
         // properties
         var overlay, 
             overlayScope, 
             parentScope,
             childScope,
             parentUn$watchers = [];;
         // 
         // get parent layout scope
         for (var i=0; i < 3; i++) {
          if(controllers[i]){
            parentScope = (controllers[i]).layoutScope;
          }
         };
         if(!parentScope) $exceptionHandler("No parent scope found!");
         // wire up properties
         scope._parent = parentScope;
         overlay = controllers[3];
         overlayScope = scope._overlay = overlay.layoutScope;
          //
          // Watchers and Listeners
          // add/remove template 
          overlayScope.$watch( "displaying()", 
                       function(newval, oldval){
                          if(newval == oldval) return;
                          toggleContent(newval)
                        });  
          // listen for transitionedOut event to dispose the overlay contents
          scope.$on("transitionedOut", clearContent);
          scope.$on("$destroy", function(){
            clearContent(); 
            parentScope.overlay_register.clear();
            parentScope.currentOverlay = null;
            overlayScope.$destroy();
            overlay = overlayScope = parentScope = null;
          });
          // 
          // Init
          overlay.init();
          watchParent();
          // 
          // 
          // private
          function watchParent () {
            unWatchParent();
           // watch the height of the element
           parentUn$watchers.push(parentScope.$watch( "height",
                         function(newval){ 
                           overlayScope.height = newval;
                         } ));
           // watch the width of the element
           parentUn$watchers.push(parentScope.$watch( "width",
                         function(newval){ 
                           overlayScope.width = newval;
                         }));
           parentUn$watchers.push(parentScope.$watch("transState",function(newval){
            switch(newval){
              case "transitionedIn":
                overlayScope.height = parentScope.height;
                overlayScope.width = parentScope.width;
                break;
              case "transitioningOut":
                unWatchParent();
                break;
            }
           }));
          }
          function unWatchParent () {
            angular.forEach(parentUn$watchers, function(un$watch){
              un$watch();
            });
            parentUn$watchers = [];
          }
          function toggleContent (show) {
            if(show) {
              if(childScope){
                childScope.$destroy();
              }
              childScope = scope.$new();
              iElement.html(template);
              $compile(iElement.contents())(childScope);
              overlay.transitionIn();
            } else {
              overlay.transitionOut();
            }
          }
          function clearContent(){
            if (childScope) {
              childScope.$destroy();
              childScope = null;
            }
            iElement.html('');
          };
        }
      }
    } 
  }];

/**
 * OverlayPanel Directive Controller
 * 
 * extends LayoutBlockBase & LayoutDisplayBase
 * 
 */
function OverlayPanelDirectiveCtrl ($scope, $element, $attrs) {
  var self = this,
      panel = $scope._panel = this.layoutScope,
      trans = this.transition;
  $element.css("position", "absolute");
  $element.css("display", "block");
  
  trans.bind({x: "css-x", y: "css-y"});
  // panel api
  /**
   * The side of the overlay frame that the panel aligns to
   */
  panel.align = $attrs.anOverlayPanel;
  
  /**
   * repositions the panel in relation to the parent overlay
   */
  panel.reposition = function(){
    var ovW = $scope._overlay && $scope._overlay.width || 0,
        ovH = $scope._overlay && $scope._overlay.height || 0,
        plW = panel.width || 0,
        plH = panel.height || 0;
    switch(panel.align){
      case "right":
      case "topright":
      case "bottomright":
        panel.x = ovW-plW;
        break;
      case "left":
      case "topleft":
      case "bottomleft":
        panel.x = 0;
        break;
      case "center":
      case "top":
      case "bottom":
      default:
        panel.x = (ovW-plW)*0.5;
    }    
    switch(panel.align){
      case "bottom":
      case "bottomleft":
      case "bottomright":
        panel.y = ovH-plH;
        break;
      case "top":
      case "topleft":
      case "topright":
        panel.y = 0;
        break;
      case "center":
      case "left":
      case "right":
      default:
        panel.y = (ovH-plH)*0.5;
    }
  }
  
  this.init = function(){
    
  }
}
OverlayPanelDirectiveCtrl.$inject = ["$scope", "$element", "$attrs"];


/**
 * anOverlayPanel Directive 
 * 
 */
 
var anOverlayPanelDirective = ["$jQuery", function($jQuery){
   return{
     restrict: "EA",
     transclude: true,
     template: "<div class='an-overlay-panel'><div class='an-overlay-panel-content' style='display: inline-block; width: 100%;' ng-transclude></div></div>",
     replace: true,
     controller: extendLayoutCtrl(LayoutBlockBase, LayoutDisplayBase, OverlayPanelDirectiveCtrl),
     //////////////
     // LINK
     link: function(scope, elm, attrs, ctrl) {
       var panel = scope._panel,
           overlayUn$watchers = [];
       // watchers
       panel.$watch("width+'~'+height+'~'+align", function(){
         if(panel.transState == "transitionedIn") panel.reposition();
       });
       scope.$watch(function(){ return $jQuery(elm).children(".an-overlay-panel-content").height(); },
         function(newval){
           panel.height = newval;
         }
       );
       scope.$watch(function(){ return $jQuery(elm).children(".an-overlay-panel-content").width(); },
         function(newval){
           panel.width = newval;
         }
       );
       // 
       scope.$on("$destroy", function(){
         panel.$destroy()
         panel = null;
         ctrl.layoutScope.$destroy();
       })
       // init
       ctrl.init();
       // show it
       ctrl.transitionIn();
       watchParent();
       // private
       function watchParent () {
         unWatchParent();
         overlayUn$watchers.push(scope._overlay.$watch("width+'~'+height", function(){
           if(scope._overlay.transState == "transitionedIn") panel.reposition();
         }));
         overlayUn$watchers.push(scope._overlay.$watch("transState",function(newval){
           switch(newval){
             case "transitionedIn":
               panel.width = $jQuery(elm).children(".an-overlay-panel-content").width();
               panel.height = $jQuery(elm).children(".an-overlay-panel-content").height();
               panel.reposition();
               elm.css("top", panel.y);
               elm.css("left", panel.x);
               break;
             case "transitioningOut":
               unWatchParent();
               break;
           }
         }));
       }
       function unWatchParent () {
         angular.forEach(overlayUn$watchers, function(un$watch, key){
           un$watch();
         });
         overlayUn$watchers = [];
       }
     }
   }
  }]

/**
 * Add slidey animation behavior to the transtions of
 * layout element
 */
var beSlideyDirective = function(){
  return {
    require: ["?aLayout", "?aBlock", "?aScreen", "?anOverlay", "?anOverlayPanel"],
    //////////////
    // LINK
    link:function (scope, element, attrs, controllers) {
      // properties
      var props = (attrs["beSlidey"]).split(","),
          controllers = controllers || [],
          bindings = {
            x: "slidey-x",
            y: "slidey-y",
            width: "slidey-width",
            height: "slidey-height",
            opacity: "slidey-opacity",
            // TODO: implement these
            // "hidden[height]": "slidey-hide-height",
            // "hidden[fade]": "slidey-hide-fade"
          };
      angular.forEach(controllers,function(controller){
        if(!angular.isDefined(controller)) return;
        controller.transition.addSuite(BeSlideyTransitionSuite); // see layout.js
        angular.forEach(props, function(val){
          if(bindings.hasOwnProperty(val)){
            var scopeProp = val.replace(/\[.*\]/, "");
            controller.transition.bind(scopeProp, bindings[val]);
          }
        });
      });
    } 
  }
}

/**
 * Be Slidey Transition Suite
 * 
 * 
 */ 
 function BeSlideyTransitionSuite () {
   var self = this;
   this.props = {};
    this.register("slidey-x", function (newval, oldval) {
      if( !isValidNumString(newval) ) return false;
      newval = isValidNum(newval) ? newval.toString() + "px" : newval;
      self.props["left"] = newval;
    });

    this.register("slidey-y", function (newval, oldval) {
      if( !isValidNumString(newval) ) return false;
      newval = isValidNum(newval) ? newval.toString() + "px" : newval;
      self.props["top"] = newval;
    });

    this.register("slidey-width", function (newval, oldval) {
      if( !isValidNumString(newval) ) return false;
      newval = isValidNum(newval) ? newval.toString() + "px" : newval;
      self.props["width"] = newval;
    });

    this.register("slidey-height", function (newval, oldval) {
      if( !isValidNumString(newval) ) return false;
      newval = isValidNum(newval) ? newval.toString() + "px" : newval;
      self.props["height"] = newval;
    });

    this.register("slidey-opacity", function (newval, oldval) {
      if( !isValidNum(newval) ) return false;
      self.props["opacity"] = newval;
    });

    this.fire = function(element, config){
      var dur = config && config["duration"] || 300,
          onComplete = config && config["onComplete"] || angular.noop;
      $(element).animate(self.props, {duration: dur, queue: false}, onComplete);
      self.props = {};
    }
 }

/**
 * DefautTransitionSuite 
 * This is the default transition suite definition which applies basic positioning and resizing 
 * to an element based upon the following mapping to css properties:
 * 
 * "css-x"{Number|String} -> "left"
 * "css-y"{Number|String} -> "top"
 * "css-width"{Number|String} -> "width"
 * "css-height"{Number|String} -> "height"
 * "css-opacity"{decimal Number} -> "opacity", "-moz-opacity", "filter:alpha(opacity={value*100}))"
 * "css-hidden"{Boolean} -> "display"
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
  
  this.register("css-x", function (newval, oldval) {
    if( !isValidNumString(newval) ) return false;
    newval = isValidNum(newval) ? newval.toString() + "px" : newval;
    props["left"] = newval;
  })
  
  this.register("css-y", function (newval, oldval) {
    if( !isValidNumString(newval) ) return false;
    newval = isValidNum(newval) ? newval.toString() + "px" : newval;
    props["top"] = newval;
  })
  
  this.register("css-width", function (newval, oldval) {
    if( !isValidNumString(newval) ) return false;
    newval = isValidNum(newval) ? newval.toString() + "px" : newval;
    props["width"] = newval;
  })
        
  this.register("css-height", function (newval, oldval) {
    if( !isValidNumString(newval) ) return false;
    newval = isValidNum(newval) ? newval.toString() + "px" : newval;
    props["height"] = newval;
  })
  
  this.register("css-hidden", function (newval, oldval) {
    display = newval ? "hide" : "show";
  })
  
  this.register("css-opacity", function (newval, oldval) {
    var ieVal;
    if(!isValidNum(newval)) return false;
    props["opacity"] = newval;
    props["-moz-opacity"] = newval;
    ieVal = Math.round(newval*100);
    props["filter"] = "alpha(opacity="+ieVal+")";
  });
  
  this.fire = function(element, config){
    var onComplete = config && config["onComplete"] || angular.noop;
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
    onComplete();
  }
}




declareLayoutModule();

})(window, window.angular);

angular.element(document).find('head').append('<style type="text/css"></style>');