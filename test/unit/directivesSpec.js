'use strict';

/* jasmine specs for directives go here */

describe('directives', function() {
  beforeEach(module('myApp'));
  
  
  describe('aLayout', function() {
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
  
  
  describe('aBlock', function() {
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
  
  
  describe('aScreen', function() {
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
});
