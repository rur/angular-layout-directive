'use strict';

describe('augmentController', function() {
  var A, B, augmentController;

  beforeEach(function() {
    module("flLayout", function($provide) {
        $provide.value('service', 'value');
      });
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
