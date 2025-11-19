!function($) {

  /* Do stuff on DOM Ready */
  var register = function(){
    $(".modal .forbidden-message .alert-warning BUTTON.close").on("click", function(){
      var modal = $(this).closest('.modal');
      modal.modal('hide');   	  
    }); 
  }	
  
  // ------------------------------------------
  //  DOM READY CODE
  // ------------------------------------------
  
  $(window).ready(function() {
    register();
  });
  
  $(document).on('jalios:refresh', function(event) {
    if (event.refresh.type == "after") {
      register();
	}
  });

}(window.jQuery);