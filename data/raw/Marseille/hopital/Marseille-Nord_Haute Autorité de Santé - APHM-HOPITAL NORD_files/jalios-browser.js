!function ($) {

  var register = function(){
    
    // Register to broker
    $(document).on("jalios:broker", callback);
    
    // Register fallback
    $(document).on('click', '.popup-lg',       fallback);
  }
  
  var pattern = /popup-lg/i;
  var callback = function(event){

    var broker = $.jalios.Event.match(event, 'broker', pattern, true, true);
    if (!broker){ return; }
    
    var elm = broker.source.currentTarget;
    
    // Call show() function
    popup(elm, broker.options);
  }

  var fallback = function(event){
    // Prevent click
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    popup(event.currentTarget);
  }

  var popup = function(elm, options){
    var $e = $(elm)
    var url = $e.attr('data-jalios-url') || $e.prop('href'); // fix bug JCMS-4343 : DO NOT use $elm.attr('href');
    var title = $e.attr('title') || 'Popup';
    $.jalios.Browser.popupWindow(url, title, 900, 600, true, true, true, false);
  }


  // Namespace
  if (!$.jalios) { $.jalios = {}; }
  
 // ==========================================
 //  $.jalios.Browser
 // ==========================================
  
 /**
  * Jalios Browser:
  * A set of static function to wrap all browser feature detection deprecated in jQuery.
  * 
  * @namespace $.jalios.Browser
  * @copyright Jalios SA
  */
  $.jalios.Browser = {
    
    /**
     * Check browser is IE in the given version.<br/>
     * This function should be deprecated like jQuery because developers should check browser features instead of browser version. But there is exceptions...
     * 
     * @param {int} version the version to check (optional)
     * @return {boolean} true if the browser match version or lower.
     * 
     * @example
     * 
     * $.jalios.Browser.isIE();
     * => true if browser is IE
     * 
     * @example
     * 
     * $.jalios.Browser.isIE(8);
     * => true if browser is IE5, IE6, IE7, IE8
     * => false if browser is IE9, IE10, ...
     * 
     */
    isIE: function(version){
      if (!version){
        return $.browser.msie; // Deprecated
      }
      return $.browser.msie && version <= parseInt($.browser.version, 10)
    },
    
    /**
     * Check browser is Safari Mobile.<br/>
     * This function should be deprecated like jQuery because developers should check browser features instead of browser version. But there is exceptions...
     * 
     * @return {boolean} true if the browser match mobile safari
     */
    isMobileSafari: function(){
      return /Apple.*Mobile/.test(navigator.userAgent);
    },
    
    /**
     * Reload current browser's window.
     * @param {boolean} (optional) onOpener reload the window's opener
     */
    reload: function(onOpener){
      return $.jalios.Browser.redirect(false,onOpener);
    },
    
    /**
     * Redirect current browser's window to given url
     * @param {string} url to redirect
     * @param {boolean} (optional) onOpener reload the window's opener
     * @param {boolean} (optional) post adds a csrf token if redirect for a POST
     */
    redirect: function(url, onOpener, post){
      try {
        var win = onOpener ? window.opener : window;

        // Select top window if possible
        try {
          // Try catch to fix bug JCMS-3928 and JCMS-9011
          // invocation of win.parent.{whatever} throw an exception if parent frame is not in same origin, 
          // --> we must not use parent frame for redirection
          if (win.parent && !win.parent.skipJsRedirect) {
            win.parent.document;
            win = win.parent;
          }
        } catch (ex) { 
          /* Empty : on exception, do not use parent frame */
        }
        
        var doc = win.document;
        var loc = doc.location;
        
        // Perform redirect or reload
        if (!url || loc.href == url){
          loc.reload(true);
        } else {
          if (typeof post === "undefined" || post) {
            url = JCMS.Security.getUrlWithCSRFToken(url);
          }
          loc.href =  url;
        }
      } catch(ex) { 
        $.console.warn('Popup.redirect', ex, ex.message);
      }
    },
    
    /**
     * Simple version of popupWindow() functions 
     */
    popup: function(url, windowName, target) {
    
      // With IE, windowName must not contains special characters and must not be longer than 48 characters... 
      if (windowName) {
        windowName = windowName.replace(new RegExp('[^a-zA-Z0-9_]+', 'img'), '');
        windowName = windowName.substr(0, 48);
      }
    
      window.open(url, windowName, target);
      return false;
    },
    
    /**
     * Updates url and the page title if available, if no title has been set, channel name will be restored as title
     */
    updateUrl: function(url, pageTitle) {
      if (pageTitle) {
        document.title = pageTitle + " - " + $("body").data("channel-name");
      } else {
        document.title = $("body").data("channel-name");
      }
      window.history.replaceState(history.state, null, url);
    },
    
    /**
     * Replace previous various popupWindow() functions 
     */
    popupWindow: function(url, windowName, w, h, status, resizable, scrollbars, reuse, winOpener, callback) {
      
      if (!status) status="no";
      if (!w) w=320;
      if (!h) h=260;
      
      resizable = "resizable=" + ($.jalios.Common.toBoolean(resizable,  true) ? "yes" : "no");
      scrollbars = "scrollbars=" + ($.jalios.Common.toBoolean(scrollbars, true) ? "yes" : "no");
      
      if (reuse == undefined) {
        reuse = true;
      }
      
      if (!navigator.jalios) {
        navigator.jalios = new Object();
      }
      
      var pWnd = navigator.jalios.popupWindow; // shorter convenient var
    
      // Set window opener
      if (!winOpener) {
        winOpener = window;
      }
      
      // With IE, windowName must not contains special characters and must not be longer than 48 characters... 
      if (windowName) {
        windowName = windowName.replace(new RegExp('[^a-zA-Z0-9_]+', 'img'), '');
        windowName = windowName.substr(0, 48);
      }
      
      // Prevent security exception if opener is not on same origin
      var canUseWindowOpener = function(windowObj) {
        if (windowObj && windowObj.opener) {
          try { windowObj.opener.name } catch(e){ return false };
          return true;          
        }
        return false;
      }
      
      // Set a default windowName
      if (!windowName && !canUseWindowOpener(winOpener)) {
        windowName = '_blank';
      }

      // Update windowName
      else if (!reuse) {
        if(pWnd || winOpener.name.indexOf(windowName) === 0) {
          var idx = winOpener.name.lastIndexOf('_');
          navigator.jalios.popupCounter = idx > 0 ? parseInt(winOpener.name.substring(idx + 1)) + 1 : (navigator.jalios.popupCounter ? navigator.jalios.popupCounter + 1 : 1);
          windowName = windowName + "_" + navigator.jalios.popupCounter;
        } else if (canUseWindowOpener(winOpener)) {
          var wOpener = winOpener.opener;
          while (wOpener) {
            windowName = wOpener.name + "_" + windowName;
            wOpener = canUseWindowOpener(wOpener) ? wOpener.opener : null;
          }
        }
      }
      
      // close previous popup if needed
      if (reuse && pWnd && pWnd.close) {
        pWnd.close();
      }
      
      // Check popup blocker
      try {
        var params = 'status=' + status + ',width=' + w+ ',height=' + h + ',menubar=no,'+ resizable + ',' + scrollbars;
        navigator.jalios.popupWindow = winOpener.open(url, windowName, params);
  
        $.console.debug('Popup','popupWindow', url, params);
  
        pWnd = navigator.jalios.popupWindow;
        if (!pWnd) {
          alert(I18N.glp('warn.popup.blocker'));
        }
      } catch(ex) {
        alert(I18N.glp('warn.popup.blocker'));
      }
      
      // Set a callback (Wrap into a function to allow arguements parameters)
      winOpener.callback = callback ? function(args) { callback.apply(this, $A(args)); } : false;
      
      // Set a callbackId if 'this' is an Element (see Popup.popupEvent())
      winOpener.callbackLinkId = this.tagName ? $(this).identify() : false;
      
      // Set the focus if opener have the focus
      if (pWnd && pWnd.focus) {
        pWnd.focus();
      }
      
      return false;
    },
    
    /**
     * Internal callback use for communication with popup
     */
    callback: function(){

      var winOpener = window.opener || window.parent; // support both popup and iframe
      
      if (!winOpener){ return false; }
      if (winOpener.callback){ winOpener.callback(arguments); return true;  }
      if (!winOpener.callbackLinkId){ return false; }
      
      var event = $.Event('jalios:popup');
      event.popup        = {};
      event.popup.type   = 'callback';
      event.popup.args   = arguments;
      
      $(winOpener.document).trigger(event);
      
      return true;
    },
    
    /**
     * Resize the current window to the size of the given div.
     * 
     * @param divID the div of which to retrieve dimension and to use as 
     * a reference for the new window size
     * @param offsetHeight an integer value that will be added to the new window height, 
     * use this value when you want to add some margin to the div height (default is 55 if not given)
     * @param minimumHeight an integer value indicating the minimum height to used after resize (default is 50).
     */
    autoResize: function(divID, offsetHeight, minimumHeight) {
  
      if (!offsetHeight) {
        offsetHeight = 55;
      }
      if (!minimumHeight) {
        minimumHeight = 50;
      }
      
      var wLeft  = window.screenLeft ? window.screenLeft : window.screenX;
      var wTop   = window.screenTop ? window.screenTop : window.screenY;
      var $win   = $(window);
      var winH   = $win.height();
      var bounds = $(divID).bounds();
      
      // Compute the new height
      var height = bounds.height + offsetHeight;
          height = Math.min(height, self.screen.availHeight);
      
      // Make sure the window is not too high
      if (wTop && (height + wTop > self.screen.availHeight) ) {
        height = self.screen.availHeight - wTop;
      }
      
      // Resize the window
      window.resizeTo($win.width(), Math.max(minimumHeight, height));
    },
    
    /**
     * Check if the current window is a popup
     */
    isInPopup: function() {
      return !(opener == undefined);
    }
  }
  
  // Plugin initialization on DOM ready
  $(document).ready(function($) {
    register();
  });
  
}(window.jQuery);

// DEPRECATED CODE (previous)
// ==========================

window.Popup = {
  'reload'     : jQuery.jalios.Browser.reload,
  'redirect'   : jQuery.jalios.Browser.redirect,
  'encode'     : jQuery.jalios.Http.encode,
  'callback'   : jQuery.jalios.Browser.callback,
  'popupWindow': jQuery.jalios.Browser.popupWindow,
  'popupEvent' : function(){ jQuery.console.error('[Deprecated] popupEvent() Should use jQuery.jalios.Browser.popup'); },
  'autoResize' : jQuery.jalios.Browser.autoResize,
  'isInPopup'  : jQuery.jalios.Browser.isInPopup
}
