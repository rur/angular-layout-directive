'use strict';

// indexOf IE Fix
if(!Array.indexOf){
    Array.prototype.indexOf = function(obj){
        for(var i=0; i<this.length; i++){
            if(this[i]==obj){
                return i;
            }
        }
        return -1;
    }
}

// utils
function Registry (name) {
  this.name = name;
  this.ids = []; 
  this.by_id = {};
}

Registry.prototype = {
  clear: function(){
    this.ids = [];
    this.by_id = {};
  },
  contains: function(name){
    return this.by_id.hasOwnProperty(name);
  },
  add: function(name, value){
    this.ids.push(name);
    this.by_id[name] = value;
  },
  get: function(name){
    return this.by_id[name];
  }, 
  first: function(){
    return this.by_id[this.ids[0]];
  }
}

function trim(stringToTrim) {
	return stringToTrim.replace(/^\s+|\s+$/g,"");
}

// utils
function isValidNumString (val) {
  return (angular.isString(val) || isValidNum(val));
}
function isValidNum (val) {
  return val != null && typeof val != "boolean" && !angular.isArray(val) && angular.isNumber(Number(val)) && !isNaN(val);
}


