'use strict';

/**
 * BlockDirectiveCtrl specs
 * 
 */
  describe("BlockDirectiveCtrl", function() {
    var scope,
        element,
        attrs,
        transService,
        transition,
        augmentCtrl,
        injector,
        ctrl, 
        reflowSpy;
        
    beforeEach(function(){
      inject(function($rootScope, $injector) {
        scope = $rootScope.$new();
        injector = $injector;
      });
      transition = jasmine.createSpyObj("Transition Spy", ["state", "bind", "addSuite"]);
      transition.state.config = jasmine.createSpy("Transition State Config Spy");
      transService = jasmine.createSpy("Tansition Service Spy").andReturn(transition);
      attrs = {withController: "SomeController"};
      augmentCtrl = jasmine.createSpy("Augment Controller Service Spy");
      element = angular.element(document.createElement("div"));
      var locals = {
        $scope: scope,
        $element: element,
        $attrs: attrs,  
        transition: transService,
        augmentController: augmentCtrl
      }
      spyOn(scope, "$watch").andCallThrough();
      ctrl = injector.instantiate(BlockDirectiveCtrl, locals);
      ctrl.init();
    });
  
    it("should instanciate the BlockDirectiveCtrl", function() {
      expect(ctrl).not.toBeNull();
      expect(ctrl).toBeDefined();
    });
    
    it("should provide access to its scope", function() {
      expect(ctrl.layoutScope).toEqual(scope);
    });
    
    it("should add reflow watchers for dimensions", function() {
      expect(scope.$watch.argsForCall[0][0]).toEqual("calculateHeight()");
      expect(scope.$watch.argsForCall[1][0]).toEqual("calculateWidth()");
      spyOn(ctrl, "reflow");
      scope.$digest();
      expect(ctrl.reflow).toHaveBeenCalledWith();
      expect(ctrl.reflow.callCount).toBe(2);
      scope.$digest();
      scope.height = 200;
      scope.height = 300;
      scope.$digest();
      expect(ctrl.reflow.callCount).toBe(3);
      scope.height = 200;
      scope.width = 300;
      scope.$digest();
      expect(ctrl.reflow.callCount).toBe(5);
    });
      
    it("should create and configure the transition", function() {
      expect(transService).toHaveBeenCalledWith(scope, element);
      expect(ctrl.transition).toEqual(transition);
      expect(transition.bind).toHaveBeenCalledWith("height", "css-height");
      expect(transition.state.config).toHaveBeenCalledWith("init", {height: 0});
    });
      
    it("should set the required css formatting", function() {
      // hack to get IE7 to play nice
      var el,
          html;
      el = angular.element(document.createElement("div"));
      el.append(element);
      html = el.html();
      expect(html).toMatch(/width: 100%/i);
      expect(html).toMatch(/position: absolute/i);
      expect(html).toMatch(/overflow(-x)?: hidden/i);
      expect(html).toMatch(/overflow(-y)?: hidden/i);
    });
  
    it("should augment the controller", function() {
     expect(augmentCtrl).toHaveBeenCalledWith( "SomeController",
                                               ctrl,
                                               { $scope: scope, 
                                                 $element: element, 
                                                 $attrs: attrs, 
                                                 $trans: transition });
    });
  
    it("should add a child returning an id", function() {
      var child = scope.$new(true),
          id;
      id = ctrl.addChild(child);
      expect(id).toEqual("child_1");
      expect(scope.children.indexOf(child)).toEqual(0);
      child = scope.$new(true);
      id = ctrl.addChild(child, "testID");
      expect(id).toEqual("testID");
      expect(scope.children.indexOf(child)).toEqual(1);
      expect(scope.childrenByName[id]).toEqual(child);
    });
  
    it("should add and remove a reflow watcher", function() {
      expect(function(){ctrl.addReflowWatcher()}).toThrow("You can only add a string expression as a reflow watcher");
      scope.$digest();
      spyOn(ctrl, "reflow");
      ctrl.addReflowWatcher("test");
      scope.$digest();
      expect(ctrl.reflow).toHaveBeenCalled();
      scope.$digest();
      scope.test = 123;
      scope.$digest();
      expect(ctrl.reflow.callCount).toEqual(2);
      // remove
      ctrl.removeReflowWatcher("test");
      scope.test = 456;
      scope.$digest();
      expect(ctrl.reflow.callCount).toEqual(2);
    });
    
    it("should have a default layout function", function() {
      var screens = [],
           reflow = ctrl.defaultLayout();
       for (var i=0; i < 5; i++) {
         var screen = jasmine.createSpyObj("screen Spy "+i, ["calculateWidth", "calculateHeight"]);
         screen.calculateWidth.andReturn((i+1)*10);
         screen.calculateHeight.andReturn(100);
         screens.push(screen);
       };
       reflow(screens, scope);
       expect(scope.width).toEqual(50);
       expect(scope.height).toEqual(500);
    });
    
    it("should initialize setting the init transition state and the height reflow watcher", function() {
      expect(transition.state).toHaveBeenCalledWith("init");
    });
    
    it("should add a calculate width and height function to the scope", function() {
      scope.width = 150;
      scope.height = 200;
      expect(scope.calculateHeight()).toEqual(200);
      expect(scope.calculateWidth()).toEqual(150);
    });
    
    it("should have a super object with a backup reference to its methods", function() {
      expect(ctrl._super.defaultLayout).toEqual(ctrl.defaultLayout);
    });
  });
  
  describe('aBlockDirective', function() {
    
    beforeEach(module('flLayout'));
    
    it('should transclude contents', function() {
      inject(function($compile, $rootScope) {
        var element = $compile('<a-layout><a-block>{{message}}</a-block></a-layout>')($rootScope),
            element2 = $compile('<div a-layout><div a-block>{{message}}</div></div>')($rootScope);
        $rootScope.message = "Hello World";
        $rootScope.$digest();
        expect(element.text()).toEqual('Hello World');
        expect(element2.text()).toEqual('Hello World');
      });
    });
  });
  