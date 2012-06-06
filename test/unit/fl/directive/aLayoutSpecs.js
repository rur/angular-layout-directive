'use strict';

describe("LayoutDirectiveCtrl", function() {
  var ctrl, 
      scope,
      element,
      attrs,
      transService,
      transition,
      augmentCtrl,
      injector; 
      
   beforeEach(function(){
     inject(function($rootScope, $injector) {
       scope = $rootScope.$new();
       injector = $injector;
       transition = jasmine.createSpyObj("Transition Spy", ["state", "bind", "addSuite"]);
       transition.state.config = jasmine.createSpy("Transition State Config Spy");
       transService = jasmine.createSpy("Tansition Service Spy").andReturn(transition);
       attrs = {withController: "SomeController"};
       augmentCtrl = jasmine.createSpy("Augment Controller Service Spy");
       // document.createElement needed for IE7, for some reason
       element = angular.element(document.createElement("div"));
     });
     
     var locals = {
       $scope: scope,
       $element: element,
       $attrs: attrs,  
       transition: transService,
       augmentController: augmentCtrl
     }
     ctrl = injector.instantiate(LayoutDirectiveCtrl, locals);
     ctrl.init();
   });
  
  
  it("should instanciate the LayoutDirectiveCtrl", function() {
    expect(ctrl).not.toBeNull();
    expect(ctrl).toBeDefined();
  });
  
  it("should create and configure the transition object", function() {
    expect(transService).toHaveBeenCalledWith(scope, element);
    expect(ctrl.transition).toEqual(transition);
    expect(transition.state.config).toHaveBeenCalledWith("init", {height: 0});
    expect(transition.bind).toHaveBeenCalledWith("height", "css-height" );
  });
  
  it("should set the required css formatting", function() {
    // hack to get IE7 to play nice
    var el,
        html;
    el = angular.element(document.createElement("div"));
    el.append(element);
    html = el.html();
    expect(html).toMatch(/width: 100%/i);
    expect(html).toMatch(/position: relative/i);
  });
  
  it("should augment the controller", function() {
    expect(augmentCtrl).toHaveBeenCalledWith( "SomeController",
                                              ctrl,
                                              { $scope: scope, 
                                                $element: element, 
                                                $attrs: attrs, 
                                                $trans: transition });
  });
    
    it("should add a child scope", function() {
      var block1 = scope.$new(true),
          block2 = scope.$new(true);
      ctrl.addChild(block1);
      expect(scope.children.indexOf(block1)).toEqual(0);
      ctrl.addChild(block2);
      expect(scope.children.indexOf(block2)).toEqual(1);
    });
  
  it("should have a default reflow function which lays out a set of blocks one after another", function() {
     var blocks = [],
         reflow = ctrl.defaultLayout();
     for (var i=0; i < 5; i++) {
       var block = jasmine.createSpyObj("Block Spy "+i, ["calculateWidth", "calculateHeight"]);
       block.calculateWidth.andReturn((i+1)*10);
       block.calculateHeight.andReturn(100);
       blocks.push(block);
     };
     reflow(blocks, scope);
     expect(scope.height).toEqual(100*blocks.length);
     expect(scope.width).toEqual(10*blocks.length);
   });
       
   it("should set the layout function", function() {
      var blks = [],
          newFlow = function(blocks, scope){
            angular.forEach(blocks, function(block, ind){
              block.height = 123;
            });
            scope.abc = 123;
          };
      for (var i=0; i < 3; i++) {
        blks.push(scope.$new(true));
        ctrl.addChild(blks[i]);
      };
      ctrl.layout(newFlow);
      ctrl.layout();
      scope.$digest();
      angular.forEach(blks, function(blk){
        expect(blk.height).toEqual(123)
      })
      expect(scope.abc).toEqual(123);
    });
    
   it("should only trigger a reflow once despite multiple calls", function() {
     var flowSpy = jasmine.createSpy("Reflow Spy");
     ctrl.layout(flowSpy);
     ctrl.layout();
     ctrl.layout();
     ctrl.layout();
     scope.$digest();
     scope.$digest();
     expect(flowSpy.callCount).toEqual(1);
   });
   
   it("should have a super object with instance methods", function() {
     expect(ctrl._super.defaultLayout).toEqual(ctrl.defaultLayout);
   });
});

describe('aLayoutDirective', function() {
  
 beforeEach(module('flLayout'));
 
 it('should transclude contents', function() {
   inject(function($compile, $rootScope) {
     var element = $compile('<a-layout>{{message}}</a-layout>')($rootScope),
         element2 = $compile('<div a-layout>{{message}}</div>')($rootScope);
     $rootScope.message = "Hello World";
     $rootScope.$digest();
     expect(element.text()).toEqual('Hello World');
     expect(element2.text()).toEqual('Hello World');
   });
 });
});
