'use strict';

/**
 * Default Transition Suite Specs
 * 
 * Mostly making sure invalid values dont make it through validation
 */
describe("DefaultTransitionSuite", function() {
  var suite, 
      registerSpy, 
      MockSuite, 
      trans;
  
  beforeEach(function() {
    trans = {};
    registerSpy = jasmine.createSpy("Register Spy").andCallFake(function(prop, func){
      trans[prop] = func;
    });
    MockSuite = function () {
      this.register = registerSpy;
      DefaultTransitionSuite.apply(this);
    }
  });
  
  it("should register transition properties", function() {
    suite = new MockSuite();
    expect(registerSpy).toHaveBeenCalledWith("css-x",jasmine.any(Function));
    expect(registerSpy).toHaveBeenCalledWith("css-y",jasmine.any(Function));
    expect(registerSpy).toHaveBeenCalledWith("css-width",jasmine.any(Function));
    expect(registerSpy).toHaveBeenCalledWith("css-height",jasmine.any(Function));
    expect(registerSpy).toHaveBeenCalledWith("css-opacity",jasmine.any(Function));
    expect(registerSpy).toHaveBeenCalledWith("css-hidden",jasmine.any(Function));
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
      trans["css-x"](123);
      trans["css-y"](123);
      trans["css-width"](123);
      trans["css-height"](123);
      expect(suite.props).toEqual({ left : '123px', 
                                    top : '123px', 
                                    width : '123px', 
                                    height : '123px' });
    });
  
    it("should accept 0 as a value", function() {
      suite = new MockSuite();
      trans["css-x"](0);
      trans["css-y"](0);
      trans["css-width"](0);
      trans["css-height"](0);
      expect(suite.props).toEqual({ left : '0px', 
                                    top : '0px', 
                                    width : '0px', 
                                    height : '0px' });
    });
  
    it("should pass on string values unmolested to some transition properties", function() {
      suite = new MockSuite();
      trans["css-x"]("abc");
      trans["css-y"]("abc");
      trans["css-width"]("abc");
      trans["css-height"]("abc");
      expect(suite.props).toEqual({ left : "abc", 
                                    top : "abc", 
                                    width : "abc", 
                                    height : "abc" });
    });
  
    it("should refuse an invalid number value to opacity", function() {
      suite = new MockSuite();
      trans["css-opacity"]("abc");
      expect(suite.props).toEqual({});
      trans["css-opacity"]("0.4");
      expect(suite.props["opacity"]).toEqual('0.4');
      trans["css-opacity"](0.5);
      expect(suite.props["opacity"]).toEqual(0.5);
      trans["css-opacity"]("4%");
      expect(suite.props["opacity"]).toEqual(0.5);
    });
});