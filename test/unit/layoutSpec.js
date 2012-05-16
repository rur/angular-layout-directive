'use strict';

/* Jasmine Specs for Layout controllers */ 

describe("layout", function() {
  describe("TransitionDirectiveCtrl", function() {
    var ctrl, transition, scope, element;
    beforeEach(function() {
      transition = jasmine.createSpy("transition");
      scope = jasmine.createSpyObj("scopeSpy", ["$watch"])
      element = {id: "value"}
      module(function($provide){
        $provide.value("transition", transition);
        $provide.value("$scope", scope);
        $provide.value("$element", element);
      });
      
      inject(function ($injector) {
        ctrl = $injector.instantiate(TransitionDirectiveCtrl);
      });
    });
    
    it("should instanciate the controller", function() {
      expect(ctrl).not.toBeNull();
      expect(ctrl).toBeDefined();
    });
    it("should add an empty transitions hash to the scope", function() {
      expect(scope.transitions).toEqual({});
    });
    it("should add a transition binding", function() {
      var bindings = {key: "value"};
      ctrl.bindTransitions( bindings );
      expect(scope.$watch).toHaveBeenCalled();
      expect(scope.transitions["key"]).toEqual("value");
    });
    it("should create the correct scope watch listener", function() {
      var bindings = {key: "value"},
          transFuncMock = jasmine.createSpy("transition function"),
          watchFunc;
      scope.$watch.andCallFake(function(exp,listener){
        expect(exp).toEqual("key");
        watchFunc = listener;
      });
      ctrl.bindTransitions( bindings );
      transition.andReturn(transFuncMock)
      watchFunc(1,2);
      expect(transition).toHaveBeenCalledWith("value");
      expect(transFuncMock).toHaveBeenCalledWith(element, 1, 2);
    });
  });
});