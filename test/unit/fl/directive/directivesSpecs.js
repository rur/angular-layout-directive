'use strict';

describe("directives", function() {
  describe("extendLayoutCtrl", function() {
    var Ctrl1, Ctrl2;
    beforeEach(module(function( $provide) {
      $provide.value("d1", 123);
      $provide.value("d2", 456);
      $provide.value("d3", 789);
    }));
    it("should inject both controllers wiht dependencies", inject(function($injector) {
      Ctrl1 = function Controller1 (d1,d2,d3) {
        this.args1 = Array.prototype.slice.call(arguments);
      }
      Ctrl1.$inject = ["d1","d2","d3"];
      Ctrl2 = function Controller2 (d3,d2,d1) {
        this.args2 = Array.prototype.slice.call(arguments);
      }
      Ctrl2.$inject = ["d3","d2","d1"];
      var ctrl = $injector.instantiate(extendLayoutCtrl(Ctrl1, Ctrl2))
      expect(ctrl.args1).toEqual([123,456,789]);
      expect(ctrl.args2).toEqual([789,456,123]);
    }));
    it("should extend both init functions", inject(function($injector) {
      var init1 = jasmine.createSpy("Ctrl1 Init"),
          init2 = jasmine.createSpy("Ctrl2 Init"),
          ctrl;
      Ctrl1 = function () {
        this.init = init1;
      }
      Ctrl1.$inject = [];
      Ctrl2 = function () {
        this.init = init2;
      }
      Ctrl2.$inject = [];
      ctrl = $injector.instantiate(extendLayoutCtrl(Ctrl1, Ctrl2));
      ctrl.init(123);
      expect(init1).toHaveBeenCalledWith(123);
      expect(init2).toHaveBeenCalledWith(123);
    }));
    it("should pass on prototype methods", inject(function($injector) {
      var proto1 = jasmine.createSpy("Ctrl1 Proto Method Spy"),
          proto2 = jasmine.createSpy("Ctrl2 Proto Method Spy"),
          proto1b = jasmine.createSpy("Ctrl1 Overridden Proto Method Spy"),
          ctrl;
      Ctrl1 = function () {}
      Ctrl1.$inject = [];
      Ctrl1.prototype.test1 = proto1;
      Ctrl1.prototype.test2 = proto1b;
      Ctrl2 = function () {}
      Ctrl2.$inject = [];
      Ctrl2.prototype.test2 = proto2;
      ctrl = $injector.instantiate(extendLayoutCtrl(Ctrl1, Ctrl2));
      ctrl.test1();
      expect(proto1).toHaveBeenCalled();
      ctrl.test2();
      expect(proto2).toHaveBeenCalled();
      expect(proto1b).not.toHaveBeenCalled();
    }));
    it("should extend multiple classes in sequence", inject(function($injector) {
      var init1 = jasmine.createSpy("Ctrl1 Init"),
          init2 = jasmine.createSpy("Ctrl2 Init"),
          init3 = jasmine.createSpy("Ctrl3 Init"),
          ctrl,
          Ctrl3,
          Ext;
      Ctrl1 = function () {
        this.testval = "test";
        this.init = init1;
      }
      Ctrl1.$inject = ["d3","d2","d1"];
      Ctrl2 = function () {
        this.init = init2;
      }
      Ctrl2.$inject = ["d1","d2","d3"];
      Ctrl3 = function () {
        this.init = init3;
      }
      Ctrl3.$inject = [];
      Ext = extendLayoutCtrl(Ctrl1, Ctrl2, Ctrl3);
      expect(Ext.$inject).toEqual(["d3","d2","d1","d1","d2","d3"]);
      ctrl = $injector.instantiate(Ext);
      ctrl.init();
      expect(init1).toHaveBeenCalled();
      expect(init2).toHaveBeenCalled();
      expect(init3).toHaveBeenCalled();
      expect(ctrl.testval).toEqual("test");
    }));
  });
  describe("LayoutContainerBase", function() {
    var ctrl,
        scope,
        injector,
        locals;
        
    beforeEach(inject(function($rootScope, $injector) {
      scope = $rootScope.$new();
      injector = $injector;
      locals = {
        $scope: scope
      }
      ctrl = injector.instantiate(LayoutContainerBase, locals);
      ctrl.init();
    }));
    
    it("should instanciate LayoutContainerBase", function() {
      expect(ctrl).not.toBeNull();
      expect(ctrl).toBeDefined();
    });
    
    it("should add child properties to the scope object", function() {
      expect(scope.children).toEqual([]);
      expect(scope.childrenByName).toEqual({});
    });
    
    it("should have a layoutScope property", function() {
      expect(ctrl.layoutScope).toEqual(scope);
    });
    
    it("should add a child returning the name", function() {
      var child = scope.$new(true), // isolated scope
          name = "testChildName";
      expect(ctrl.addChild(child, name)).toEqual(name);
      expect(ctrl.addChild(child)).toEqual("child_2");
      expect(ctrl.addChild(child, " test ")).toEqual("test");
      expect(scope.children).toEqual([child, child, child]);
      expect(function(){ctrl.addChild(child, name);}).toThrow("Sorry but this Layout Container already has a child with the name 'testChildName'");
      expect(scope.children.length).toEqual(3);
    });
    
    it("should add a listener to child scopes for the 'reflow' event", function() {
      var child = scope.$new(true),
          onArgs;
      spyOn(child, "$on");
      ctrl.addChild(child);
      spyOn(ctrl, "layout");
      onArgs = child.$on.argsForCall[0];
      expect(onArgs[0]).toEqual("reflow");
      (onArgs[1])();
      expect(ctrl.layout).toHaveBeenCalled();
    });
    
    it("should have a default layout function which does nothing", function() {
      expect(ctrl.defaultLayout()).toEqual(angular.noop);
    });
    
    it("should set and trigger the layout function", function() {
      var layoutSpy = jasmine.createSpy("Layout Function Spy");
      ctrl.layout(layoutSpy);
      scope.$digest();
      expect(layoutSpy).not.toHaveBeenCalled();
      ctrl.layout();
      scope.$digest();
      expect(layoutSpy).toHaveBeenCalledWith(scope.children, scope);
    });
    
    it("should trigger the layout function when reflow is called", function() {
      spyOn(ctrl, "layout");
      ctrl.reflow();
      expect(ctrl.layout).toHaveBeenCalledWith();
    });
    
    it("should call _super reflow function", function() {
      var reflowSpy = jasmine.createSpy("Super Reflow Spy"),
          ctrl2;
      function TestClass(){
        this._super = {
          reflow: reflowSpy 
        }
        injector.invoke(LayoutContainerBase, this, locals);
      }
      ctrl2 = new TestClass();
      ctrl2.reflow();
      expect(reflowSpy).toHaveBeenCalled();
    });
    
    it("should have a _super object with a reference to its methods", function() {
      expect(ctrl._super.addChild).toEqual(ctrl.addChild);
      expect(ctrl._super.layout).toEqual(ctrl.layout);
      expect(ctrl._super.defaultLayout).toEqual(ctrl.defaultLayout);
      expect(ctrl._super.setLayoutScope).toEqual(ctrl.setLayoutScope);
      expect(ctrl._super.reflow).toEqual(ctrl.reflow);
      expect(ctrl._super.init).toEqual(ctrl.init);
    });

    it("should add a reflow function to the layout scope", function() {
      expect(angular.isFunction(scope.reflow)).toBeTruthy();
      spyOn(ctrl, "reflow");
      scope.reflow();
      expect(ctrl.reflow).toHaveBeenCalledWith();
    });
    
    it("should set the layout scope", function() {
      var newScope = jasmine.createSpyObj("Layout Scope Spy", ["$emit" , "$watch"])
      ctrl.setLayoutScope(newScope);
      expect(ctrl.layoutScope).toEqual(newScope);
    });
  });
  
  describe("LayoutBlockBase", function() {
    var ctrl,
        scope,
        injector;
    beforeEach(inject(function($rootScope, $injector) {
      scope = $rootScope.$new();
      injector = $injector;
      var locals = {
        $scope: scope
      }
      ctrl = injector.instantiate(LayoutBlockBase, locals);
      ctrl.init();
    }));
    it("should instanciate LayoutBlockBase", function() {
      expect(ctrl).not.toBeNull();
      expect(ctrl).toBeDefined();
    });
    it("should trigger a reflow event to be emitted on the scope", function() {
      spyOn(scope, "$emit");
      ctrl.reflow();
      expect(scope.$emit).toHaveBeenCalledWith("reflow");
    });
    describe("reflow watcher methods", function() {
      it("should add and remove reflow watcher expressions", function() {
        spyOn(ctrl, "reflow");
        ctrl.addReflowWatcher("test");
        scope.test = 123;
        scope.$digest();
        expect(ctrl.reflow).toHaveBeenCalled();
        ctrl.removeReflowWatcher("test");
        scope.test = 321;
        scope.$digest();
        expect(ctrl.reflow.callCount).toEqual(1);
      });
      it("should raise an error if the expression is not a string", function() {
        expect(function(){ctrl.addReflowWatcher(function(){});}).toThrow("You can only add a string expression as a reflow watcher");
      });      
    });
    it("should set the layout scope", function() {
      var newScope = jasmine.createSpyObj("Layout Scope Spy", ["$emit" , "$watch"])
      ctrl.setLayoutScope(newScope);
      expect(ctrl.layoutScope).toEqual(newScope);
      ctrl.reflow();
      expect(newScope.$emit).toHaveBeenCalledWith("reflow");
      ctrl.addReflowWatcher("test");
      expect(newScope.$watch).toHaveBeenCalledWith("test", jasmine.any(Function) );
    });
    it("should add a reflow function to the layout scope", function() {
      expect(angular.isFunction(scope.reflow)).toBeTruthy();
      spyOn(ctrl, "reflow");
      scope.reflow();
      expect(ctrl.reflow).toHaveBeenCalledWith();
    });
    it("should call _super reflow function", function() {
      var reflowSpy = jasmine.createSpy("Super Reflow Spy"),
          ctrl2;
      function TestClass(){
        this._super = {
          reflow: reflowSpy 
        }
        injector.invoke(LayoutContainerBase, this, {$scope: scope});
      }
      ctrl2 = new TestClass();
      ctrl2.reflow();
      expect(reflowSpy).toHaveBeenCalled();
    });
  });
  describe("LayoutDisplayBase", function() {
    var ctrl,
        scope,
        layoutScope,
        transService,
        transition,
        injector,
        element;
    beforeEach(inject(function($rootScope, $injector) {
      scope = jasmine.createSpyObj("Scope Spy", ["$new"]);
      layoutScope = {name: "layoutScope"};
      scope.$new.andReturn(layoutScope);
      injector = $injector;
      transition = jasmine.createSpyObj("Transition Spy", ["state", "bind", "addSuite"]);
      transition.state.config = jasmine.createSpy("Transition State Config Spy");
      transService = jasmine.createSpy("Tansition Service Spy").andReturn(transition);
      element = angular.element(document.createElement("div"));
      var locals = {
        $scope: scope,
        $element: element,
        transition: transService
      }
      ctrl = injector.instantiate(LayoutDisplayBase, locals);
      ctrl.init();
      // // Custom matchers
      // this matcher allows you to pass a function which is called on its matching argument
      this.addMatchers({
          toHaveBeenCalledWithAndTest: toHaveBeenCalledWithAndTest
        });
    }));
    it("should instanciate Layout display base ", function() {
      expect(ctrl).not.toBeNull();
      expect(ctrl).toBeDefined();
    });
    it("should create an isolated layout scope", function() {
      expect(scope.$new).toHaveBeenCalledWith(true);
      expect(ctrl.layoutScope).toEqual(layoutScope);
    });
    it("should create the transition object", function() {
      expect(transService).toHaveBeenCalledWith(layoutScope, element);
      expect(ctrl.transition).toEqual(transition);
    });
    it("should create and configure the transitions", function() {
      // setup
      var args;
      spyOn(ctrl, "transitionInComplete");
      spyOn(ctrl, "transitionOutComplete");
      // assertions
      // expect(transition.bind).toHaveBeenCalledWith({ hidden: "css-hidden"}); // no it shouldnt
      expect(transition.state.config).toHaveBeenCalledWith("init", {});
      expect(transition.state.config)
        .toHaveBeenCalledWithAndTest("show", function(val){
          if(angular.isFunction(val)){
            val();
            return true;
          }
          return false;
        });
      expect(transition.state.config)
        .toHaveBeenCalledWithAndTest("hide", function(val){
          if(angular.isFunction(val)){
            val();
            return true;
          }
          return false;
        });
      expect(ctrl.transitionInComplete).toHaveBeenCalled();
      expect(ctrl.transitionOutComplete).toHaveBeenCalled();
    });
    it("should add width and height calculations methods to layoutScope", function() {
      layoutScope.height = 100;
      layoutScope.width = 120;
      expect(layoutScope.calculateHeight()).toEqual(100);
      expect(layoutScope.calculateWidth()).toEqual(120);
      // layoutScope.hidden = true;
      // expect(layoutScope.calculateHeight()).toEqual(0); 
      // expect(layoutScope.calculateWidth()).toEqual(0);
      // // not any more!
    });
    it("should have transition functions which broadcast events", function() {
      expect(layoutScope.transState).toEqual("initializing");
      ctrl.transitionIn();
      expect(layoutScope.transState).toEqual("transitioningIn");
      ctrl.transitionInComplete();
      expect(layoutScope.transState).toEqual("transitionedIn");
      ctrl.transitionOut();
      expect(layoutScope.transState).toEqual("transitioningOut");
      ctrl.transitionOutComplete();
      expect(layoutScope.transState).toEqual("transitionedOut");
    });
    it("should provide functions in a _super hash", function() {
      expect(ctrl._super).toEqual({
        transitionIn: ctrl.transitionIn,
        transitionInComplete: ctrl.transitionInComplete,
        transitionOut: ctrl.transitionOut,
        transitionOutComplete: ctrl.transitionOutComplete
      });
    });
    it("should have called transition state init", function() {
      expect(transition.state).toHaveBeenCalledWith("init");
    });
  });
  // Custom Matcher Function
  var toHaveBeenCalledWithAndTest = function(){
    var spy = this.actual,
               expected = Array.prototype.slice.call(arguments),
               allArgs = spy.argsForCall,
               args,
               arg,
               match = false;
     for (var i=0; i < allArgs.length; i++) {
       args = allArgs[i];
       if(args.length == expected.length){
         for (var j=0; j < args.length; j++) {
           arg = args[j];
           if(angular.isFunction(expected[j])){
             match = (expected[j])(arg);
           } else {
             match = angular.equals(arg, expected[j]); 
           }
           if(!match) break;
         };
       }
       if(match) break;
     };
    this.message = function(){
              return "expected "+spy.identity+" to have been called with test "+expected+
                     " but it was called with the following: "+allArgs;
            }
    return match;
  }
});