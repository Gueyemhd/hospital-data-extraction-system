!(function($) {
	var isObjectFitHandled = "objectFit" in document.documentElement.style;
	
  // Replace all is-object-fit images by a background-image for IE11 and edge (Before edge-16.0)
	const objectFit = function(){
    if (!isObjectFitHandled) {
      $("IMG.is-object-fit").each(function(index, element) {
        let $element = $(element);
        let imgUrl = $element.prop("src");
        if (imgUrl && !$element.hasClass("object-fit-compat")) {
          $element
            .css("backgroundImage", "url(" + imgUrl + ")")
            .addClass("object-fit-compat")
            .attr("alt", "")
            .attr("src", "");
        }
      });
    }
	};
	
  const handleBodyRefresh = function(event) {
    if (event.refresh.type !== "after") {
      return;
    }
  	objectFit();
  };
  
  $(document).ready(function() {
    if (!isObjectFitHandled) {
    	objectFit();
	    $(document).on("jalios:refresh", handleBodyRefresh);
    }
  });

})(window.jQuery);
