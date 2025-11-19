!function ($) {
  
  var urls = {
    'publication': 'jcore/autocomplete/acpublication.jsp?',
    'member'     : 'jcore/autocomplete/acmember.jsp?',
    'group'      : 'jcore/autocomplete/acgroup.jsp?',
    'category'   : 'jcore/autocomplete/accategory.jsp?',
    'workspace'  : 'jcore/autocomplete/acworkspace.jsp?',
    'country'    : 'jcore/autocomplete/accountry.jsp?',
    'acl'        : 'jcore/autocomplete/acacl.jsp?'
  }
  
  // Register
  var register = function(){
    $(document).on('focusin', '.form-control-autocomplete', callback);
    Typeahead.hooks.add(select);

    $(document).on('click', '.typeahead-container', toggleTypeaheadContainer); 
    $(document).mouseup(hideTypeaheadContainer); 
    
  }
  
  // Callback
  var callback = function(event){
    var $e = $(event.currentTarget);
    initMenu($e);
  }
  
  var initMenu = function($e){
    
    // Quick escape
    if ($e.data('typeahead')) { return; }
    
    // Build new menu
    var $menu = $('<div class="typeahead-menu ajax-refresh-div"></div>');
    
    // Custom URL
    var $widget = $e.closest('.widget');
    if (!$widget.exists()){ return; }
    
    var $action = $widget.find('INPUT[data-jalios-ac-action^="acChooser:"]').first();
    if (!$action.exists()){ return; }
    
    var cb  = false;
    var chooser = $action.attr('data-jalios-ac-action');
        chooser = chooser.substring(chooser.indexOf(':') + 1);
    
    // Try to retrieve options on the current input element
    var options = $action.attr('data-jalios-ac-options');
    /*if(!options) {
      // Try to retrieve options on the button with 'chooser:'
      var $actionButton = $widget.find(':input[data-jalios-action^="chooser:"]').first();
      if($actionButton.exists()) {
        options = $actionButton.attr('data-jalios-options');
      }
    }*/
        
    var url = urls[chooser] + options;
    
    if (chooser == 'country'){ 
      cb = function($e) {
        var country = $e.matchClass(/([A-Z]{2}-flag)/g);
        if (country.length > 0){ $e.removeClass(country[0]); }
        
        var newCountry = $e.next('.form-control').val();
        if (newCountry){ $e.addClass(newCountry+'-flag'); }
      }
    }
    
    if (chooser == 'publication'){ 
      cb = function($e) {
        // Handle publication chooser with dropdown menu: if there is an id, display the dropdown and hide the clear button
        var isKeyword = $.jalios.ui.Widget.Keyword.isInKeyword($e);
        // Do not display the dropdown menu if it's a publication keyword
        if(!isKeyword) {
          var $parent = $e.parent();
          var dropdown = $parent.find('.input-group-btn .dropdown-toggle');
          if(dropdown.exists()) {
            dropdown.removeClass('hide'); // Display the dropdown
            $parent.find('.input-group-btn .btn-remove').addClass('hide') // Hide the clear button
          }
        }
      }
    }
    
    // Select next
    if ($widget.hasClass('keyword')){
      cb = function($e) {
        JCMS.form.Widget.add($e[0]);
      }
    }
        
    $e.attr('autocomplete','off');
    $e.typeahead({ 'menu': $menu, 'ajax': url, 'selectCB': cb});
  }
  
  var select = function(event){
    if (event.type != 'select'){ return; }
    
    var $e  = event.typeahead.$element;
    if (!$e.hasClass('form-control-autocomplete')){ return; }
    
    var $active = event.$active;
    var val = $active.attr('data-value');
    var ph  = $active.attr('data-placeholder');
    
    $e.data('autocomplete-update', false); // Remove flag 
    
    $e.val(ph);
    $e.next('.form-control').val(val).change();
    $e.change();
    
    var cb = event.typeahead.options.selectCB;
    if (cb){ cb($e); }
    
    event.stop = true;
  }


  // ------------------------------------------
  //  Advance typeahead container with auto show/hide of label/input
  //   (eg: topbar or mediabrowser workspace search, ...)
  // ------------------------------------------
  
  var showTypeaheadInput = function($taContainer) {
    $taContainer.find('.typeahead-label').animate({'opacity':'0'},100).hide()
    $taContainer.find('.typeahead-input').show().animate({'opacity':'1'},100);
    $taContainer.addClass('active');
    
    var $input = $taContainer.find('INPUT.typeahead');
    initMenu($input);
    $input.focus();
    var ta = $input.data('typeahead');
    if (ta) {
      if ($input.data('ac-typeahead-menu')) {
        ta.show();
      } else {
        ta.lookup();
      }
    }
    
  }
  
  var showTypeaheadLabel = function($taContainer) {
    $taContainer.find('.typeahead-input').animate({'opacity':'0'},100).hide();
    $taContainer.find('.typeahead-label').show().animate({'opacity':'1'},100);
    $taContainer.removeClass('active');    
  }
  
  var toggleTypeaheadContainer = function(e) {

    // Prevent event to fire when a click on the search input occurs
    if ($(e.target).hasClass('typeahead')){ return; }

    var $taContainer = $(e.target).parents('.typeahead-container');
   
    if ($(e.target).hasClass('typeahead-close')) {
      showTypeaheadLabel($taContainer);
      return;      
    }
    
    if ($taContainer.hasClass('active')) {
      showTypeaheadLabel($taContainer);
    } else {
      showTypeaheadInput($taContainer);
    }
  }
  
  var hideTypeaheadContainer = function(e) {
    var $target = $( e.target );

    if ( $target.hasClass('typeahead-input') ||
         $target.hasClass('typeahead-menu') || 
         $target.closest('.typeahead-container').exists() ||
         $target.closest('.dropdown-menu').exists() ) {
      return;
    }
    
    var $tac = $('.typeahead-container');
    if ($tac.exists()) {
      showTypeaheadLabel($tac);
    }  
  }
  
  Typeahead.prototype.blur = function (e) {
    var that = this;
    e.stopPropagation();
    e.preventDefault();
    if (!that.$element.hasClass('form-control-autocomplete')){ return; }

    setTimeout(function() {
      if (!that.$element.is(':focus') && !that.$menu.is(':hover')) {
        that.hide();
        that.clear();
      }
    }, 150)
  }
  
  // ------------------------------------------
  //  TYPEAAHEAD PROTOTYPE: clear
  // ------------------------------------------
  
  Typeahead.prototype.clear = function (e) {
    var $e = this.$element;
    if (!$e.hasClass('form-control-autocomplete')){ return; }
    
    if ($e.data('autocomplete-update')){ // Flag indicating something has change
      $e.val('');
      $e.next('.form-control').val('');
      $e.data('autocomplete-update', false);
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