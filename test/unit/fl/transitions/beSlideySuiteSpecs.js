'use strict';


/**
 * Slidey Transition Suite Specs
 * 
 */
describe("SlideyTransitionSuite", function() {
  var suite, registerSpy, MockSuite, trans;
  beforeEach(function() {
    trans = {};
    registerSpy = jasmine.createSpy("Register Spy").andCallFake(function(prop, func){
      trans[prop] = func;
    });
    MockSuite = function () {
      this.register = registerSpy;
      BeSlideyTransitionSuite.apply(this);
    }
  });
  it("should register slidey transition properties", function() {
    suite = new MockSuite();
    expect(registerSpy).toHaveBeenCalledWith("slidey-x",jasmine.any(Function));
    expect(registerSpy).toHaveBeenCalledWith("slidey-y",jasmine.any(Function));
    expect(registerSpy).toHaveBeenCalledWith("slidey-width",jasmine.any(Function));
    expect(registerSpy).toHaveBeenCalledWith("slidey-height",jasmine.any(Function));
    expect(registerSpy).toHaveBeenCalledWith("slidey-opacity",jasmine.any(Function));
    // expect(registerSpy).toHaveBeenCalledWithAndTest("slidey-hidden",function(val){ return angular.isFunction(val)});
  });
  it("should refuse invalid values", function() {
    suite = new MockSuite();
    var allArgs = registerSpy.argsForCall;
    angular.forEach(allArgs, function(args, key){
      args[1](null);
      args[1]({});
      args[1]([]);
      args[1](function(){});
      args[1](undefined);
      args[1](NaN);
      args[1](true);
      args[1](false);
    });
    expect(suite.props).toEqual({});
  });
  it("should add 'px' to bare num values on some transition properties", function() {
    suite = new MockSuite();
    trans["slidey-x"](123);
    trans["slidey-y"](123);
    trans["slidey-width"](123);
    trans["slidey-height"](123);
    expect(suite.props).toEqual({ left : '123px', 
                                  top : '123px', 
                                  width : '123px', 
                                  height : '123px' });
  });
  it("should accept 0 as a value", function() {
    suite = new MockSuite();
    trans["slidey-x"](0);
    trans["slidey-y"](0);
    trans["slidey-width"](0);
    trans["slidey-height"](0);
    expect(suite.props).toEqual({ left : '0px', 
                                  top : '0px', 
                                  width : '0px', 
                                  height : '0px' });
  });
  it("should pass on string values unmolested to some transition properties", function() {
    suite = new MockSuite();
    trans["slidey-x"]("abc");
    trans["slidey-y"]("abc");
    trans["slidey-width"]("abc");
    trans["slidey-height"]("abc");
    expect(suite.props).toEqual({ left : "abc", 
                                  top : "abc", 
                                  width : "abc", 
                                  height : "abc" });
  });
  it("should refuse an invalid number value to opacity", function() {
    suite = new MockSuite();
    trans["slidey-opacity"]("abc");
    expect(suite.props).toEqual({});
    trans["slidey-opacity"]("0.4");
    expect(suite.props).toEqual({opacity : '0.4'});
    trans["slidey-opacity"](0.5);
    expect(suite.props).toEqual({opacity : 0.5});
    trans["slidey-opacity"]("4%");
    expect(suite.props).toEqual({opacity : 0.5});
  });
});
