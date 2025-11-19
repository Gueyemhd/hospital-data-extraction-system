(function($) {

Drupal.behaviors.ebizcustom = {
  attach: function (context) {
    var $destination = window.location.pathname;
   if(Drupal.settings.ebizcustom.ebiz_multilingue==1) $destination = ($destination.substring(4, $destination.length));
   else $destination = ($destination.substring(1, $destination.length));
    if ($destination.length > 0) {
	//alert($('#navbar-link-admin-flush-cache').length);
      if($('#navbar-link-admin-flush-cache').length>0){
      var $href = $('#navbar-link-admin-flush-cache').attr('href');
      if(Drupal.settings.ebizcustom.ebiz_multilingue==1) $href=$href.substr(0,$href.indexOf('?'));
      $('#navbar-link-admin-flush-cache').attr('href', $href + '?destination=' + $destination);
      var $parent = $('#navbar-link-admin-flush-cache').closest('li');
      $('.icon', $parent).each(function(){
        $href = $(this).attr('href');
        $(this).attr('href', $href + '?destination=' + $destination);
      });
    }
    }
  }
};
});

/** MATERIAL ICONS **/
jQuery(document).ready(function(){
	jQuery('.materialiconfieldset').each(function(){
		var rel = jQuery(this).attr('rel');
	jQuery(this).find('a.fieldset-title').prepend('<i class="material-icons fonts lg-icon dp48">'+rel+'</i>');
});
	jQuery('a.fieldset-title').each(function(){
	jQuery(this).html(jQuery(this).html().trim());
	});
});
/** END OF MATERIAL ICONS **/