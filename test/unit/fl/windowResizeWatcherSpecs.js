'use strict';


describe("windowResizeWatcher", function() {
  beforeEach(function() {
    module("flLayout")
  });
  it("should call $apply on root scope when the window dispatches resize event", inject(function($window, $rootScope, $timeout, windowResizeWatcher){
    windowResizeWatcher();
    spyOn($rootScope, "$apply");
    $($window).trigger("resize");
    expect($rootScope.$apply).not.toHaveBeenCalled();
    $timeout.flush();
    expect($rootScope.$apply).toHaveBeenCalled();
  }));
  it("should call apply only once", inject(function($window, $rootScope, $timeout, windowResizeWatcher){
    var arg;
    windowResizeWatcher();
    spyOn($rootScope, "$apply")
    $($window).trigger("resize");
    expect($rootScope.$apply).not.toHaveBeenCalled();
    $timeout.flush(); 
    expect($rootScope.$apply.callCount).toBe(1)
    windowResizeWatcher();
    windowResizeWatcher();
    $($window).trigger("resize");
    $($window).trigger("resize");
    windowResizeWatcher(200);
    $($window).trigger("resize");
    $($window).trigger("resize");
    $timeout.flush();
    expect($rootScope.$apply.callCount).toBe(2);
  }));
});