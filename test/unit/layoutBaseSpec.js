'use strict';

/* jasmine specs for layout base controlers */

describe("Layout Base Controllers", function() {
  describe("LayoutContainerBase", function() {
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
      ctrl = injector.instantiate(LayoutContainerBase, locals);
      ctrl.defaultLayout = function(){return defaultLayout};
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
      expect(ctrl.addChild(child)).toEqual("1");
      expect(ctrl.addChild(child, " test ")).toEqual("test");
      expect(scope.children).toEqual([child, child, child]);
      expect(function(){ctrl.addChild(child, name);}).toThrow("Sorry but this Layout Container already has a child with the name 'testChildName'");
      expect(scope.children.length).toEqual(3);
    });
    
    it("should set the default layout factory in the init function", function() {
      ctrl.layout();
      scope.$digest();
      expect(defaultLayout).toHaveBeenCalled();
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
    
    it("should call the default layout factory and assign it to layout in the init function", function() {
      var defaultLayoutSpy = jasmine.createSpy("Default layout spy");
      spyOn(ctrl, "defaultLayout").andReturn(defaultLayoutSpy);
      ctrl.init();
      ctrl.layout();
      scope.$digest();
      expect(defaultLayoutSpy).toHaveBeenCalledWith([], scope);
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
      ctrl.defaultLayout = function(){return defaultLayout};
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
      expect(ctrl.addChild(child)).toEqual("1");
      expect(ctrl.addChild(child, " test ")).toEqual("test");
      expect(scope.children).toEqual([child, child, child]);
      expect(function(){ctrl.addChild(child, name);}).toThrow("Sorry but this Layout Container already has a child with the name 'testChildName'");
      expect(scope.children.length).toEqual(3);
    });

    it("should set the default layout factory in the init function", function() {
      ctrl.layout();
      scope.$digest();
      expect(defaultLayout).toHaveBeenCalled();
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

    it("should call the default layout factory and assign it to layout in the init function", function() {
      var defaultLayoutSpy = jasmine.createSpy("Default layout spy");
      spyOn(ctrl, "defaultLayout").andReturn(defaultLayoutSpy);
      ctrl.init();
      ctrl.layout();
      scope.$digest();
      expect(defaultLayoutSpy).toHaveBeenCalledWith([], scope);
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