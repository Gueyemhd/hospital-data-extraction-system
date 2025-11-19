!function ($) {

  var register = function(){
    updateStyle();
    $(document).on('jalios:refresh', updateStyle);
  }
  
  var updateStyle = function() {
    $('.table-data th .sort-link').each(function( index ) {
      var $th =  $(this).closest('th'); 
      var isActive = $(this).find('.pager-sort-active').exists();
      $th.addClass('th-sort').addClass(isActive ? "th-sort-active" : "th-sort-inactive");
    });
  }

  // ------------------------------------------
  //  PUBLIC
  // ------------------------------------------
  
  // Plugin initialization on DOM ready
  $(document).ready(function($) {
    register();
  });
  
}(window.jQuery);