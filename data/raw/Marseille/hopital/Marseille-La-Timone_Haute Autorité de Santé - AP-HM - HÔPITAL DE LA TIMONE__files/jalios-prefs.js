 !function ($) {
  
  // Namespace
  if (!$.jalios) { $.jalios    = {}; }

  // ------------------------------------------
  //  PRIVATE
  // ------------------------------------------
 
  var register = function(){
    
    // Turn on automatic storage of JSON objects
    $.cookie.json = true;
    
    // Init the prefs cookie
    init();
  }
 
  var init = function(){
    var cookie = $.cookie($.jalios.Prefs.id);
    if (!cookie){
      cookie = $.cookie($.jalios.Prefs.id, { 'id' : 'jcms' });
    }
  }
  
  var get = function(key){
    return $.cookie($.jalios.Prefs.id)[key];
  }
  
  var set = function(key, value){
    var prefs  = $.cookie($.jalios.Prefs.id);
    prefs[key] = value;
    $.cookie($.jalios.Prefs.id, prefs);
  }
  
  // ------------------------------------------
  //  PUBLIC
  // ------------------------------------------
 
  $.jalios.Prefs = {
    
    id: 'jcms.prefs',
    
    data: function(key, value){
      if (value === undefined){
        return get(key);
      }
      set(key, value);
    }
  }
  
  // ------------------------------------------
  //  READY
  // ------------------------------------------
  
  // Plugin initialization on DOM ready
  $(document).ready(function($) {
    register();
  });
  
}(window.jQuery);