!function ($) {

  var isMentionEnabled = true;

  // Register
  var register = function(){
    $(document).on('focusin', 'TEXTAREA.wikiarea', callback);
    Typeahead.hooks.add(lookup);
    Typeahead.hooks.add(select);
    Typeahead.hooks.add(show);
  }


  // Callback
  var callback = function(event){
    var $e = $(event.currentTarget);

    // Quick escape
    if ($e.data('typeahead')) { return; }
    
    // Build new menu
    var $menu = $('<div class="typeahead-menu ajax-refresh-div"></div>');
    var url = 'jcore/autocomplete/acwiki.jsp';
    
    // Create WikiComplete
    $e.typeahead({ 
      'menu': $menu,
      'ajax': url
    });
  }

  // ------------------------------------------
  //  EVENTS
  // ------------------------------------------
  
  var selection = false;
  var select = function(event){
    if (event.type != 'select'){ 
      return; 
    }
    
    var $e  = event.typeahead.$element;
    if ($e.prop("tagName") != "TEXTAREA"){ 
      return; 
    }

    var word = WikiToolbar._word(selection); // FIXME:PROTOTYPE
    var value = event.$active.attr("data-value");
    var sel  = selection.start - selection.end;
    
    var ph  = event.$active.attr("data-placeholder");
    var mentionEmail  = event.$active.attr("data-mention-email-prefix");
    if (mentionEmail) {
      //Mention
      value = '@'+ mentionEmail;
    } else if (ph){
      value = '[['+value+']['+(ph||word)+']]';
    }
    
    //Check if replaced content starts with "@"
    if (mentionEmail && word.lastIndexOf("@", 0) !== 0) {
      InputUtil.replaceSelection($e[0], value, false, selection, sel ? 0 : ( -word.length + 1)); // FIXME:PROTOTYPE
    } else {
      InputUtil.replaceSelection($e[0], value, false, selection, sel ? 0 : -word.length); // FIXME:PROTOTYPE
    }
    
    $e.change();
    
    event.stop = true;
  }

  // Lookup
  var lookup = function(event){

    if (event.type != 'lookup'){ 
      return; 
    }

    var th = event.typeahead;
    var $e = th.$element;
    
    // Retrieve textarea value
    selection = InputUtil.getSelection($e[0], false); // FIXME:PROTOTYPE
    var word = WikiToolbar._word(selection); // FIXME:PROTOTYPE
    if (!$e.hasClass("mention-disabled") && isMentionEnabled && word && word.length > 1 && word.indexOf(' ') < 0 && ((word.indexOf('@') == 0) || (word.indexOf('@') == 1))){
      th.query = word;
      th.show();
    } else if (event.explicit){ // lookup invoked through ctrl+space
      th.query = word;
      th.show();
    } else {
      th.hide();
      event.stop = true;
    }
  }

  // Show
  var show = function(event){
    
    var $e        =  event.typeahead.$element;
    if ($e.prop('tagName') != 'TEXTAREA') { return; }
    
    var $menu     = event.typeahead.$menu;
    var textarea  = $e[0];
    var carret    = InputUtil.getCharacterCoords(textarea, selection.start); // FIXME:PROTOTYPE
    
    var offset  = $menu.offset();
    $menu.css({
      'top' : offset.top  + carret.top - textarea.offsetHeight + 18,
      'left': offset.left + carret.left
    });
  }

  // ------------------------------------------
  //  READY
  // ------------------------------------------

  // Plugin initialization on DOM ready
  $(document).ready(function($) {
    isMentionEnabled = $("BODY").hasClass("jcms-mention-disabled") ? false : true;
    register();
  });

}(window.jQuery);
