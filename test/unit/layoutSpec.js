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
    // document.createElement needed for IE7
    element = angular.element(document.createElement("div"));
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
    });
    
    it("should set the required css formatting", function() {
      // hack to get test to pass IE7
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
    });
    
    it("should set the required css formatting", function() {
      // hack to get test to pass IE7
      var el,
          html;
      el = angular.element(document.createElement("div"));
      el.append(element);
      html = el.html();
      expect(html).toMatch(/width: 100%/i);
      expect(html).toMatch(/position: absolute/i);
    });
    
    it("should augment the controller", function() {
      expect(augmentCtrl).toHaveBeenCalledWith( "SomeController",
                                                ctrl,
                                                { $scope: scope, 
                                                  $element: element, 
                                                  $attrs: attrs, 
                                                  $trans: transition });
    });
    
    it("should register a screen id returning a unique key", function() {
      var id = ctrl.registerScreenID();
      expect(id).not.toBeNull();
      expect(id).toBeDefined();
      expect(ctrl.getScreenIndex(id)).toEqual(0);
      id = ctrl.registerScreenID("abc");
      expect(ctrl.getScreenIndex(id)).toEqual(1);
      id = ctrl.registerScreenID("abc");
      expect(ctrl.getScreenIndex(id)).toEqual(2);
      id = ctrl.registerScreenID();
      expect(id).toEqual("3");
      expect(ctrl.getScreenIndex(id)).toEqual(3);
      id = ctrl.registerScreenID("abc");
      expect(id).toEqual("abc_2");
      id = ctrl.registerScreenID("0");
      expect(id).toEqual("0_1");
      expect(ctrl.getScreenIndex(id)).toEqual(5);
    });
    
    it("should set the currentScreen", function() {
      var id = "SomeScreenID";
      expect(function(){ ctrl.showScreen(id);  })
        .toThrow("Cannot show screen '"+id+"' there is no screen registered with that id");
      id = ctrl.registerScreenID(id);
      ctrl.showScreen(id);
      expect(scope.currentScreen).toEqual(id);
    });
    
    it("should provide the id at a delta", function() {
      var ids = [];
      for (var i=0; i < 10; i++) {
        ids.push(ctrl.registerScreenID());
      };
      expect(ctrl.deltaID(2)).toEqual(ids[2]);
      expect(ctrl.deltaID(2,ids[2])).toEqual(ids[4]);
      expect(ctrl.deltaID(4345,ids[5])).toEqual(ids[0]);
      expect(ctrl.deltaID(-4346,ids[5])).toEqual(ids[9]);
      expect(function(){ctrl.deltaID(0, "missing");}).toThrow("Screen ID 'missing' not found, cannot retreive delta ID");
    });
    
    it("should set screenHeight", function() {
      ctrl.screenHeight(200);
      expect(scope.height).toEqual(200);
    });
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