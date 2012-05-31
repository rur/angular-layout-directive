'use strict';

/* jasmine specs for layout base controlers */

describe("Layout Base Controllers", function() {
  describe("layout_component_utils", function() {
    describe("extendController", function() {
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
        var ctrl = $injector.instantiate(layout_component_utils.extendController(Ctrl1, Ctrl2))
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
        ctrl = $injector.instantiate(layout_component_utils.extendController(Ctrl1, Ctrl2));
        ctrl.init();
        expect(init1).toHaveBeenCalled();
        expect(init2).toHaveBeenCalled();
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
        ctrl = $injector.instantiate(layout_component_utils.extendController(Ctrl1, Ctrl2));
        ctrl.test1();
        expect(proto1).toHaveBeenCalled();
        ctrl.test2();
        expect(proto2).toHaveBeenCalled();
        expect(proto1b).not.toHaveBeenCalled();
      }));
    });
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
    });

    it("should add a reflow function to the layout scope", function() {
      expect(angular.isFunction(scope.reflow)).toBeTruthy();
      spyOn(ctrl, "reflow");
      scope.reflow();
      expect(ctrl.reflow).toHaveBeenCalledWith();
    });
    
    describe("validateAndTrim", function() {
      it("should pass some and fail others", function() {
        expect(ctrl.validateAndTrim("abc")).toEqual("abc");
        expect(ctrl.validateAndTrim(" abc ")).toEqual("abc");
        expect(ctrl.validateAndTrim("a")).toEqual("a");
        expect(ctrl.validateAndTrim("")).toBeFalsy();
        expect(ctrl.validateAndTrim()).toBeFalsy();
        expect(ctrl.validateAndTrim(123)).toBeFalsy();
        expect(ctrl.validateAndTrim([])).toBeFalsy();
        expect(ctrl.validateAndTrim({})).toBeFalsy();
        expect(ctrl.validateAndTrim(function(){})).toBeFalsy();
      });
    });
    describe("getUniqueID", function() {
      var arr;
      beforeEach(function() {
        arr = ["a","b","c"];
      });
      it("should pass a valid id back", function() {
        expect(ctrl.getUniqueID("test", arr)).toEqual("test");
      });
      it("should create a new uniqe id based upon prepend attribute", function() {
        expect(ctrl.getUniqueID(null, arr, "some_")).toEqual("some_1");
      });
      it("should increment a collision", function() {
        expect(ctrl.getUniqueID("a", arr, "some_")).toEqual("a1");
      });
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
      var newScope = scope.$new(true);
      ctrl.setLayoutScope(newScope);
      spyOn(newScope, "$emit");
      spyOn(newScope, "$watch");
      ctrl.reflow();
      expect(newScope.$emit).toHaveBeenCalledWith("reflow");
      ctrl.addReflowWatcher("test");
      expect(newScope.$watch).toHaveBeenCalled();
    });
    it("should add a reflow function to the layout scope", function() {
      expect(angular.isFunction(scope.reflow)).toBeTruthy();
      spyOn(ctrl, "reflow");
      scope.reflow();
      expect(ctrl.reflow).toHaveBeenCalledWith();
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
      scope = jasmine.createSpyObj("Scope Spy", ["$new", "$broadcast"]);
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
    }));
    it("should instanciate Layout display base ", function() {
      expect(ctrl).not.toBeNull();
      expect(ctrl).toBeDefined();
    });
    it("should create an isolated layout scope", function() {
      expect(scope.$new).toHaveBeenCalledWith(true);
      expect(ctrl.layoutScope).toEqual(layoutScope);
    });
    it("should create and configure the transition object", function() {
      expect(transService).toHaveBeenCalledWith(layoutScope, element);
      expect(ctrl.transition).toEqual(transition);
    });
    
    it("should have transition functions which broadcast events", function() {
      expect(layoutScope.transState).toEqual("initializing");
      ctrl.transitionIn();
      expect(scope.$broadcast).toHaveBeenCalledWith("transitioningIn");
      expect(layoutScope.transState).toEqual("transitioningIn");
      ctrl.transitionInComplete();
      expect(scope.$broadcast).toHaveBeenCalledWith("transitionedIn");
      expect(layoutScope.transState).toEqual("transitionedIn");
      ctrl.transitionOut();
      expect(scope.$broadcast).toHaveBeenCalledWith("transitioningOut");
      expect(layoutScope.transState).toEqual("transitioningOut");
      ctrl.transitionOutComplete();
      expect(scope.$broadcast).toHaveBeenCalledWith("transitionedOut");
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
  });
  describe("LayoutContainerBlockBase", function() {
    var ctrl,
        scope,
        injector;
    beforeEach(inject(function($rootScope, $injector) {
      scope = jasmine.createSpyObj("Scope", ["$emit"])
      injector = $injector;
      var locals = {
        $scope: scope
      }
      ctrl = injector.instantiate(LayoutContainerBlockBase, locals);
      ctrl.init();
    }));
    it("should instanciate LayoutContainerBlockBase", function() {
      expect(ctrl).not.toBeNull();
      expect(ctrl).toBeDefined();
    });
    it("should both trigger its own layout but also dispatch 'reflow' to its parent container", function() {
      spyOn(ctrl, "layout");
      ctrl.reflow();
      expect(ctrl.layout).toHaveBeenCalledWith();
      expect(scope.$emit).toHaveBeenCalledWith("reflow");
    });
    it("should add a reflow function to the layout scope", function() {
      expect(angular.isFunction(scope.reflow)).toBeTruthy();
      spyOn(ctrl, "reflow");
      scope.reflow();
      expect(ctrl.reflow).toHaveBeenCalledWith();
    });
  });
});