#Under construction - Do not use#
I'm using this readme is more of a spec-sheet so some information may be out of date.

*some links*
--------------------
 - [Kitten Pound Demo](http://jsfiddle.net/rur_d/htwXa/)
 - [Compiled Source](http://fluid-src.appspot.com/angular-layout/1.0/fl_layout.js)
 - [Compiled Source Minified](http://fluid-src.appspot.com/angular-layout/1.0/fl_layout.min.js)


#Layout Component#
The Layout Component is a set of [Angular JS](http://angularjs.org) directives designed to makes it easier to control complex interactive UI in web applications. It effectively moves some of the container positioning, sizing and display responsibilities away from the browser and implements a JavaScript layer which is more customizable. 

The templating syntax has the following three tier structure:

	<a-layout>
		<a-block>
			<a-screen>
				...
			</a-screen>
		</a-block>
	</a-layout>

Each tier has its own role to play in managing the positioning, display and transitions of its contents. Generally speaking this is intended for use with the outer container structure of an entire application or widget, not granular UI elements.

*Layout Controllers*
--------------------
You can enhance and override the default behavior of each tier by creating a controller function which augments the directive controller. The markup syntax works like so:

	<a-layout with-controller="MyLayoutCtrl">
		<a-block with-controller="MyBlockCtrl">
			<a-screen with-controller="MyScreenCtrl">
				...

These can be applied to all three tiers and provides you with a hook to really customize the behavior of your layout. It also allows you to declare behavior in response to state changes in your application since these controllers are injected with service dependancies just like any other Angular JS controller.


*Layout tier*
-------------
This is the layout container. It displays multiple blocks and its job is to position those blocks in relation to each-other, resizing its own dimensions to accommodate. It does this using a layout function which is triggered by its child blocks. 


*Block tier*
------------
The role of the block directive is as a container for screens. It also has a layout function which it uses to update its own dimensions based upon its screens. As with the 'aLayout' directive controller you can override this layout method.


*Screen tier*
-------------
Multiple sibling screens can be defined side by side but by default only one is displayed at a time. The content of each 'a-screen' tag is treated as a template for that screen. It is added and removed from the DOM as needed. Similar to how ng-include works.

Unlike the previous two tiers, the aScreen Directive has two scopes. One new scope which is on the chain from the root application scope and in turn is the scope from which all children prototypically inherit. The other is a layout scope, isolated from the other which is used purely to manage display. The directive scope is provided with three properties which are accessible to itself and its children. The '\_layout', '\_block' and '\_screen' properties are references to the layout scope of each tier. This is your application api to trigger changes in the layout.

	<a-layout>
		<a-block>
			<a-screen>
				<p>This is Screen 1</p>
				<p><a ng-click="_screen.show('screen2')">Switch to Screen 2</a></p>
				<p>Current Screen = {{_block.currentScreen}}</p>
				<p>Layout Height = {{_layout.height}}</p>
			</a-screen>
			<a-screen with-name="screen2">
				<p>This is Screen 2</p>
			</a-screen>
		</a-block>
	</a-layout>


*Overlays*
-------------
Overlays work very similarly to screens, here are a few of the important differences:
 - it can be added as a child to any tier
 - its scope has two properties added instead of three: \_overlay and \_parent
 - it is not part of its parents layout reflow function buy default, it just fills whatever space is there
 - the first overlay will not display itself by default

	<an-overlay>
		<p><a ng-click="_overlay.hide()">X</a></p>
		...
	</an-overlay>

"\_parent" is a reference to it containers layout scope. This will be either a layout, block or screen. "\_overlay" is reference to its own isolated layout scope, similar to how screens work.

Overlays are controlled through the layout scope of its parent like so:

	<a-layout>
		<a-block>
			<a-screen>
				<p><a ng-click="_block.overlay().show()">Show block overlay</a></p>
			</a-screen>
			<an-overlay>
				<p><a ng-click="_overlay.hide()">X</a></p>
				...
			</an-overlay>
		</a-block>
	</a-layout>

Just like with screens, multiple sibling overlays can be defined but only one will display at a time.


*Overlay Panel*
-------------
Convenient directive for positioning a panel within an overlay. 

	<an-overlay>
		<div an-overlay-panel="center|left|right|top|bottom|topleft|topright|bottomleft|bottomright">
			...
		</div>
		...
	</an-overlay>

*Transition Service*
--------------------
The transition service allows Angular directive controllers to bind its scope properties to transitions which get applied to its element. It does this in such a way so that the implementation of the value changes on the actual element are delegated to a TransitionSuite object. TransitionSuites are really easy to create and use (checkout the source).

The transition api allows you to create an instance using a scope and an element, define bindings, setup transition states and trigger them.

	var trans = transition($scope, $element);
	trans.bind("height", "css-height");
	$scope.height = 40; // will fire the transtion suite which registers 'css-height ' during the next $digest
	trans.state.config("init", {height:100});
	funciton init(){ 
		trans.state("init"); // similar to $scope.height = 100;
	}

For much more information checkout the transition source code at ./app/js/services.js

*beSlidey Directive*
------------
beSlidey is a directive which takes advantage of the decoupling between the directives and the implementation of transitions. When declared on aLayout, aBlock or aScreen tag it replaces the standard css transition bindings with jQuery animate. The syntax is looks like this:

	<a-block be-slidey="height, y">
		<a-screen></a-screen>
	</a-block>

The attribute takes a comma delimitated list of the scope properties it should bind to. Now when the blocks $scope.height or $scope.y property is changed it will trigger an animation.

-----------------------
Pull down the repo to checkout the demos and source code if you want to get a better idea how it all works.

To compile from source move your terminal pointer to the project folder and call

	$ rake compile

