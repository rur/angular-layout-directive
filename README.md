#Layout Component#
The Layout Component is a set of [Angular JS](http://angularjs.org) directives designed to makes it easier to control complex interactive UI in web applications. It effectively moves some of the container positioning, sizing and display responsibilities away from the browser and implements a JavaScript layer which is more customizable. 

The templating syntax is quite intuitive and has the following three tier structure:

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
This is the layout container. It displays multiple blocks and its job is to position those blocks in relation to each-other, resizing its own dimensions to accommodate. It does this using a reflow function which is triggered by changes in its blocks. 

**Extending it:** By default it is a very basic mimic of browser block flow. The key difference being that you can override the process providing your own implementation.

*Block tier*
------------
The layout block is also a container, it holds a screen. While multiple screens can be declared, typically it only displays one at a time. The job of its controller is to manage the display of its screens and the process of swapping between them. The blocks position, dimensions and display are relative to its layout container. These properties are managed at one end by its parent through the layout reflow function and the other by the screen directive which keeps its dimensions up to date and can trigger transition states.

**Extending it:** Augmenting the block controller is useful for configuring transition states, adding methods and properties to its scope which are available to the layout reflow function. Decorations on the controller are available to its screens.

*Screen tier*
-------------
The screen directive creates a scope which is a descendent through the chain from the root application scope and in turn is the scope from which all child scopes inherit. Its controller is added as a '_screen' property which is your application api to control the display.

	<a-block>
		<a-screen>
			<p>This is Screen 1</p>
			<a ng-click="_screen.show('screen2')">Switch to Screen 2</a>
		</a-screen>
		<a-screen with-name="screen2">
			<p>This is Screen 2</p>
		</a-screen>
	</a-block>

**Extending it:** Methods and properties added to the screen controller are available to your application through the '$scope._screen' property. The screen controller also has access to its block controller (after the linking function is called!!).

*Transition Service*
--------------------
The transition service allows Angular directive controllers to bind its scope properties to transitions which get applied to its element. It does this in such a way so that the implementation of the value changes on the actual element are delegated to a TransitionSuite object. TransitionSuites are really easy to create and use (checkout the source).

The transition api allows you to create an instance using a scope and an element, define bindings, setup transition states and trigger them.

	var trans = transition($scope, $element);
	trans.bind("height", "css-height");
	$scope.height = 40; // will fire the transtion suite which registers 'css-height' during the next $digest
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