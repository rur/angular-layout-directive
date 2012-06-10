'use strict';

/**
  * ScreenDirectiveCtrl Specs
  * 
  */
 describe("ScreenDirectiveCtrl", function() {
   var  scope,
        ctrl,
        attrs,
        element, 
        transService,
        transition,
        augmentCtrl,
        injector,
        _screen, 
        _block, 
        name;
   beforeEach(function() {
     inject(function($injector) {
       scope = jasmine.createSpyObj("Root Scope Spy", ["$new"]);
       injector = $injector;
     });
     attrs = {withController: "SomeController"};
     element = angular.element(document.createElement("div"));
     transition = jasmine.createSpyObj("Transition Spy", ["state", "bind", "addSuite"]);
     transition.state.config = jasmine.createSpy("Transition State Config Spy");
     transService = jasmine.createSpy("Tansition Service Spy").andReturn(transition);
     augmentCtrl = jasmine.createSpy("Augment Controller Service Spy");
     _screen = jasmine.createSpyObj("Screen Layout Scope", ["$watch", "$broadcast"]);
     _screen.name = name = "testScreenID";
     _screen.height = 300;
     scope._block = _block = {mock: "Block"};
     var locals = {
       $scope: scope,
       $element: element,
       $attrs: attrs,  
       transition: transService,
       augmentController: augmentCtrl
     }
     scope.$new.andReturn(_screen);
     scope._screen = _screen;
     ctrl = injector.instantiate(ScreenDirectiveCtrl, locals);
     ctrl.init();
     // // Custom matchers
     // this matcher allows you to pass a function which is called on its matching argument
     this.addMatchers({
         toHaveBeenCalledWithAndTest: toHaveBeenCalledWithAndTest
       });
   });
   
   it("should instanciate the ScreenDirectiveCtrl", function() {
     expect(ctrl).not.toBeNull();
     expect(ctrl).toBeDefined();
   });
   
   it("should set the required css formatting", function() {
      // hack to get test to pass IE7
      var el,
          html;
      el = angular.element(document.createElement("div"));
      el.append(element);
      html = el.html();
      expect(html).toMatch(/width: 100%/i);
      expect(html).toMatch(/display: block/i);
      expect(html).toMatch(/position: absolute/i);
    });
    
    it("should override calculate height and width on the layout scope", function() {
      _screen.height = 123;
      _screen.width = 456;
      expect(_screen.calculateHeight()).toEqual(0);
      expect(_screen.calculateWidth()).toEqual(0);
      spyOn(_screen, "displaying").andReturn(true);
      expect(_screen.calculateHeight()).toEqual(123);
      expect(_screen.calculateWidth()).toEqual(456);
    });
    
    it("should implement a displaying method on the layout scope", function() {
      expect(_screen.displaying()).toBeFalsy();
      _block.currentScreen = name;
      expect(_screen.displaying()).toBeTruthy();
      _block.currentScreen = "somethingElse";
      expect(_screen.displaying()).toBeFalsy();
    });
    
    it("should add a show method to the screen api", function() {
      expect(angular.isFunction(scope._screen.show)).toBeTruthy();
      _screen.show();
      expect(_block.currentScreen).toEqual(name)
      _screen.show("someOtherID");
      expect(_block.currentScreen).toEqual("someOtherID");
    });
    
    it("should add a hide method to the screen api", function() {
      expect(angular.isFunction(scope._screen.hide)).toBeTruthy();
      _screen.show();
      expect(_block.currentScreen).toEqual(name)
      _screen.hide();
      expect(_block.currentScreen).toBeNull();
    });
    
    it("should augment the controller", function() {
      var _blk = {mock: "Block"},
          _lyt = {mock: "layout"};
       ctrl.init(_blk, _lyt);
      expect(augmentCtrl).toHaveBeenCalledWith( "SomeController",
                                                ctrl,
                                                {  $scope: scope, 
                                                   $element: element, 
                                                   $attrs: attrs, 
                                                   _trans: transition,
                                                   _screen: _screen,
                                                   _block: _blk,
                                                   _layout: _lyt} );
    });
    
     it("should dispatch 'init' event from the layoutScope after the init function has been called", function() {
       expect(_screen.$broadcast).toHaveBeenCalledWith("init");
     });
 });
 
 describe('aScreenDirective', function() {
   
   beforeEach(module('flLayout'));
   
   it('should keep link with root scope ', function() {
     inject(function($compile, $rootScope) {
       var element = $compile('<a-layout><a-block><a-screen>{{message}}</a-screen></a-block></a-layout>')($rootScope);
       var element2 = $compile('<div a-layout><div a-block><div a-screen>{{message}}</div></div></div>')($rootScope);
       $rootScope.message = "Hello World";
       $rootScope.$digest();
       expect(element.text()).toEqual('Hello World');
       expect(element2.text()).toEqual('Hello World');
     });
   });
   
   it('should add a _screen, _block, and _layout property to the scope ', function() {
     inject(function($compile, $rootScope) {
       var element = $compile('<a-layout with-name="a"><a-block with-name="b"><a-screen with-name="c">{{_layout.name}}|{{_block.name}}|{{_screen.name}}</a-screen></a-block></a-layout>')($rootScope);
       $rootScope.$digest();
       expect(element.text()).toEqual('a|b|c');
     });
   });
 });
 
 