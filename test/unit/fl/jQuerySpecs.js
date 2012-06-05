'use strict';

describe("jQuery Service", function() {
  beforeEach(function() {
    module("flLayout");
  });
  it("shoud get jQuery", inject(function($injector) {
    var jq = $injector.get('$jQuery');
    expect(jq).toEqual(jQuery);
  }));
});

