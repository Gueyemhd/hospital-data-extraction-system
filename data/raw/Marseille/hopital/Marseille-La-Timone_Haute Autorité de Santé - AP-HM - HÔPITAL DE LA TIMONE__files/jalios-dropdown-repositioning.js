! function($) {

  var register = function() {
    $(document).on("shown.bs.dropdown", function(e) {

      var dropdownOverflow = false;
      var $dropdownMenu = $(e.target).hasClass("dropdown-menu") ? $(e.target) : $(e.target).find(".dropdown-menu").first();

      if (!$dropdownMenu.exists()) {
        return;
      }

      // Dropdown is not in modal
      if (!$dropdownMenu.parents('#jalios-modal').length) {
        var isInViewPort = elementInViewport($dropdownMenu[0]);
        if (!isInViewPort) {
          dropdownOverflow = true;
        }
      } else {
        // Dropdown is in modal
        var dropdown_position = getElementPosition($dropdownMenu);
        var $modal = $("#jalios-modal .modal-dialog");
        var modal_position = getElementPosition($modal);

        // Check if we need to replace the dropdown
        var modalMaxLeft = modal_position.left + $modal.outerWidth();
        var dropdownMaxLeft = dropdown_position.left + $dropdownMenu.outerWidth() * 2; // * 2 for any sub-menu

        if (modalMaxLeft < dropdownMaxLeft) {
          dropdownOverflow = true;
        }
      }

      if (dropdownOverflow) {
        $dropdownMenu.addClass("dropdown-overflow");
        $dropdownMenu.find(".dropdown-submenu").addClass("pull-left");
        $dropdownMenu.addClass("pull-right");
      }
    });

    var elementInViewport = function(el) {
      var left = el.offsetLeft;
      var width = el.offsetWidth;

      while (el.offsetParent) {
        el = el.offsetParent;
        left += el.offsetLeft;
      }

      return (
        left >= window.pageXOffset &&
        (left + width) <= (window.pageXOffset + window.innerWidth)
      );
    };

    var getElementPosition = function($element) {
      return {
        "top": $element.offset().top,
        "left": $element.offset().left
      }
    };
  }

  // ------------------------------------------
  //  READY
  // ------------------------------------------

  // Plugin initialization on DOM ready
  $(document).ready(function($) {
    register();
  });

}(window.jQuery);
