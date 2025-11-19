!function ($) {
  
  var isCtrlKeyPressed = false;
  var CTRL_KEY = 17;
  var LEFT_CLICK = 1;
  var MIDDLE_CLICK = 2;

  var callback = function(event) {
    
    // Listening on "click" and "mouseup"
    // If "click" event, continue
    // If "mouseup" event, only continue if it is a middleclick (which == 2)
    // Else, return now.
    let isMiddleClick = event.which === MIDDLE_CLICK;
    if (event.type === "mouseup" && !isMiddleClick) {
      return;
    }
    var $elm = $(event.currentTarget);
    var $target = $(event.target);
   
    // Prevent link inside a clickable container to be handled by clickable event
    if($target.data("jalios-action") && $target.data("jalios-action") != "clickable"){
      return;
    }
    if ($target.is("A") || $target.is(":input")) {
      return true;
    }
    
    event.stopPropagation();
    event.stopImmediatePropagation();
    event.preventDefault();
    
    var url = null;
    var $links = $("A", $elm);
    var dataUrl = $elm.data("jalios-url");
    if (dataUrl) {
      url = dataUrl;
    } else if ($links.exists()) { // fallback to the first link found
      url = $links.first().prop("href");
    }
    
    if (url) {
      var options = $elm.data("jalios-options");
      
      var eventWhich = event.which === undefined ? 1 : event.which;
      var isLeftClick = eventWhich === LEFT_CLICK;
      
      if(!options || !options.mode || options.mode === 'normal') {
        // IE do not allow new tab to be opened through javascript
        // Firefox does allow it, but needs the user to accept Firefox to open popups from the domain
        var isBrowserHandleNewTab = $("BODY").hasClass("browser-Chrome");
        isBrowserHandleNewTab |= $("BODY").hasClass("browser-Firefox");
        if (isLeftClick) {
          if (isBrowserHandleNewTab && (options && options.target === "_blank" || isCtrlKeyPressed)) {
            // Handle options.target = "_blank"
            var win = window.open(url, '_blank');
          } else {
            document.location.href = url.startsWith("http") ? url : document.getElementsByTagName('base')[0].href + url;
          }
        } else if (isBrowserHandleNewTab && eventWhich === MIDDLE_CLICK) {
          event.preventDefault();
          var win = parent.window.open(url, '_blank');
        }
      } else if(options.mode === 'modal') {
        if (isLeftClick) {
          $.jalios.ui.Modal.openFromUrl(url, options);
        }
      } else if(options.mode === 'ajax') {
        if (isLeftClick) {
          // If there is no ajax options defined (just the mode option defined), add the url in options
          if($.jalios.Common.size(options) === 1) {
            options.url = url;
          }
          $elm.refresh(options);
        }
      }
    }
  };

  var onKeyDown = function(event) {
    if (event.which === CTRL_KEY) {
      isCtrlKeyPressed = true;
    }
  };

  var register = function() {
    $(document).on("mouseup click", ".clickable[data-jalios-url], [data-jalios-action='clickable']", callback);
    $(document).keydown(onKeyDown);
    $(document).keyup( function() {
      isCtrlKeyPressed = false;
    });
  };
  
  // Plugin initialization on DOM ready
  $(document).ready(function($) {
    register();
  });
  
}(window.jQuery);