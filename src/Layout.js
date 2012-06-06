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

/**
  * Utility function for obtaining a unique id from a specified array of ids
  * 
  * @param {string} name The perferred name, it will be incremented if it is a dup
  * @param {array} collection The array of keys it needs to be unique within
  * @param {string optional} prepend The string to use to prepend a generated id
  * @return {string} an id which is unique within the collection received
  */
var getUniqueID = function(name, collection, prepend){
   var step = 1, 
       base = name;
   if(!angular.isString(name = validateAndTrim(name))){
     base = prepend;
     name = base+(step++);
   }
   while(collection.indexOf(name) > -1){
     name = base+(step++);
   }
   return name;
 }
 
 /**
  * Makes sure a value is valid as an key for a hash
  * 
  * It must be a string, and when trimmed, it must be longer than 0
  * 
  * @param {string} id The string to make sure if valid
  * @return {string|boolean} If it is valid it will return a trimmed valid id, if validation failes it will return false
  */
var validateAndTrim = function (id) {
   if( !angular.isString(id) ) return false;
   id = trim(id)
   if( id.length == 0 ) return false;
   return id;
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


