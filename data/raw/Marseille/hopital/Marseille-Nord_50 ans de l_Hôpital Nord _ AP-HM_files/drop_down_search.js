/**
 * @file
 * Javascript and jQuery functions which are useful for the drop_down_search module.
 */

(function($, Drupal) {
  // Drupal.behaviors.
  Drupal.behaviors.drop_down_search = {
    attach:function(context, settings) {
      // Drop down search animation.
      $('#drop-down-search-wrapper', context).addClass('enable-dd');
	    //$('#drop-down-search-wrapper .dropdown', context).slideToggle();
      $('#drop-down-search-wrapper .search', context).click(function() {
        //$(this).toggleClass('open').siblings('.dropdown').slideToggle();
        $(this).parent().toggleClass('opened');

        if( $( window ).width() < 640 ) { // Toggle logo opacity on small device
          var header_logo = $('.l-branding');
          if(header_logo.css('opacity') == 1) {
            header_logo.css('opacity', '0.5');
          } else {
            header_logo.css('opacity', '1');
          }
        }
        return false;
      });

      /*$('#block-drop-down-search-drop-down-search input[id*="edit-search-block"]').keypress(function(event){
        console.log('KEY PRESSED: '+event.which);
        if ( event.which == 13 ) {
           event.preventDefault();
        }
      });*/


      $('#drop-down-search-wrapper input[id*="edit-search-block"]').keyup(function(event){
        var inputVal = $(this).val();
        if(inputVal.length > 0) {
          $('.form-actions').show();
        } else {
          $('.form-actions').hide();
        }
      });
    }
  };
}(jQuery, Drupal));
