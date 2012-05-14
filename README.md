The layout directive has a number of features that are intended to make programatic control of application display easier. 

**Block Positioning Control**
The Layout/Block setup allows application level control of layout by creating an abstraction layer between Angular controllers and the positioning of blocks in the browser window. A block scope is isolated from the Angular app and so has only its own layout related properties. The block directive knows how to apply these to its related DOM element. The layout directive controller has one job, to synchronize the properties of its containing blocks using a layout loop. The behavior of both of these directives can be overridden and augmented using custom layout & block controllers in which you can override the loop add your own properties and methods to blocks.

Out of the box it minimally mimics the layout flow of a browser. Layout reflows are triggered by changes in the application model using scope#$watch.

**Transitions**
A transitioning directive called beSlidey can teach the block directive new ways of applying layout properties to its own DOM element. The idea is to create a more behavioral approach to application animations and transitions. This is just an idea right now, I'll see how it works out.

**Screens**
Each defined block can contain multiple screen definitions in the template. However in the view it can display only one at a time. A new App scope is created in the screens directive and a _screen property is added. This provides application level control over the swapping/hiding of screens within that scope and it's children. 

	<a-block>
		<a-screen>
			<p>This is Screen 1</p>
			<a ng-click="_screen.show('screen2')">Switch to Screen 2</a>
		</a-screen>
		<a-screen with-name="screen2">
			<p>This is Screen 2</p>
		</a-screen>
	</a-block>

