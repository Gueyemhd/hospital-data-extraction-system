(function($) {
    
	// ------------------------------------------
	//  PRIVATE
	// ------------------------------------------
  
  function isEnable(type){
    return window.console && window.console.log && ( type == null ? true : enabled[type] );
  }
  
  function name2fn(name){
    var names = name.split(".");
    
    var func = window;
    $.each(names, function(i, n){
      func = func[n];
    });
    
    return func;
  }
  
  function reassign(name, fn){
    eval("window." + name + " = fn;");
  }
  
  var hookedList = {};
  function hooked(name){
    var fn = name2fn(name);
    hookedList[name] = fn;
  }
  
  function unhooked(name){
    hookedList[name] = null;
  }
  
  function fn(name){
    return hookedList[name];
  }
  
  function has(name){
    return hookedList[name] != null;
  }
  
  // ------------------------------------------
  //  PUBLIC
  // ------------------------------------------

  $.console = {};
  $.fn.console = {}; 
  
  // Convenient log function
  $.log = function() {
    if (isEnable("log")) {
      $.console.log.apply(this, arguments);
    }
  };
  
  // Convenient log function
  $.fn.log = function() {
    $.log(this);
    return this;
  }
  
  
  $.console.hook = function(name){
    
    var func = name2fn(name);
    
    if( typeof func == typeof {} ){
    
      var obj = func;
      for(var var_name in obj){
        if( typeof obj[var_name] == typeof function(){} ){
          $.console.hook(name + "." + var_name);
        }
      }
      return;
    
    } else if( !$.isFunction(func) ){
      
      return;
    
    } else if( !has(name) ){
      
      hooked(name);
      
      reassign(name, function(){
        if( isEnable("call") ){
          console.groupCollapsed("Call %s", name);
          console.log("with arguments %o", arguments);
          console.groupEnd();
        }
        
        var ret = func.apply(func, arguments);
        return ret;
      });
    }
  };
  
  $.console.unhook = function(name){
    
    var func = name2fn(name);
    
    if( typeof func == typeof {} ){
      var obj = func;
      
      for(var var_name in obj){
        if( typeof obj[var_name] == typeof function(){} ){
          $.console.unhook(name + "." + var_name);
        }
      }
      return;
    } else if( !$.isFunction(func) ){
      return;
    } else if( has(name) ){
      reassign(name, fn(name));
      unhooked(name);
    }
  };

  $.console.enable = function(type){
    if( type == null ){
      for(var i in enabled){
        enabled[i] = true;
      }
      return;
    }
    
    enabled[type] = true;
  };
  
  $.console.only = function(type){
    $.console.disable();
    $.console.enable(type);
  };
  
  $.console.disable = function(type){
    if(type == null){
      for(var i in enabled){
        enabled[i] = false;
      }
      return;
    }
    enabled[type] = false;
  };
  
  // JCMS Hack
  $.console.stacktrace = function(){
    if (window.printStackTrace){
      var trace = window.printStackTrace();
      for (var i = 0 ; i < trace.length ; i++){
        $.console.debug('[STACKTRACE] '+trace[i]);
      } 
    }
  }
  
  // ------------------------------------------
  //  Private Init
  // ------------------------------------------
  
  var fns = ["debug", "info", "log", "warn", "error", "assert", "group", "groupCollapsed", "groupEnd", "trace"];
  var enabled = { call: true };
  
  $.each(fns, function(i, fnName){
  
    enabled[fnName] = true;
       
    $.console[fnName] = function() {
      if (isEnable(fnName)) {
        try{
          console[fnName].apply(window.console, arguments);
        } catch(e){ if (console){ console.log(arguments[0]) } ; }
      }
    };
    
    $.fn.console[fnName] = function() {
      $.console[fnName](this);
      return this;
    }
  });
  
})(jQuery);