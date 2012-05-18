'use strict';

/* jasmine specs for services go here */

describe('service', function() {
  beforeEach(function() {
    module('myApp.services', function($provide) {
        $provide.value('service', 'value');
      });
  });

  describe('augmentController', function() {
    var A, B, augmentController;
  
    beforeEach(function() {
      A = function() { augmentController(B, this); }
      B = function() {}
      inject(function($injector) {
        augmentController = $injector.get('augmentController');
      });
    });
    
    it('should run the B ctrl constructor with the parent instance as "this"', function() {
      B = function() {
          this.testValue = "value";
      }
      expect((new A()).testValue).toEqual("value");
    });
    it('should apply prototype of B to A', function() {
      B.prototype.testValue = "value"
      expect((new A()).testValue).toEqual("value");
    });
    it("should inject into B", function() {
      B = function(service){
        this.service = service
      }
      expect((new A()).service).toEqual("value");
    });
    it("should inject locals into B overriding app services", function() {
      B = function  (service) {
        this.service = service;
      }
      A = function  () {
        augmentController(B, this, {service:"value2"})
      }
      expect((new A()).service).toEqual("value2");
    });
  });
  
  describe("transition", function() {
    var transition, 
        localTrans, 
        scope, 
        element;
    beforeEach(function() {
      inject(function($injector) {
        transition = $injector.get('transition');
        scope = $injector.get("$rootScope");
      });
      element = jasmine.createSpyObj("element", ["css"]);
      localTrans = transition(scope, element);
    });
    
    it("should provide the transition service and create an instance", function() {
      expect(transition).not.toBeNull();
      expect(transition).toBeDefined();
      expect(localTrans).not.toBeNull();
      expect(localTrans).toBeDefined();
    });
    
    it("should bind to a scope property", function() {
      spyOn(scope, "$watch").andCallFake(function(prop,func){
        expect(prop).toEqual("property");
        expect(angular.isFunction(func)).toBeTruthy();
      });
      localTrans.bind("property", "trans-property")
      expect(scope.$watch).toHaveBeenCalled();
    });
    
    it("should not call $watch twice on the same property", function() {
      spyOn(scope, "$watch");
      localTrans.bind("property", "trans-property");
      localTrans.bind("property", "different-trans-property");
      expect(scope.$watch.callCount).toEqual(1);
    });
    
    it("should apply a hash of changes to a scope", function() {
      localTrans.apply({x:123,y:"100%"});
      expect(scope.x).toEqual(123);
      expect(scope.y).toEqual("100%");
    });
    
    it("should configure and apply states", function() {
      localTrans.state.config("state1", {x:123,y:"100%"});
      localTrans.state("state1");
      expect(scope.x).toEqual(123);
      expect(scope.y).toEqual("100%");
    });
    
    describe("TransitionSuite", function() {
      var aniPropSpy,
          fireSpy;
          
      beforeEach(function() {
        aniPropSpy = jasmine.createSpy("test propery");
        fireSpy = jasmine.createSpy("test fire");
        function TestSuite () {
          this.register("test", aniPropSpy);
          this.fire = fireSpy;
        }
        localTrans.addSuite(TestSuite);
        localTrans.bind("prop", "test");
      });
      
      it("should add a transition suite which is invoked to extend a base class", function() {
        var constWasCalled = false;
        function TestRunSuite () {
          expect(this.register).toBeDefined();
          expect(angular.isFunction(this.register)).toBeTruthy();
          expect(this.testVal).toEqual("testValue");
          expect(this.props).toEqual({});
          constWasCalled = true;
          this.fire = function(){};
        }
        TestRunSuite.prototype.testVal = "testValue";
        localTrans.addSuite( TestRunSuite );
        expect(constWasCalled).toBeTruthy();
      });
      
      it("should call the bound transition property functions", function() {
        scope.prop = 0;
        scope.$digest();
        scope.prop = 1;
        scope.$digest();
        scope.prop = 2;
        scope.$digest();
        expect(aniPropSpy).toHaveBeenCalledWith(2,1);
      });

      it("should fire the animation once after all scope changes have been made", function() {
        scope.$watch("prop", function(newval,oldval){
          if(newval > 3){ 
            scope.prop = 3;
          }
        })
        scope.prop = 10;
        scope.$digest();
        expect(aniPropSpy.callCount).toEqual(2);
        expect(fireSpy.callCount).toEqual(1);
      });
      
      it("should apply element and parameters hash to the fire function", function() {
        localTrans.state.config("test2", {prop:123}, {a: "value2"});
        scope.$digest();
        localTrans.apply({prop: 654},{a: "value1"});
        scope.$digest();
        scope.prop = 12345;
        scope.$digest();
        localTrans.state("test2");
        scope.$digest();
        expect(fireSpy.callCount).toEqual(4);
        expect(fireSpy).toHaveBeenCalledWith(element, {a: "value1"});
        expect(fireSpy).toHaveBeenCalledWith(element, {a: "value2"});
      });
      it("should have a default transition suite applied", function() {
        localTrans.bind("x","x");
        localTrans.bind("y","y");
        localTrans.bind("width","width");
        localTrans.bind("height","height");
        localTrans.apply({x: 1, y: 2, width: "100%", height: 200});
        scope.$digest();
        expect(element.css).toHaveBeenCalledWith({left: 1, top: 2, width: "100%", height: 200});
      });
    });
  });
});
