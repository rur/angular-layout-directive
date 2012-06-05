'use strict';

/* jasmine specs for general scripts */


describe("scripts", function() {
  describe("array.indexOf", function() {
    var arr
    beforeEach(function() {
      arr = [1,2,3,4,5];
    });
    
    it("should find the index or return -1", function() {
      expect(arr.indexOf(1)).toEqual(0);
      expect(arr.indexOf(4)).toEqual(3);
      expect(arr.indexOf(10)).toEqual(-1);
      arr = ["1","2","3","4","5"]
      expect(arr.indexOf("1")).toEqual(0);
      expect(arr.indexOf("4")).toEqual(3);
      expect(arr.indexOf("10")).toEqual(-1);
    });
  });
});