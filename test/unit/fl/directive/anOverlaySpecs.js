'use strict';

/**
 * OverlayDirectiveCtrl Specs
 * 
 */
describe("OverlayDirectiveCtrl", function() {
  var scope,
      ctrl,
      element,
      attrs,
      transition,
      transService,
      augmentCtrl,
      _overlay, 
      _parent,
      injector,
      name;
      
  beforeEach(function() {
    inject(function($rootScope, $injector) {
      scope = $rootScope.$new();
      injector = $injector;
    });
    attrs = {withController: "SomeController"};
    element = angular.element(document.createElement("div"));
    transition = jasmine.createSpyObj("Transition Spy", ["state", "bind", "addSuite"]);
    transition.state.config = jasmine.createSpy("Transition State Config Spy");
    transService = jasmine.createSpy("Tansition Service Spy").andReturn(transition);
    augmentCtrl = jasmine.createSpy("Augment Controller Service Spy");
    _overlay = scope.$new(true);
    _overlay.name = name = "testoverlayID";
    scope._parent = _parent = scope.$new(true);
    var locals = {
      $scope: scope,
      $element: element,
      $attrs: attrs,  
      transition: transService,
      augmentController: augmentCtrl
    }
    spyOn(scope, "$new").andReturn(_overlay);
    ctrl = injector.instantiate(OverlayDirectiveCtrl, locals);
    ctrl.init();
    // // Custom matchers
    this.addMatchers({
        toHaveBeenCalledWithAndTest: toHaveBeenCalledWithAndTest
      });
  });
  
  it("should instanciate OverlayDirectiveCtrl", function() {
    expect(ctrl).not.toBeNull();
    expect(ctrl).toBeDefined();
  });
  
  it("should set the required css formatting", function() {
    var el,
        html;
    el = angular.element(document.createElement("div"));
    el.append(element);
    html = el.html();
    expect(html).toMatch(/width: 100%/i);
    expect(html).toMatch(/height: 100%/i);
    expect(html).toMatch(/z-index: 100/i);
    expect(html).toMatch(/top: 0px/i);
    expect(html).toMatch(/left: 0px/i);
    expect(html).toMatch(/overflow(-x)?: hidden/i);
    expect(html).toMatch(/overflow(-y)?: hidden/i);
    expect(html).toMatch(/position: absolute/i);
  });
  
  it("should configure the parent scope with a Registry and overlay getter, once", function() {
    var reg = _parent.overlay_register,
        mock = {mock: "scope"};
    expect(_parent.overlay).toEqual(jasmine.any(Function));
    expect(reg.name).toEqual("Overlay Register");
    reg.add("test", mock);
    expect(reg.contains("test")).toBeTruthy();
    expect(reg.get("test")).toEqual(mock);
    reg.clear();
    expect(reg.ids).toEqual([]);
    expect(reg.by_id).toEqual({});
    expect(reg.contains("test")).toBeFalsy();
    _parent.overlay_register.value = "not_clobbered";
    ctrl.init();
    expect(_parent.overlay_register.value).toEqual("not_clobbered");
  });
  
  it("should register it", function() {
    spyOn(_parent.overlay_register, "add");
    ctrl.init();
    expect(_parent.overlay_register.add).toHaveBeenCalledWith(_overlay.name, _overlay);
  });
  
  describe("overlay control", function() {
    var reg;
    beforeEach(function() {
      reg = _parent.overlay_register;
    });
    
    it("should provide access to this overlay scope", function() {
      var mock = {mock: "scope"}
      expect(_parent.overlay()).toEqual(_overlay);
      reg.add("other", mock);
      expect(_parent.overlay("other")).toEqual(mock);
    });
    
    it("should provide access to the current overlay scope by default", function() {
      var mock1 = {mock1: "scope"},
          mock2 = {mock2: "scope"};
      reg.add("test1", mock1);
      reg.add("test2", mock2);
      _parent.currentOverlay = "test2";
      expect(_parent.overlay()).toEqual(mock2);
      _parent.currentOverlay = "test_fail";
      expect(function(){_parent.overlay();}).toThrow("The current overlay value is not a registered overlay name");
    });
    
    it("should throw an error when the overlay name doesnt exist", function() {
      expect(function(){_parent.overlay("FAIL")}).toThrow("Overlay with name'FAIL' not found");
    });
  });
  
  it("should have its layout scope as a property of the contorller instance", function() {
    expect(ctrl.layoutScope).toEqual(_overlay);
  });
  
  it("should augment the controller", function() {
    expect(augmentCtrl).toHaveBeenCalledWith( "SomeController",
                                              ctrl,
                                              { $scope: scope, 
                                                $element: element, 
                                                $attrs: attrs, 
                                                $trans: transition });
  });
});

describe('anOverlayDirective', function() {
  
  beforeEach(module('flLayout'));
  
  it("should be hidden by default", function() {
    inject(function($compile, $rootScope) {
      var element = $compile('<a-layout><an-overlay>message</an-overlay></a-layout>')($rootScope);
      $rootScope.$digest();
      expect(element.text()).toEqual('');
    });
  });
  
  it('should add and compile its content when displayed', function() {
    inject(function($compile, $rootScope) {
      var element = $compile('<a-layout><an-overlay>{{message}}</an-overlay></a-layout>')($rootScope);
      $rootScope.message = "Hello World";
      $rootScope.$digest();
      expect(element.text()).toEqual('');
      element.scope().overlay().show();
      $rootScope.$digest();
      expect(element.text()).toEqual('Hello World');
    });
  });
  
  it('should add a _parent and _overlay property to the scope ', function() {
    inject(function($compile, $rootScope) {
      var element = $compile('<a-layout with-name="a"><an-overlay with-name="b">{{_parent.name}}|{{_overlay.name}}</an-overlay></a-layout>')($rootScope);
      $rootScope.$digest();
      element.scope().overlay().show();
      $rootScope.$digest();
      expect(element.text()).toEqual('a|b');
    });
  });
});
