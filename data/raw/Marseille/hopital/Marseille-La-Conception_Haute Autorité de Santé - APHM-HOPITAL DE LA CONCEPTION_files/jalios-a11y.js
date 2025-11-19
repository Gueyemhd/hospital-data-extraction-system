!(function ($) {
  // ------------------------------------------
  //  PUBLIC CODE
  // ------------------------------------------

  /**
   * A focus information class
   * @constructor
   * @typedef {Object} FocusInformation
   * @param {HTMLElement} element - the element which you want to retrieve focus informations
   */
  const FocusInformation = function (element) {
    this.$element = $(element);
    this.init();
  };

  FocusInformation.prototype.init = function () {
    this.$focusableElements = this.$element.find($.jalios.a11y.focusableElementsSelector).filter(function(idx, element) {
      return !$(element).closest(".hide").exists();
    });
    this.firstFocusableElement = this.$focusableElements[0];
    this.lastFocusableElement = this.$focusableElements[this.$focusableElements.length - 1];
  }

  if (!$.jalios) {
    $.jalios = {};
  }
  if (!$.jalios.a11y) {
    $.jalios.a11y = {};
  }
  $.jalios.a11y = {
    lastFocusedElement: null,
    focusableElementsSelector: "a[href], area[href], *[role=button], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed,*[contenteditable]",
    getFocusInformation: function (element) {
      return new FocusInformation(element);
    },
    uniqueId: function (prefix) {
      return (prefix || 'ui-id') + '-' + Math.floor((Math.random() * 1000) + 1)
    },
    handleKeydownTabEvent: function(event, focusWrapper) {
      if (event.keyCode === 9) { // TAB pressed
        let focusInformation = $.jalios.a11y.getFocusInformation($(focusWrapper));

        let $focusableElements = focusInformation.$focusableElements.filter(function (idx, element) {
          return $(element).is("A");
        });
        let firstFocusableElement = $focusableElements[0];
        let lastFocusableElement = $focusableElements[$focusableElements.length - 1];

        let focusedElement = document.activeElement;

        if (focusedElement === lastFocusableElement && !(event.shiftKey | event.ctrlKey | event.metaKey | event.altKey)) {
          event.preventDefault();
          $(firstFocusableElement).focus();
        } else if (focusedElement === firstFocusableElement && event.shiftKey) {
          event.preventDefault();
          $(lastFocusableElement).focus();
        }
      }
    },
    prefersReducedMotion: function() {
      let mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      if (!mediaQuery) {
        return false;
      }
      
      return mediaQuery.matches;
    },
    isFocusedClick: function(event){
      if(event.type === 'click'){
        return true;
      }
      else if(event.type === 'keydown'){
        let code = event.charCode || event.keyCode;
        if((code === 32)|| (code === 13)){
          return true;
        }
      }
      else{
        return false;
      }
    },
    focus: function(element) {
      $(element).addClass("js-focused");
      $(element)[0].focus({
        focusVisible: false
      })  
    }
  }
  
  $.fn.focusElement = function(){
    if (!this.exists()){ return; }
    $.jalios.a11y.focus(this);
  };
  
  $(document).ready(function($) {
    // Remove js-focused class for any event
    $(document).on("click keydown", function() {
      $(".js-focused").removeClass("js-focused");
    })
  });  
  /*
  From https://github.com/paypal/bootstrap-accessibility-plugin 1.0.6
  Copyright (c) 2014, PayPal All rights reserved.
  
  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
  
  Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
  
  Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
  
  Neither the name of the PayPal nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
  
  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  */
  // selectors  Courtesy: https://github.com/jquery/jquery-ui/blob/master/ui/focusable.js and tabbable.js
  /*
  Copyright jQuery Foundation and other contributors, https://jquery.org/

  This software consists of voluntary contributions made by many
  individuals. For exact contribution history, see the revision history
  available at https://github.com/jquery/jquery-ui

  The following license applies to all parts of this software except as
  documented below:

  ====

  Permission is hereby granted, free of charge, to any person obtaining
  a copy of this software and associated documentation files (the
  "Software"), to deal in the Software without restriction, including
  without limitation the rights to use, copy, modify, merge, publish,
  distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so, subject to
  the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

  ====

  Copyright and related rights for sample code are waived via CC0. Sample
  code is defined as all source code contained within the demos directory.

  CC0: http://creativecommons.org/publicdomain/zero/1.0/

  ====
  */

  // Extended functions
  $.extend($.expr[":"], {
    data: $.expr.createPseudo ?
      $.expr.createPseudo(function (dataName) {
        return function (elem) {
          return !!$.data(elem, dataName);
        };
      }) :
      // support: jQuery <1.8
      function (elem, i, match) {
        return !!$.data(elem, match[3]);
      },

    focusable: function (element) {
      return focusable(element, !isNaN($.attr(element, "tabindex")));
    },
    tabbable: function (element) {
      var tabIndex = $.attr(element, "tabindex"),
        isTabIndexNaN = isNaN(tabIndex);
      return (isTabIndexNaN || tabIndex >= 0) && focusable(element, !isTabIndexNaN);
    }
  });

  var focusable = function (element, isTabIndexNotNaN) {
    var map, mapName, img,
      nodeName = element.nodeName.toLowerCase();
    if ("area" === nodeName) {
      map = element.parentNode;
      mapName = map.name;
      if (!element.href || !mapName || map.nodeName.toLowerCase() !== "map") {
        return false;
      }
      img = $("img[usemap='#" + mapName + "']")[0];
      return !!img && visible(img);
    }
    return (/input|select|textarea|button|object/.test(nodeName) ?
      !element.disabled :
      "a" === nodeName ?
        element.href || isTabIndexNotNaN : isTabIndexNotNaN) && visible(element); // the element and all of its ancestors must be visible  
  }
  var visible = function (element) {
    return $.expr.filters.visible(element) &&
      !$(element).parents().addBack().filter(function () {
        return $.css(this, "visibility") === "hidden";
      }).length;
  }
})(jQuery, window, document);