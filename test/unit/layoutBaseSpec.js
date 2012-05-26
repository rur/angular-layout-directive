'use strict';

/* jasmine specs for layout base controlers */

describe("Layout Base Controllers", function() {
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
    
    it("should set and trigger the layout function", function() {
      var layoutSpy = jasmine.createSpy("Layout Function Spy");
      ctrl.layout(layoutSpy);
      scope.$digest();
      expect(layoutSpy).not.toHaveBeenCalled();
      ctrl.layout();
      scope.$digest();
      expect(layoutSpy).toHaveBeenCalledWith(scope.children, scope);
    });
    
    it("should throw an error when the default layout is not extended", function() {
      expect(function(){ctrl.defaultLayout();}).toThrow("You must implement a defaultLayout factory method which returns a layout function");
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
    
  });
  describe("LayoutContainerBlockBase", function() {
    
  });
});