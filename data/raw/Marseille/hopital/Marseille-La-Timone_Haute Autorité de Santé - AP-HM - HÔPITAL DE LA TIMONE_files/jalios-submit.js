!function ($) {
  // Action regexp
  var pattern = /submit/i;
  
  var callback = function(event) {
    var broker = $.jalios.Event.match(event, 'broker', pattern, true);
    if (!broker){ return; }
    
    // Element
    var $elm = $(broker.source.currentTarget);
    var $form = $elm.closest("FORM");
    
    if ($elm.is("option")) {
      $elm = $elm.parent();
    }
    
    if ($elm.data("jalios-submit-data")) {
      $.each($elm.data("jalios-submit-data"), function(key, value) {
        addHiddenInput($form, key, value);
      });
    }

    if ($form.exists()) {
      $form.submit();
    }
    
  }
  
  var register = function() {
    // Register to broker
    $(document).on("jalios:broker", callback);
  }
  
  // Plugin initialization on DOM ready
  $(document).ready(function($) {
    register();
  });
  
  var addHiddenInput = function($form, key, value) {      
    var $input = $('<input type="hidden" name="'+key+'" />');
    $input.val(value);
    $form.append($input);
  }
  
}(window.jQuery);