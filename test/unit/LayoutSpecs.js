'use strict';

describe("LayoutSpec", function() {
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
 describe("validateAndTrim", function() {
    it("should pass some and fail others", function() {
      expect(validateAndTrim("abc")).toEqual("abc");
      expect(validateAndTrim(" abc ")).toEqual("abc");
      expect(validateAndTrim("a")).toEqual("a");
      expect(validateAndTrim("")).toBeFalsy();
      expect(validateAndTrim()).toBeFalsy();
      expect(validateAndTrim(123)).toBeFalsy();
      expect(validateAndTrim([])).toBeFalsy();
      expect(validateAndTrim({})).toBeFalsy();
      expect(validateAndTrim(function(){})).toBeFalsy();
    });
  });
  describe("getUniqueID", function() {
    var arr;
    beforeEach(function() {
      arr = ["a","b","c"];
    });
    it("should pass a valid id back", function() {
      expect(getUniqueID("test", arr)).toEqual("test");
    });
    it("should create a new uniqe id based upon prepend attribute", function() {
      expect(getUniqueID(null, arr, "some_")).toEqual("some_1");
    });
    it("should increment a collision", function() {
      expect(getUniqueID("a", arr, "some_")).toEqual("a1");
    });
  });
  describe("Registry class", function() {
    var reg;
    beforeEach(function() {
      reg = new Registry("Test");
    });
    
    it("should create a new Registry object", function() {
      expect(reg).toBeDefined();
      expect(reg).not.toBeNull();
    });
    
    it("should have all the methods and properties it needs", function() {
      expect(reg.name).toEqual("Test");
      expect(reg.ids).toEqual(jasmine.any(Array));
      expect(reg.by_id).toEqual(jasmine.any(Object));
      expect(reg.clear).toEqual(jasmine.any(Function));
      expect(reg.contains).toEqual(jasmine.any(Function));
      expect(reg.add).toEqual(jasmine.any(Function));
      expect(reg.get).toEqual(jasmine.any(Function));
      expect(reg.first).toEqual(jasmine.any(Function));
    });

    it("should manage registered values and keys", function() {
      var mock = {mock: "testvalue"}
      reg.add("test", mock);
      expect(reg.contains("test")).toBeTruthy();
      expect(reg.get("test")).toEqual(mock);
      expect(reg.first()).toEqual(mock);
      reg.clear();
      expect(reg.ids).toEqual([]);
      expect(reg.by_id).toEqual({});
    });
  });
  describe("trim", function() {
    it("should trim and return a string", function() {
      expect(trim(" target ")).toEqual("target");
      expect(trim(" target")).toEqual("target");
      expect(trim("target ")).toEqual("target");
    });
  });
  describe("isValidNum", function() {
    it("should validate a number", function() {
      expect(isValidNum(1)).toBeTruthy();
      expect(isValidNum("1")).toBeTruthy();
      expect(isValidNum("1.6")).toBeTruthy();
      expect(isValidNum("1.6%")).toBeFalsy();
      expect(isValidNum(true)).toBeFalsy();
      expect(isValidNum([])).toBeFalsy();
      expect(isValidNum({})).toBeFalsy();
      expect(isValidNum()).toBeFalsy();
      expect(isValidNum(null)).toBeFalsy();
    });
  });
  describe("isValidNumString", function() {
    it("should validate a value", function() {
      expect(isValidNumString(1)).toBeTruthy();
      expect(isValidNumString("1")).toBeTruthy();
      expect(isValidNumString(true)).toBeFalsy();
      expect(isValidNumString([])).toBeFalsy();
      expect(isValidNumString({})).toBeFalsy();
      expect(isValidNumString()).toBeFalsy();
      expect(isValidNumString(null)).toBeFalsy();
      expect(isValidNumString("")).toBeTruthy();
      expect(isValidNumString("asdf")).toBeTruthy();
    });
  });
});