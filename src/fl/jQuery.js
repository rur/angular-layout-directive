'use strict';

/**
 * The jQuery service exists to make it easier to test code that relies on jQuery
 * 
 * Rather than obtaining the instance of jQuery from the window directly it is simply
 * passed in as a dependency by the DI system
 * 
 * This is also useful for showing a meaningful failure when jquery is required by an applciation
 * but is not present
 */
function JQueryProvider () {
  this.$get = [ "$exceptionHandler", function($exceptionHandler){
    if(!window.jQuery) $exceptionHandler("jQuery is required by this application");
    return window.jQuery;
  }]
}

