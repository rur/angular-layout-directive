'use strict';

/**
 * OverlayPanelDirectiveCtrl Specs
 * 
 */
describe("OverlayPanelDirectiveCtrl", function() {
  var scope,
      ctrl,
      element,
      attrs,
      injector,
      transition,
      transService,
      augmentCtrl, 
      _panel, 
      _overlay;
  
  beforeEach(function() {
    inject(function($rootScope, $injector) {
      scope = $rootScope.$new();
      injector = $injector;
    });
    attrs = {withController: "SomeController", anOverlayPanel: "left"};
    element = angular.element(document.createElement("div"));
    transition = jasmine.createSpyObj("Transition Spy", ["state", "bind", "addSuite"]);
    transition.state.config = jasmine.createSpy("Transition State Config Spy");
    transService = jasmine.createSpy("Tansition Service Spy").andReturn(transition);
    augmentCtrl = jasmine.createSpy("Augment Controller Service Spy");
    // 
    _overlay = scope.$new(true);
    scope._overlay = _overlay;
    _panel = scope.$new(true);
    spyOn(scope, "$new").andReturn(_panel);
    var locals = {
      $scope: scope,
      $element: element,
      $attrs: attrs,
      transition: transService,
      augmentController: augmentCtrl
    }
    ctrl = injector.instantiate(OverlayPanelDirectiveCtrl, locals);
  });
  
  it("should instanciate overlay panel directive controller", function() {
    expect(ctrl).not.toBeNull();
    expect(ctrl).toBeDefined();
  });
  
  it("should set the required css formatting", function() {
    var el,
        html;
    el = angular.element(document.createElement("div"));
    el.append(element);
    html = el.html();
    expect(html).toMatch(/position: absolute/i);
    expect(html).toMatch(/display: block/i);
  });
  
  it("should retreive the align value from the attribute", function() {
    expect(_panel.align).toEqual("left");
  });
  
  describe("panel scope resposition", function() {
    beforeEach(function() {
      _panel.width = 100;
      _panel.height = 100;
      _overlay.width = 200;
      _overlay.height = 200;
    });
    
    it("should have a method named reposition", function() {
      expect(angular.isFunction(_panel.reposition)).toBeTruthy();
    });
    
    it("should center the panel", function() {
      _panel.align = "center";
      _panel.reposition();
      expect(_panel.x).toEqual(50);
      expect(_panel.y).toEqual(50);
    });
    
    it("should align left", function() {
      _panel.align = "left";
      _panel.reposition();
      expect(_panel.x).toEqual(0);
      expect(_panel.y).toEqual(50);
    });
    
    it("should align right", function() {
      _panel.align = "right";
       _panel.reposition();
       expect(_panel.x).toEqual(100);
       expect(_panel.y).toEqual(50);        
    });
    
    it("should alignt top", function() {
      _panel.align = "top";
      _panel.reposition();
      expect(_panel.x).toEqual(50);
      expect(_panel.y).toEqual(0);
    });
    
    it("should align bottom", function() {
      _panel.align = "bottom";
      _panel.reposition();
      expect(_panel.x).toEqual(50);
      expect(_panel.y).toEqual(100);
    });
    
    it("should align top left", function() {
      _panel.align = "topleft";
      _panel.reposition();
      expect(_panel.x).toEqual(0);
      expect(_panel.y).toEqual(0);
    });
    
    it("should align top right", function() {
      _panel.align = "topright";
      _panel.reposition();
      expect(_panel.x).toEqual(100);
      expect(_panel.y).toEqual(0);
    });
    
    it("should align bottom left", function() {
      _panel.align = "bottomleft";
      _panel.reposition();
      expect(_panel.x).toEqual(0);
      expect(_panel.y).toEqual(100);
    });
    
    it("should align top right", function() {
      _panel.align = "bottomright";
      _panel.reposition();
      expect(_panel.x).toEqual(100);
      expect(_panel.y).toEqual(100);
    });
  });
  
  it("should augment the controller", function() {
    ctrl.init(_overlay);
    expect(augmentCtrl).toHaveBeenCalledWith( "SomeController",
                                              ctrl,
                                              { $scope: scope, 
                                                $element: element, 
                                                $attrs: attrs, 
                                                _trans: transition,
                                                _panel: _panel,
                                                _overlay: _overlay
                                                });
  });
});


describe('anOverlayPanelDirective', function() {
  it("should add a _panel property to its scope within its overlay", function(){
    var element
    module('flLayout');
    inject(function($compile, $rootScope) {
      element = $compile('<a-layout with-name="a"><an-overlay with-name="b"><div an-overlay-panel with-name="c">{{_parent.name}}|{{_overlay.name}}|{{_panel.name}}</div></an-overlay></a-layout>')($rootScope);
      $rootScope.$digest();
      element.scope().overlay().show();
      $rootScope.$digest();
      expect(element.text()).toEqual('a|b|c');
    });
  });
});
