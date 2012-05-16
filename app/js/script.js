( function(){
  if(!Array.prototype.indexOf){
    Array.prototype.indexOf = function (object, start) {
      for (var i=(start|0); i < this.length; i++) {
        if(this[i] == object) return i;
        return -1;
      };
    }
  }
})();