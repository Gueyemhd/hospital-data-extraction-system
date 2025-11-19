/*
Rippler adds a material design effect on element after a click.
You can use it by :
  - adding ".js-ripple" class on the element
  - by calling the $(".yourelement").ripple() function
  
Inspired from https://codepen.io/zavoloklom/pen/Gubja

@since jcms-10.0.0

*/
!function ($) {

  // ------------------------------------------
  //  PUBLIC CODE
  // ------------------------------------------

  // Namespace
  if (!$.jalios) { $.jalios = {}; }


  /**
   * Documentation of the Rippler JavaScript class.<br/>
   * <br/>
   * <h5>Rippler adds a material design effect after a click on an element</h5>
   *
   * @namespace $.jalios.Rippler
   */
  $.jalios.Rippler = {

    /**
    * @param event the click event
    *
    * @example
    *
    * $(document).on("click",".my-binding", function(e){
    *  $.jalios.Rippler.ripple(e,e.currentTarget);
    * });
    * var value = $.plugin.MyPlugin.publicFunction(privateVariable);
    */
    ripple: function(event, element) {
      var rippler = $(element);

      // create .ink element if it doesn't exist
      if(rippler.find(".ripple").length == 0) {
        rippler.append("<span class='ripple'></span>");
      }

      var ripple = rippler.find(".ripple");

      // prevent quick double clicks
      ripple.removeClass("animate");

      // set .ink diametr
      if(!ripple.height() && !ripple.width())
      {
        var d = Math.max(rippler.outerWidth(), rippler.outerHeight());
        ripple.css({height: d, width: d});
      }

      var x = 0;
      var y = 0;
      if (event && event.type === "click") {
        // get click coordinates
        x = event.pageX - rippler.offset().left - ripple.width()/2;
        y = event.pageY - rippler.offset().top - ripple.height()/2;
      } else {
        ripple.addClass("is-centered")
      }


      // set .ink position and add class .animate
      ripple.css({
        top: y+'px',
        left:x+'px'
      }).addClass("animate");
    }
  }

  // ------------------------------------------
  //  JQUERY FUNCTION CODE
  // ------------------------------------------

  $.fn.ripple = function(options){
    return this.each(function() {
      $.jalios.Rippler.ripple(null,this);
    });
  }
  // ------------------------------------------
  //  DOM READY CODE
  // ------------------------------------------

  $(document).ready(function() {
    // Automatic ripple on element with class .js-ripple
    $(document).on("click",".js-ripple", function(e){
      $.jalios.Rippler.ripple(e,e.currentTarget);
    });
  });

}(window.jQuery);
