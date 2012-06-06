'use strict';


// Custom Matcher Function
var toHaveBeenCalledWithAndTest = function(){
  var spy = this.actual,
             expected = Array.prototype.slice.call(arguments),
             allArgs = spy.argsForCall,
             args,
             arg,
             match = false;
   for (var i=0; i < allArgs.length; i++) {
     args = allArgs[i];
     if(args.length == expected.length){
       for (var j=0; j < args.length; j++) {
         arg = args[j];
         if(angular.isFunction(expected[j])){
           match = (expected[j])(arg);
         } else {
           match = angular.equals(arg, expected[j]); 
         }
         if(!match) break;
       };
     }
     if(match) break;
   };
  this.message = function(){
            return "expected "+spy.identity+" to have been called with type "+expected+
                   " but it was called with the following: "+allArgs;
          }
  return match;
}

