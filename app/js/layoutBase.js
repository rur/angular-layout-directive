(function(window){
  /**
   * Base class for a layout container.
   * 
   * It has methods to make managing and positioning child layout blocks easier and consistant
   */
  function LayoutContainerBase ($scope, $exceptionHandler) {
    var self = this,
        layoutFn,
        triggered = false,
        layoutScope = $scope;
    /** 
     * Add child block to this container
     * 
     * @param {angular.ng.$rootScope.Scope} child This is the layout scope of a child element
     * @param {string optional} name The name identifyer
     * @re
     */
    this.addChild = function (child, name){
      name = validateAndTrim(name) || layoutScope.children.length.toString(); // keys can only be a string
      if(layoutScope.childrenByName.hasOwnProperty(name)) $exceptionHandler("Sorry but this Layout Container already has a child with the name '"+name+"'");
      layoutScope.children.push(child);
      layoutScope.childrenByName[name] = child;
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
                              layoutFn(layoutScope.children, layoutScope);
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
       $exceptionHandler("You must implement a defaultLayout factory method which returns a layout function") 
    }
    
    
    /** 
     * Set the scope to use as the layout scope.
     * 
     * This is useful if you want to have a separate scope object to control your layout
     * 
     * This is set to the injected local scope by default
     */
    this.setLayoutScope = function(scope){
      layoutScope = scope;
    }
    
    /**
     * hash which stores the methods of this base class, 
     * makes it a little handier to extend methods in a sub class
     */
     this._super = angular.extend(this._super||{}, {
       addChild: self.addChild,
       layout: self.layout
     });
  
    /** 
     * Init function called at some point after instanciation, before use
     */
    this.init = function(){ 
      layoutScope.children = [];
      layoutScope.childrenByName = {};
      // defaultLayout() to be implmented by sub-class
      self.layout(self.defaultLayout());
    }
  }

  LayoutContainerBase.$inject = ["$scope", "$exceptionHandler"];

  /**
   * Base class for a Layout block which is within a LayoutContainer
   * 
   * It add methods for trigger reflow on its parent based upon changes it layout scope.
   */
  function LayoutBlockBase ($scope, $exceptionHandler) {
    var self = this,
        reflow$watchers = {},
        layoutScope = $scope;
    /**
     * Add an expression watcher to the current scope which will 'triggerReflow'
     */
    this.addReflowWatcher = function(expression){
      if(!angular.isString(expression)) $exceptionHandler("You can only add a string expression as a reflow watcher");
      if(reflow$watchers.hasOwnProperty(expression)) return;
      reflow$watchers[expression] = layoutScope.$watch(expression, self.triggerReflow);
    }
  
    /**
     * remove an added watcher expression
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
     */
    this.triggerReflow = function () {
      layoutScope.$emit("reflow");
    }
    
    /** 
     * Set the scope to use as the layout scope.
     * 
     * This is useful if you want to have a separate scope object to control your layout
     * than for your directive. Usually one that is isolated.
     * 
     * This is set to the injected local scope by default
     */
    this.setLayoutScope = function(scope){
      layoutScope = scope;
    }
    
    /**
     * hash which stores the methods of this base class, 
     * makes it a little handier to extend methods in a sub class
     */
    this._super = angular.extend(this._super||{}, {
      setReflowWatcher: self.setReflowWatcher,
      removeReflowWatcher: self.removeReflowWatcher,
      triggerReflow: self.triggerReflow,
      setLayoutScope: self.setLayoutScope
    });
  
    /**
     * Init function called at some point after instanciation, before use
     */
    this.init = function(){
    
    }
  }
  LayoutBlockBase.$inject = ["$scope", "$exceptionHandler"];


  function validateAndTrim (id) {
    if( !angular.isString(id) ) return false;
    id = id.replace(/^\s+|\s+$/g,"");
    if( id.length == 0 ) return false;
    return id;
  }

  function extendLayoutController (base, child){ 
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
      Inherit.prototype = base.prototype; 
      C.prototype = new Inherit(); // instantiate it without calling constructor 
      // ask for everything.   
      C.$inject = [].concat(base.$inject).concat(child.$inject);   
      return C; 
  }
  
  window.LayoutContainerBase = LayoutContainerBase;
  window.LayoutBlockBase = LayoutBlockBase;
  window.LayoutContainerBlockBase = extendLayoutController(LayoutContainerBase, LayoutBlockBase);
  window.layout_component_utils = {
    extendController: extendLayoutController 
  }
})(window);