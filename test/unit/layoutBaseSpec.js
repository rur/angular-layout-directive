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
        injector;
    beforeEach(inject(function($rootScope, $injector) {
      scope = $rootScope.$new();
      injector = $injector;
      var locals = {
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
    
    it("should have a _super object with a reference to its methods", function() {
      expect(ctrl._super.addChild).toEqual(ctrl.addChild);
      expect(ctrl._super.layout).toEqual(ctrl.layout);
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
      ctrl.triggerReflow();
      expect(scope.$emit).toHaveBeenCalledWith("reflow");
    });
    describe("reflow watcher methods", function() {
      it("should add and remove reflow watcher expressions", function() {
        spyOn(ctrl, "triggerReflow");
        ctrl.addReflowWatcher("test");
        scope.test = 123;
        scope.$digest();
        expect(ctrl.triggerReflow).toHaveBeenCalled();
        ctrl.removeReflowWatcher("test");
        scope.test = 321;
        scope.$digest();
        expect(ctrl.triggerReflow.callCount).toEqual(1);
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
      ctrl.triggerReflow();
      expect(newScope.$emit).toHaveBeenCalledWith("reflow");
      ctrl.addReflowWatcher("test");
      expect(newScope.$watch).toHaveBeenCalled();
    });
  });
  describe("LayoutContainerBlockBase", function() {
    var ctrl,
        scope,
        injector,
        defaultLayout;
    beforeEach(inject(function($rootScope, $injector) {
      defaultLayout = jasmine.createSpy("Default Layout Spy");
      scope = $rootScope.$new();
      injector = $injector;
      var locals = {
        $scope: scope
      }
      ctrl = injector.instantiate(LayoutContainerBlockBase, locals);
      ctrl.init();
    }));
    it("should instanciate LayoutContainerBlock", function() {
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

    it("should set and trigger the layout function", function() {
      var layoutSpy = jasmine.createSpy("Layout Function Spy");
      ctrl.layout(layoutSpy);
      scope.$digest();
      expect(layoutSpy).not.toHaveBeenCalled();
      ctrl.layout();
      scope.$digest();
      expect(layoutSpy).toHaveBeenCalledWith(scope.children, scope);
    });

    it("should have a _super object with a reference to its methods", function() {
      expect(ctrl._super.addChild).toEqual(ctrl.addChild);
      expect(ctrl._super.layout).toEqual(ctrl.layout);
    });

    it("should trigger a reflow event to be emitted on the scope", function() {
      spyOn(scope, "$emit");
      ctrl.triggerReflow();
      expect(scope.$emit).toHaveBeenCalledWith("reflow");
    });
    describe("reflow watcher methods", function() {
      it("should add and remove reflow watcher expressions", function() {
        spyOn(ctrl, "triggerReflow");
        ctrl.addReflowWatcher("test");
        scope.test = 123;
        scope.$digest();
        expect(ctrl.triggerReflow).toHaveBeenCalled();
        ctrl.removeReflowWatcher("test");
        scope.test = 321;
        scope.$digest();
        expect(ctrl.triggerReflow.callCount).toEqual(1);
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
      ctrl.triggerReflow();
      expect(newScope.$emit).toHaveBeenCalledWith("reflow");
      ctrl.addReflowWatcher("test");
      expect(newScope.$watch).toHaveBeenCalled();
    });
  });
});