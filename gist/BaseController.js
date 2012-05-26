
/**
 * Base class for a layout container.
 * 
 * It has methods to make managing and positioning child layout blocks easier and consistant
 */
function LayoutContainerBase ($scope, $exceptionHandler) {
  var self = this,
      layoutFn,
      triggered = false;
      
  // children
  $scope.children = [];
  $scope.childrenByName = {};
  
  /** 
   * Add child block to this container
   * 
   * @param {angular.ng.$rootScope.Scope} child This is the layout scope of a child element
   * @param {string optional} name The name identifyer
   * @re
   */
  this.addChild = function (child, name){
    child.$on("reflow", self.layout);
    name = validateAndTrim(name) || $scope.children.length.toString(); // keys can only be a string
    if(name && $scope.hasOwnProperty(name)) $exceptionHandler("Sorry but this Layout Container already has a child with the name '"+name+"'");
    $scope.children.push(child);
    $scope.childrenByName[name] = child;
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
        $scope.$evalAsync(function(){
                            layoutFn($scope.children, $scope);
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
   * hash which stores the methods of this base class, 
   * makes it a little handier to extend methods in a sub class
   */
   this._super = angular.extend(this._super||{}, {
     addChild: self.addChild,
     layout: self.layout,
     init: self.init
   });
  
  /** 
   * Init function called at some point after instanciation, before use
   */
  this.init = function(){
    // defaultLayout() to be implmented by sub-class
    self.layout(self.defaultLayout());
  }
}

LayoutContainerBase.$inject = ["$scope"];

/**
 * Base class for a Layout block which is within a LayoutContainer
 * 
 * It add methods for trigger reflow on its parent based upon changes it layout scope.
 */
function LayoutBlockBase ($scope) {
  var self = this,
      reflow$watchers = {};
  /**
   * Add an expression watcher to the current scope which will 'triggerReflow'
   */
  this.setReflowWatcher = function(expression){
    if(reflow$watchers.indexOf(expression) > -1) return;
    reflow$watchers[expression] = $scope.$watch(expression, triggerReflow);
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
    $scope.$emit("reflow");
  }
  
  /**
   * hash which stores the methods of this base class, 
   * makes it a little handier to extend methods in a sub class
   */
  this._super = angular.extend(this._super||{}, {
    setReflowWatcher: self.setReflowWatcher,
    removeReflowWatcher: self.removeReflowWatcher,
    triggerReflow: self.triggerReflow
  });
  
  /**
   * Init function called at some point after instanciation, before use
   */
  this.init = function(){
    
  }
}
LayoutBlockBase.$inject = ["$scope"];

var LayoutContinerBlockBase = extendLayoutController(LayoutContainerBase, LayoutBlockBase);

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
          inits = [];
      base.apply(this, arguments.splice(0, Base.$inject.length));
      inits.push(this.init||angular.noop);
      child.apply(this, arguments.splice(Base.$inject.length));   
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