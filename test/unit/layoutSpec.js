'use strict';

/* Jasmine Specs for Layout controllers */ 

describe("layout component", function() {
  var scope,
      element,
      attrs,
      transService,
      transition,
      augmentCtrl,
      injector; 
  beforeEach(inject(function($rootScope, $injector) {
    scope = $rootScope.$new();
    injector = $injector;
    transition = jasmine.createSpyObj("Transition Spy", ["state", "bind", "addSuite"]);
    transition.state = jasmine.createSpyObj("Transition State Spy", ["config"])
    transService = jasmine.createSpy("Tansition Service Spy").andReturn(transition);
    attrs = {withController: "SomeController"};
    augmentCtrl = jasmine.createSpy("Augment Controller Service Spy");
    element = angular.element("<div></div>");
  }));
  
  describe("LayoutDirectiveCtrl", function() {
    var ctrl;
    beforeEach(function() {
      var locals = {
        $scope: scope,
        $element: element,
        $attrs: attrs,  
        transition: transService,
        augmentController: augmentCtrl
      }
      ctrl = injector.instantiate(LayoutDirectiveCtrl, locals);
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
      expect(element.attr("style")).toMatch(/width: 100%; position: absolute;/);
    });
    
    it("should augment the controller", function() {
      expect(augmentCtrl).toHaveBeenCalledWith( "SomeController",
                                                ctrl,
                                                { $scope: scope, 
                                                  $element: element, 
                                                  $attrs: attrs, 
                                                  $trans: transition });
    });
    
    it("should add and remove a block scopes keeping them in order", function() {
      var block1 = {block: 1},
          block2 = {block: 2};
      ctrl.addBlock(block1);
      expect(ctrl.indexOfBlock(block1)).toEqual(0);
      ctrl.removeBlock(block1);
      expect(ctrl.indexOfBlock(block1)).toEqual(-1);
      ctrl.addBlock(block1);
      ctrl.addBlockAt(block2, 0);
      expect(ctrl.indexOfBlock(block1)).toEqual(1);
      expect(ctrl.indexOfBlock(block2)).toEqual(0);
    });
    
    it("should have a default reflow function which lays out a set of blocks one after another", function() {
      var blocks = [],
          reflow = ctrl.getDefaultReflow();
      for (var i=0; i < 5; i++) {
        var block = {height: 100, width: (10*(i+1)) };
        blocks.push(block);
      };
      
      reflow(blocks, scope);
      angular.forEach(blocks, function(block, ind){
        expect(block.y).toEqual(100*ind);
      })
      
      expect(scope.height).toEqual(100*blocks.length);
      expect(scope.width).toEqual(10*blocks.length);
    });
    
    it("should set the reflow function and trigger a reflow", function() {
      var blks = [],
          newFlow = function(blocks, scope){
            angular.forEach(blocks, function(block, ind){
              block();
            });
            scope.abc = 123;
          };
      for (var i=0; i < 3; i++) {
        blks.push(jasmine.createSpy("Block spy #"+ (i+1)));
        ctrl.addBlock(blks[i]);
      };
      ctrl.setReflow(newFlow);
      ctrl.reflow();
      angular.forEach(blks, function(blk){
        expect(blk).toHaveBeenCalled();
      })
      expect(scope.abc).toEqual(123);
    });
  });
  describe("BlockDirectiveCtrl", function() {
    var ctrl;
    beforeEach(function() {
      var locals = {
        $scope: scope,
        $element: element,
        $attrs: attrs,  
        transition: transService,
        augmentController: augmentCtrl
      }
      ctrl = injector.instantiate(BlockDirectiveCtrl, locals);
    });
    
    it("should instanciate the BlockDirectiveCtrl", function() {
      expect(ctrl).not.toBeNull();
      expect(ctrl).toBeDefined();
    });
    
    it("should create and configure the transition", function() {
      expect(transService).toHaveBeenCalledWith(scope, element);
      expect(ctrl.transition).toEqual(transition);
      expect(transition.state.config).toHaveBeenCalledWith("init", {height: 0});
      expect(transition.bind).toHaveBeenCalledWith({ height: "css-height",
                                                     y: "css-y", 
                                                     opacity: "css-opacity" });
      expect(element.attr("style")).toMatch(/width: 100%; position: absolute;/);
    });
    
    it("should augment the controller", function() {
      expect(augmentCtrl).toHaveBeenCalledWith( "SomeController",
                                                ctrl,
                                                { $scope: scope, 
                                                  $element: element, 
                                                  $attrs: attrs, 
                                                  $trans: transition });
    });
    
    // it should register a screen id returning a unique key
    // it should set the currentScreen
    // it should provide the index of the screen id supplied
    // it should provide the id at a delta
    // it should set screenHeight
  });
  
  describe("ScreenDirectiveCtrl", function() {
    var ctrl;
    beforeEach(function() {
      var locals = {
        $scope: scope,
        $element: element,
        $attrs: attrs,  
        transition: transService,
        augmentController: augmentCtrl
      }
      ctrl = injector.instantiate(ScreenDirectiveCtrl, locals);
    });
    // it should instanciate the ScreenDirectiveCtrl
    // it should create and configure the transition
    // it should augment the controller
    // it should create and configure transitions
    // it should create an isolated scope for the screen api
    // it should add a show method to the screen api
    // it should add a hide method to the screen api
  });
});