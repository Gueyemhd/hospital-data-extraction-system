!(function ($) {
  const SPACE_KEY = 32;

  // Namespace
  if (!$.jalios) {
    $.jalios = {};
  }

  // ------------------------------------------
  //  PRIVATE
  // ------------------------------------------

  // Action regexp
  var pattern = /ajax-refresh/i;

  // Default options
  // ===============

  var default_options = $.jalios.Properties.get('ajax-refresh-setup');

  // Convenient functions
  // ====================

  // Add/Remove debug information
  var setDebug = function ($target, add) {
    // Remove
    if (!add) {
      $target.removeClass('ajax-refresh-debug');
      return;
    }

    // Add
    if ($(document.location).prop('href').indexOf('debug=true') >= 0) {
      $target.addClass('ajax-refresh-debug');
    }
  };

  // Store history according to given options
  var setScroll = function (url, $target, options) {
    if (options.nofocus || options.noscroll) {
      return;
    }

    // oTop: position of element to be refreshed (.ajax-refresh-div)
    let oTop = $target.offset().top;

    let $window = $(window);

    let $topbarPlaceholder = $('.topbar-placeholder');
    let topbarHeight = $topbarPlaceholder.exists() ? $topbarPlaceholder.height() : 0;

    // wTop: actual scroll position + topbar if any
    let wTop = $window.scrollTop() + topbarHeight;

    let wHeight = $window.height();

    if (wTop < oTop && oTop < wTop + $window.height()) {
      return;
    }

    // Remove 10px to make a padding
    let newPosition = oTop - 10;
    if (topbarHeight) {
      // Take in account topbar's height if any
      newPosition -= topbarHeight;
    }
    $('html,body').animate({ scrollTop: newPosition }, 'fast');
  };

  // Lock the $target
  var setLock = function ($target, lock, options) {
    if (!lock) {
      $target.removeData('ajax-refresh:job');
      if (options && options.waiting) {
        $target.removeClass('ajax-refresh-job');
        //$target.find('.ajax-loading-component-waves').remove();
      }
      return true;
    }

    // Already locked
    if ($target.data('ajax-refresh:job')) {
      return false;
    }

    // FIXME: previous code was locking only on ajax-action (no history) why ?
    $target.data('ajax-refresh:job', true);
    if (options.waiting && $.fn.displayLoadingWaves) {
      $target.addClass('ajax-refresh-job');
      //$target.displayLoadingWaves();
    }
    return true;
  };

  const AjaxRefreshException = function (message, text) {
    this.message = message;
    this.name = 'AjaxRefreshException';
    console.debug(text);
  };

  // Extract javascript code
  // =======================

  var jsHtml = '<div class="ajax-lazy-load">';
  var cleanHTML = function (html, replaceTarget) {
    // Fast strip
    html = $.jalios.Common.strip(html, true);

    // Extract and remove the div containing lazy javascript and css loading
    var jsCode = '';
    var jsCodeIndexOf = html.indexOf(jsHtml);
    if (jsCodeIndexOf > 0) {
      jsCode = html.substring(jsCodeIndexOf + jsHtml.length, html.lastIndexOf('</div>'));
      html = html.substring(0, jsCodeIndexOf);
    }
    // Extract handlebars templates
    var $handlebarsTemplate;
    try {
      $handlebarsTemplate = $(html).find('script.hdb-template');
      if ($handlebarsTemplate.exists()) {
        $handlebarsTemplate.each(function(idx, element) {
          // Check there's not already another handlebar template with the same id in the page
          let scriptId = $(element).attr("id");
          if ($(".handlebar-templates script#" + scriptId).exists()) {
            $(element).remove();
          } else {
            $(".handlebar-templates").append(element);
          }
        });
      } 
    } catch(error) {
      console.debug(error);
    }
    
    if (!replaceTarget) {
      // Remove the ajax-refresh div wrapper
      var $wrap = false;
      var patternDIV = new RegExp('^(<div[^>]*ajax-refresh[^>]*>)(.*)', 'gi'); // Can't be set out of the function
      var mtch = patternDIV.exec(html);
      if (mtch) {
        $wrap = $(mtch[1] + '</div>');
        html = html.replace(patternDIV, '$2');
        html = html.substring(0, html.lastIndexOf('</div>'));
      }
  
    }
    // Insert back the lazy loading javascript code
    html += jsCode;

    return { html: html, $wrap: $wrap };
  };

  // Refresh functions
  // =================

  var setOptTimeout = function ($e, options) {
    var timeout = $e.attr('data-jalios-ajax-refresh-timeout');
    if (timeout) {
      options.timeout = parseInt(timeout);
    }
  };
  
  const setFocusElement = function ($e, options) {
    var focusElement = $e.attr('data-jalios-ajax-refresh-focus-element');
    if (focusElement) {
      options.focusElement = focusElement;
    }
  };

  const setAutoFocus = function ($e, options) {
    var autofocus = $e.attr('data-jalios-ajax-refresh-autofocus');
    if (autofocus) {
      options.autofocus = autofocus;
    }
  };
  
  const setFocusTarget = function ($e, options) {
    var focusTarget = $e.attr('data-jalios-ajax-refresh-focus-target');
    if (focusTarget) {
      options.focusTarget = focusTarget;
    }
  };

  var setOptWaiting = function ($e, opt) {
    var waiting = $e.attr('data-jalios-ajax-refresh-waiting');

    if (!waiting) {
      // Test fallback
      waiting = ($e.attr('class') || '').match(/ajax-waiting-([\d\.]+)/);
      if (waiting) {
        waiting = waiting[1];
      } else {
        return;
      }
    }

    opt.waiting = parseFloat(waiting);
  };

  var setOptPeriodical = function ($e, opt) {
    var periodical = $e.attr('data-jalios-ajax-refresh-periodical');

    if (!periodical) {
      // Test fallback
      periodical = ($e.attr('class') || '').match(/ajax-periodical-(\d+)/);
      if (periodical) {
        periodical = periodical[1];
      } else {
        return;
      }
    }

    opt.nohistory = true;
    opt.nofocus = true;
    opt.noscroll = true;
    opt.periodical = parseInt(periodical);
  };

  var setOptInner = function ($e, options) {
    var inner = $e.attr('data-jalios-ajax-refresh-inner');
    if (inner) {
      options.inner = inner;
      options.nohistory = true;
    }
  };

  var getTarget = function ($e, options) {
    // Options can force the target (e.g. modal)
    if (options && options.target) {
      return $(options.target);
    }

    // Match the target attribute
    var target = $e.attr('data-jalios-target');
    if (target) {
      // Match target relative to position
      var position = $e.attr('data-jalios-target-position');
      if (position) {
        return $e[this.position].apply($e, [target]);
      }

      return $(target);
    }

    // Fast up matching closest ajax-refresh-div
    var closest = $e.closest('DIV.ajax-refresh-div');

    // Magic Trick
    if (!closest.exists()) {
      var event = $.Event('jalios:refresh');
      event.refresh = {};
      event.refresh.type = 'helper:target';
      event.refresh.$e = $e;
      event.refresh.$target = false;
      $(document).trigger(event);

      closest = event.refresh.$target;
    }

    return closest;
  };

  var getOptions = function ($e, $target, options) {
    var opt = {};

    if ($e.is('UL,OL')) {
      opt.nohistory = true;
      opt.noscroll = true;
    }

    // Set data-jalios-ajax-refresh-periodical
    setOptPeriodical($target, opt);
    setOptPeriodical($e, opt);

    // Set data-jalios-ajax-refresh-timeout
    setOptTimeout($target, opt);
    setOptTimeout($e, opt);

    // Set data-jalios-ajax-refresh-inner
    setOptInner($target, opt);
    setOptInner($e, opt);

    // Set data-jalios-ajax-refresh-waiting
    setOptWaiting($target, opt);
    setOptWaiting($e, opt);

    // Set Focus 
    setFocusTarget($e, opt);
    setFocusElement($e, opt);
    setAutoFocus($e, opt);

    // Set trigger
    opt.trigger = '#' + $e.identify('jqid').attr('id');

    // Handle form element
    var form = $e.prop('form');
    if (options.isform || opt.isform) {
      form = $e.closest('FORM');
    }
    if (form) {
      opt.method = $(form).attr('method');
      opt.noscroll = true; // No scroll for forms' elements
      opt.isform = '#' + $(form).identify('jqid').attr('id');
    }

    // Override decoded options by user's option
    opt = $.extend(true, {}, default_options, opt, options);

    // Forbidden history on POST
    if (opt.method && 'POST' == opt.method.toUpperCase()) {
      opt.nohistory = true;
    }

    // Decode attribute
    // FIXME: fallback decode classes
    var attr = $e.attr('data-jalios-ajax-refresh');
    if (attr && attr.match(/nohistory/)) {
      opt.nohistory = true;
    }

    if (attr && attr.match(/nofocus/)) {
      opt.nofocus = true;
    } else if (attr && attr.match(/focus/)) {
      // cf. OD
      opt.nofocus = false;
    }

    if (attr && attr.match(/noscroll/)) {
      opt.noscroll = true;
    } else if (attr && attr.match(/scroll/)) {
      // cf. OD
      opt.noscroll = false;
    }

    if (attr && attr.match(/noerror/)) {
      opt.noerror = true;
    }
    if (attr && attr.match(/isform/)) {
      opt.isform = true;
    }
    if (attr && attr.match(/noresponse/)) {
      opt.noresponse = true;
    }

    return opt;
  };

  var getUrl = function ($e, $target, options) {
    var url = '';

    if (options.url) {
      return options.url;
    }

    // Use the href attribute
    if ($e.attr('href')) {
      // JsChecker.authorize(".attr('href')")
      url = $e.prop('href'); // fix bug DEVJCMS-5 : DO NOT use $elm.attr('href')
      $.extend(true, options.params, $.jalios.Http.toQueryParams(url));
      url = url.split('?').shift();
    }

    // Serialize the form
    var form = $e.prop('form');
    if (options.isform) {
      form = $e.closest('FORM');
    }
    if (form) {
      var $form = $(form);
      // FIXME: Parse QueryString
      url = $form.attr('action');

      // Refresh:serialize (needed for proper wysiwyg serialization, JCMS-4227)
      $.jalios.AjaxRefresh.triggerRefreshEvent($.jalios.AjaxRefresh.RefreshEventType.SERIALIZE, url, $target, options);

      $.extend(true, options.params, $form.serializeObject());
      // Handle button name
      if (options.trigger) {
        var $trg = $(options.trigger);
        if ($trg.is('BUTTON, INPUT[type="submit"], INPUT[type="image"]')) {
          options.params[$trg.prop('name')] = $trg.prop('value');
        }
      }
    }

    // MagicTrick 1: use the portlet link
    if ($target.isPortlet()) {
      url = 'jcore/portal/ajaxPortal.jsp';
      options.params.portletId = $target.getJcmsId();
      options.params.portletDomId = $target.identify().attr('id');

      var usage = $target.getUsage();
      if (usage) {
        options.params.usage = usage;
      }
    }

    // MagicTrick 2: Backward Compatibility: seek hidden link
    // FIXME: parse and merge QueryString
    var $trick = $target.children('A.ajax-refresh-url').first();
    if ($trick.exists()) {
      url = $trick.prop('href');
    } // fix bug DEVJCMS-5 : DO NOT use $elm.attr('href')

    // MagicTrick 3: Use the data-jalios-ajax-refresh-url on wrapper
    // FIXME: parse and merge QueryString
    var refreshUrl = $target.attr('data-jalios-ajax-refresh-url');
    if (refreshUrl) {
      url = refreshUrl;
    }

    // MagicTrick 4: Use the data-jalios-ajax-refresh-url on trigger
    // FIXME: parse and merge QueryString
    var refreshUrl = $e.attr('data-jalios-ajax-refresh-url');
    if (refreshUrl) {
      url = refreshUrl;
    }
    return url;
  };

  var refresh = function (elm, options) {
    // Options should not be undefined
    var options = $.extend(true, {}, options);

    // Prevent multiple $() for perfs
    var $e = $(elm);
    if (!$e.exists()) {
      return false;
    }

    // Class 'disabled' will prevent submition
    if ($e.hasClass('disabled')) {
      return false;
    }

    // Retrieve target
    var $target = getTarget($e, options);
    if (!$target || !$target.exists()) {
      return false;
    }

    // Setup element options
    options = getOptions($e, $target, options);

    // Rerieve URL
    var url = getUrl($e, $target, options);

    // JCMS-7048: Propagate some parameters
    if ($.jalios.AjaxRefreshPropagation) {
      if ($.jalios.AjaxRefreshPropagation.noCssPack === true) {
        $.extend(true, options.params, { 'no-css-pack': '' });
      }
      if ($.jalios.AjaxRefreshPropagation.noJsPack === true) {
        $.extend(true, options.params, { 'no-js-pack': '' });
      }
    }

    // Confirm
    if (!options.confirm && ($e.hasClass('confirm') || $e.hasClass('confirm-danger')) && options._broked) {
      var callback = function (value) {
        if (!value) {
          return;
        }
        options.confirm = true; // ByPass this refresh loop
        if ($e.attr('data-jalios-confirm') === 'true' && $.jalios.ui.Modal.latest && $.jalios.ui.Modal.latest.trigger) {
          // Retrieve and use the first trigger
          $.jalios.DOM.follow($.jalios.ui.Modal.latest.trigger, 'modal', 'value', value);
        } else if ($e.data('jalios-confirm-callback') && typeof $e.data('jalios-confirm-callback') === 'function') {
          let callback = $e.data('jalios-confirm-callback');
          callback(value);
        } else {
          $.jalios.AjaxRefresh.refresh(url, $target, options);
        }
      };

      // Case 1: We already are in a modal
      if ($e.closest('DIV.modal').exists()) {
        $.jalios.ui.Modal.confirmInModal($e, callback);
      } else if ($e.hasClass('confirm-danger')) {
        $.jalios.ui.Modal.confirmDanger($e, callback);

        // Case 2: We are not in a modal
      } else {
        // ByPass modal AND this refresh loop
        $.jalios.ui.Modal.open($e, { confirm: true, callback: callback });
      }
      return true;
    }
    return $.jalios.AjaxRefresh.refresh(url, $target, options);
  };

  // Debug function
  var callback = function (event) {
    var broker = $.jalios.Event.match(event, 'broker', pattern, true);
    if (!broker) {
      return;
    }

    // Element
    var elm = broker.source.currentTarget;
    broker.options._broked = true;

    if (!broker.options.target) {
      broker.options.target = broker.target;
    }

    // Ajax-Refresh
    $(elm).refresh(broker.options);
  };

  var fallback = function (event) {
    var $e = $(event.currentTarget);
    if (!refresh($e, { _broked: true })) {
      return;
    }

    // Prevent click
    event.preventDefault();

    // Prevent propagation
    event.stopPropagation();

    // Prevent other handlers
    event.stopImmediatePropagation();
  };

  var register = function () {
    var $doc = $(document);

    var $body = $(document.body);

    // Register to broker
    $doc.on('jalios:broker', callback);

    // Register fallback
    $doc.on('click', 'A.ajax-refresh, button.ajax-refresh', fallback);
    $doc.on('click', ':button.ajax-refresh, :submit.ajax-refresh, :image.ajax-refresh', fallback);
    $(document).on('keydown', function(e){
      if(!$(document.activeElement).is('button.ajax-refresh') && !$(document.activeElement).is("a.ajax-refresh")) {
        return;
      }
      
      if(e.keyCode === SPACE_KEY) {
        $(document.activeElement).trigger("click");
        e.preventDefault();
      }
    });

    // Ajax-Lazy
    $('DIV.ajax-refresh-div.ajax-lazy').refresh({ nohistory: true, noscroll: true });

    // Ajax-Live
    $doc.idleTimer(20000, { name: 'LiveRefresh' });
    $doc.on('LiveRefresh.active', function () {
      $('DIV.ajax-refresh-div.ajax-live').refresh({ nohistory: true, noscroll: true, noerror: true });
    });

    // Ajax-Include
    ajaxInclude($doc);
  };

  var ajaxInclude = function ($target) {
    $target.find('A.ajax-include').each(function () {
      // Remove class
      var $this = $(this).removeClass('ajax-include');

      // Prevent in popover
      if ($this.closest('.popover').exists()) {
        return;
      }

      // Build new refresh area
      var $include = $('<div class="ajax-include-div"></div>');

      // Refresh link into refresh area and swap
      $this.refresh({
        target: $include,
        noscroll: true,
        nohistory: true,
        callback: function () {
          $this.replaceWith($include);
        }
      });
    });
  };

  const handleAjaxError = function(noerror, httpCode,  message, devMessage, $target, response) {
    // Write message
    if (noerror || (httpCode === 0 || !message)) {
      $.console.warn(message);
    } else {
      toastr.options = {
        "positionClass": "toast-top-right"
      };
      toastr.options.onclick = function(){
        window.location.href = document.URL;
      };
      toastr.error($("body").is(".is-dev-mode") ? devMessage.slice(0,500) : message);
    }

    // Debug off
    setLock($target, false);
    setDebug($target);
    
    if ($target.is("#jalios-modal")) {
      $.jalios.ui.Modal.close(true);
    }
    
    // Restore cursor
    document.body.style.cursor = "auto";
    
    throw new AjaxRefreshException(
      devMessage,
      response
    );
  }

  // ------------------------------------------
  //  PUBLIC
  // ------------------------------------------

  /**
   * Ajax-Refresh listen to DataBroker to handle ajax-refresh action to perform on wrapping ajax-refresh-div.
   * The refreshed DIV is never removed but attributes of remote DIV are added to refreshed DIV.
   * Classes with a pattern te-xt-number are overrided.
   *
   * <h5>Classes</h5>
   * <ul>
   *   <li>ajax-refresh: Backward compatibility, see data-jalios-ajax-refresh</li>
   *   <li>ajax-refresh-div: DIV to wrap the refresh area</li>
   *   <li>ajax-lazy and ajax-lazy-custom: flag to refresh area when DOM is ready. Note: ajax-lazy-custom let Portlet return a default value.</li>
   *   <li>ajax-periodical-{0}: Backward compatibility, see data-jalios-ajax-refresh-periodical</li>
   *   <li>ajax-refresh-debug: Backward compatibility, DIV used to debug/display refreshed area</li>
   *   <li>confirm: Postpone the refresh, and delegate to modal</li>
   *   <li>ajax-live: Trigger ajax-refresh after 20s of innactivity</li>
   *   <li>ajax-include: Replace given link by it's content. (used by wiki))</li>
   * </ul>
   *
   * <h5>Attributes</h5>
   * <ul>
   *   <li>data-jalios-action: Ajax-Refresh</li>
   *   <li>data-jalios-target: Targets wrapper to refresh. Used to refresh a given Portlet</li>
   *   <li>data-jalios-target-position: Relative match</li>
   * </ul>
   * <ul>
   *   <li>data-jalios-ajax-refresh: A list of options for ajax-refresh</li>
   *   <li>data-jalios-ajax-refresh-url: An URL (on Element, Wrapper, custom link) to override link's refresh (Magic Trick)</li>
   *   <li>data-jalios-ajax-refresh-periodical: Refresh periodically time in seconds. Should be use with ajax-lazy. Set on wrapper or element.</li>
   *   <li>data-jalios-ajax-refresh-timeout: Define a timeout on requests. Set on wrapper or element</li>
   *   <li>data-jalios-ajax-refresh-inner: The inner target to update. Default: use the full ajax-refresh-div. Used to append a refresh.</li>
   *   <li>data-jalios-ajax-refresh-waiting: the delay befor replacing dom (for CSS transition)</li>
   * </ul>
   * <p>
   *   Ajax-Periodical will run a delay() on function if duration &lt; 30s otherwise a postpone().
   *   Postpone do not trigger if browser is idle.
   * </p>
   *
   * <h5>Options</h5>
   *
   * A list of options of ajax-refresh value (space separated):
   * <ul>
   *   <li>nohistory: replace class ajax-action</li>
   *   <li>nofocus: replace class ajax-nofocus, prevent scroll to top (ie noscroll)</li>
   *   <li>noerror: replace class ajax-noerror, prevent alert() for error</li>
   *   <li>isform: this link relies on FORM not DIV.</li>
   *   <li>waiting: display a gray area and animated gif.</li>
   * </ul>
   *
   * <h5>Events</h5>
   * jalios:refresh: Fire an event when an ajax-refresh is performed
   * <ul>
   *   <li>jalios:refresh serialize:    called when serializing form into XHR params.</li>
   *   <li>jalios:refresh before:       called before XHR.</li>
   *   <li>jalios:refresh async:        FIXME: called for asynchronous job. Replace refresh:async</li>
   *   <li>jalios:refresh success:      called before replacing DOM. Replace refresh:before</li>
   *   <li>jalios:refresh after:        called after replacing DOM. Replace refresh:after </li>
   *   <li>jalios:refresh fail:         called before if XHR fail</li>
   *   <li>jalios:refresh helper:target called if there is no ajax-refresh-div resolved o be handle by third party (ctxmenu under body, ...)</li>
   * </ul>
   *
   * <h5>Technical</h5>
   * <ul>
   *   <li>The 'ajax-refresh:job' data is stored to lock the working wrapper</li>
   *   <li>FIXME: class 'ajax-lazy-chunk' monitor images</li>
   *   <li>ajax-lazy-load: CSS on Response used to remove JS, CSS initialisation</li>
   *   <li>disabled class on trigger prevents submit</li>
   *   <li>The <code>&lt;%@ include file='/jcore/doAjaxFooter.jspf' %&gt;</code> must be declared in DIV to handle <code>&lt;jalios:javascript&gt;</code> and <code>jcmsContext.addJavaScript()</code> </li>
   * </ul>
   *
   * <h5>RFE/FIXME</h5>
   * <ul>
   *   <li>Add support to JSON response. Use template mechanism like jQuery or Mustache. Get the template from Refresh</li>
   *   <li>Add an option to append a Waiting DIV in refresh area</li>
   *   <li>Take the focus after refresh</li>
   * </ul>
   *
   *
   *
   * @namespace $.jalios.AjaxRefresh
   * @copyright Jalios SA
   * @see $.jalios.DataBroker
   *
   * @example
   * Clicking on link1 will replace the wrapper's innerHTML by the content of fragment.html?param1=value1
   *
   * &lt;div id="wrapper1" class="ajax-refresh-div" data-jalios-ajax-refresh-url="fragment.html"&gt;
   *   &lt;div class="ajax-content"&gt;Hello HTML&lt;/div&gt;
   *   &lt;a id="link1" href="helloworld.jsp?param1=value1" class="ajax-refresh"&gt;Click to refresh&lt;/a&gt;
   * &lt;/div&gt;
   *
   * @example
   * Clicking on submit will replace the wrapper's innerHTML by the content of fragment.html?param1=value1&amp;opSubmit=true
   *
   * &lt;div id="wrapper2" class="ajax-refresh-div"&gt;
   *   &lt;form action='fragment.html' method='POST'&gt;
   *     &lt;input type="text"   name="param1"   value="value1" /&gt;
   *     &lt;input type="submit" name="opSubmit" value="true"  class="ajax-refresh" id="link2"/&gt;
   *   &lt;/form&gt;
   * &lt;/div&gt;
   *
   * @example
   * Clicking on link3 will replace the wrapper's innerHTML by the content of fragment.html?param1=value1 every 3 seconds
   *
   * &lt;div id="wrapper3" class="ajax-refresh-div" data-jalios-ajax-refresh-periodical="3"&gt;
   *   &lt;div class="ajax-content"&gt;Hello HTML&lt;/div&gt;
   *   &lt;a id="link3" href="fragment.html?param1=value1" class="ajax-refresh"&gt;Click to refresh&lt;/a&gt;
   * &lt;/div&gt;
   *
   * @example
   * Clicking on link4 will replace the wrapper's DIV.inner by the HTML content of fragment.html?param1=value1
   *
   * &lt;div id="wrapper4" class="ajax-refresh-div" data-jalios-ajax-refresh-inner="DIV.inner"&gt;
   *   &lt;div class="ajax-content"&gt;Hello HTML&lt;/div&gt;
   *   &lt;div class="inner"&gt;
   *     &lt;a id="link4" href="fragment.html?param1=value1" class="ajax-refresh"&gt;Click to refresh&lt;/a&gt;
   *   &lt;/div&gt;
   * &lt;/div&gt;
   *
   * @example
   * Clicking on link5 will replace all DIV.outside innerHTML by the content of fragment.html?param1=value1
   *
   * &lt;div id="wrapper5" class="ajax-refresh-div" data-jalios-target="DIV.outside"&gt;
   *   &lt;div class="ajax-content"&gt;Hello HTML&lt;/div&gt;
   *   &lt;a id="link5" href="fragment.html?param1=value1" class="ajax-refresh"&gt;Click to refresh&lt;/a&gt;
   * &lt;/div&gt;
   * &lt;div class="outside"&gt;&lt;/div&gt;
   *
   * @unittest js/tests/jalios/core/jalios-ajax-refresh.html
   */

  // Plugin definition
  $.jalios.AjaxRefresh = {
    /**
     * Enum for Refresh event type, to use with triggerRefreshEvent method
     */
    RefreshEventType: {
      SERIALIZE: 'serialize',
      BEFORE: 'before',
      AFTER: 'after',
      SUCCESS: 'success',
      FAIL: 'fail'
    },

    /**
     * Triggers a jalios:refresh event
     * @param {RefreshEventType} type of event
     * @param {String} url of ajax query
     * @param {jQuery} $target the target element
     * @param {Object} options the options of the ajax query
     * @param {String} html message to display
     * @fires jalios:refresh
     * @returns {Event}
     */
    triggerRefreshEvent: function (type, url, $target, options, html) {
      var event = $.Event('jalios:refresh');
      event.refresh = {};
      if (!type) {
        throw 'Type is required';
      }
      event.refresh.type = type;
      event.refresh.url = url;
      event.refresh.target = $target;
      event.refresh.options = options ? options : {};
      event.refresh.html = html;
      $(document).trigger(event);

      return event;
    },

    // Ajax-Refresh helpers
    // ====================
    /**
     * Refresh all the portlets with the given jcmsId
     * @param {string} jcmsId the Portlet's id to refresh
     * @param {function} (optional) callback to call back
     * @param {Object} data the additional data for ajax params
     * @param {object} options a list of options to apply. (see default_options)
     */
    refreshPortlet: function (jcmsId, callback, data, options) {
      if(!data){
        data = {};
      }
      if(!options){
        options = {};
      }
      
      var defaultOptions = { 
        nohistory: true,
        callback: callback,
        params: data,
        replaceTarget: true
      }
      options = $.extend(true, {}, defaultOptions, options);
      
      return !$('DIV.ajax-refresh-div.ID_' + jcmsId).refresh(options);
    },

    /**
     * Refresh a wrapper based on given element. Element is ONLY use to compute target.
     * @param {element} elm the element to use
     */
    refreshTarget: function (elm) {
      var $target = getTarget($(elm));
      if ($target) {
        $target.refresh();
      }
    },

    // Ajax-Refresh code
    // =================

    /**
     * Refresh from given URL
     *
     * @param {element} target the target element
     * @param {string} url the url to call
     * @param {object} options a list of options to apply. (see default_options)
     *
     *
     * @fires jalios:refresh
     *
     * @example
     * $('#link1').refresh();
     */
    refresh: function (url, target, options) {
      if (!url) {
        return false;
      }

      // Setup target
      var $target = $(target);
      if (!$target.exists()) {
        return false;
      }

      // Setup default options
      options = $.extend(true, {}, default_options, options);

      // Setup URL vs Data
      var qsIdx = url.indexOf('?');
      if (qsIdx > 0) {
        var qs = url.substring(qsIdx + 1);
        url = url.substring(0, qsIdx);
        $.extend(true, options.params, $.jalios.Http.toQueryParams(qs));
      }

      // Refresh:Before
      let event = $.jalios.AjaxRefresh.triggerRefreshEvent(
        $.jalios.AjaxRefresh.RefreshEventType.BEFORE,
        url,
        $target,
        options
      );

      // Convenient backup
      $.jalios.AjaxRefresh.LastRefresh = event;

      if (event.isPropagationStopped()) {
        return true;
      }

      if (!options.noresponse) {
        // Lock the target to prevent execution twice
        if (!setLock($target, true, options)) {
          return true;
        }
      }

      // Debug on
      setDebug($target, true);

      let backupUrl = url; // used to put relative url in ajax refresh events

      // Ajax URL
      if (event.refresh.url.indexOf('http') != 0) {
        url = $.jalios.Http.getBaseUrl() + event.refresh.url;
      }

      // Perform request
      var request = $.ajax({
        url: url,
        type: options.method === undefined ? 'POST' : options.method,
        data: options.params,
        traditional: true,
        cache: options.cache,
        timeout: options.timeout
      });

      // Handle response
      request.done(function (msg) {
        let event = $.jalios.AjaxRefresh.triggerRefreshEvent(
          $.jalios.AjaxRefresh.RefreshEventType.SUCCESS,
          backupUrl,
          $target,
          options,
          msg
        );

        // Skip if there is no response
        if (options.noresponse) {
          setDebug($target);
          if (options.callback) {
            options.callback($target, false);
          }
          return true;
        }

        // Fix JCMS-4097 : If a complete HTML page is retrieved (ie such as a private login HTML page)
        // consider it's a problem in the server side (eg : redirect due to authentication, invalid ajax location, ...)
        // and send a generic error message with a failure,
        // this will prevent the whole HTML page from being inserted in our current page.
        var isCompleteHTML = function (someHtml) {
          if (!someHtml) {
            return false;
          }
          var htmlTagIdx = someHtml.indexOf('<html');
          return htmlTagIdx != -1 && htmlTagIdx < 200; // a large doctype is 150 char long, the <HTML> opening tag will never be too far
        };
        if (isCompleteHTML(event.refresh.html)) {
          // Fail event
          $.jalios.AjaxRefresh.triggerRefreshEvent(
            $.jalios.AjaxRefresh.RefreshEventType.FAIL,
            backupUrl,
            $target,
            options
          );
          handleAjaxError(options.noerror,undefined, I18N.glp('warn.json.sessiontimeout'), "Full html page, an ajax refresh page shouldn't have any HTML or Body tag", $target, event.refresh.html);
        }

        // Extract and clean HTML
        var clean = cleanHTML(event.refresh.html, options.replaceTarget);
        var html = clean.html;

        // Update event with processed html
        event.refresh.html = html;

        // Check hmtl content
        if ($.jalios.Common.blank(html)) {
          setDebug($target);
          if (options.callback) {
            options.callback($target, false);
          }
          setLock($target, false, options);
          // FIXME: event abort
          return false;
        }

        // Big function wrapper used to postpone upgrade
        var upgrade = function () {
          if (options.replaceTarget) {
            $target.after(html).remove();
          } else if (options.inner) {
            $(options.inner).after(html).remove();
          } else if (options.append) {
            $target.append(html);
          } else {
            $target.html(html);
          }
          
          // Clean up handlebar templates that remains
          $target.find('script.hdb-template').remove();

          // Update classes and attributes
          if (clean.$wrap) {
            var wrap = clean.$wrap[0];
            for (var i = 0; i < wrap.attributes.length; i++) {
              var attrib = wrap.attributes[i];
              if (!attrib.specified) {
                continue;
              }
              if (attrib.name == 'class') {
                continue;
              }
              $target.attr(attrib.name, attrib.value);
            }

            $target.updateClass(wrap.className);

            // Compute options after merger of attributes (start periodical)
            setOptPeriodical($target, options);
          }

          // Scroll to position
          setScroll(url, $target, options);

          // Debug off
          setDebug($target);

          // Unlock
          setLock($target, false, options);

          // Ajax-include
          ajaxInclude($target);

          // Refresh:After
          $.jalios.AjaxRefresh.triggerRefreshEvent(
            $.jalios.AjaxRefresh.RefreshEventType.AFTER,
            backupUrl,
            $target,
            options
          );

          // Callback (excplicit)
          if (options.callback) {
            options.callback($target, html);
          }

          // Handle periodical
          if (options.periodical && options.periodical > 0) {
            var period = options.periodical;
            options.periodical = undefined; // always calculate feature
            var func = function () {
              var $e = $(options.trigger);
              options.noerror = true;
              refresh($e.exists() ? $e : $target, options);
            };

            period < 30 ? func.delay(period) : func.postpone(period);
          }
        }; // End of upgrade() function
        // HTML update could wait for a given delay for CSS Transition and postpone everything
        options.waiting && $('HTML').hasClass('mdn-cssanimations') ? upgrade.delay(options.waiting) : upgrade();
        

        if (options.focusTarget) {
          let focusInformation = $.jalios.a11y.getFocusInformation(options.focusTarget);
          $.jalios.a11y.focus(focusInformation.firstFocusableElement);
        } else if ($(options.focusElement).exists()) {
          const $focusElement = $(options.focusElement);
          if (!$focusElement.attr("tabindex") && !$focusElement.is("a, button, [role=button]")) {
            $focusElement.attr("tabindex","-1");
          }
          $.jalios.a11y.focus(options.focusElement);
        } else if (options.autoFocus) {
          // Focus first link if available, if there's an input, smartFocus will apply (see jalios-widget.js)
          let focusInformation = $.jalios.a11y.getFocusInformation($target);
          $.jalios.a11y.focus(focusInformation.firstFocusableElement);
        }
      });
      // Handle fails
      request.fail(function (jqXHR, textStatus) {
        // Fix JCMS-9035 - Javascript ajax request timeout provides no feedback to user
        let isTimeout = textStatus === "timeout";
        // Fix JCMS-4179 - Javascript error with ttcard
        var userAborted = jqXHR && !isTimeout && !jqXHR.getAllResponseHeaders();
        if (userAborted) {
          return;
        }

        // Fail event
        event.refresh.type = 'fail';
        $(document).trigger(event);
        handleAjaxError(options.noerror, jqXHR.status, I18N.glp('warn.json.sessiontimeout'), jqXHR.status + " - " + jqXHR.responseText, $target, jqXHR.responseText);
      });

      return true;
    }
  };

  // ------------------------------------------
  //  HELPERS
  // ------------------------------------------

  /**
   * Call Ajax-Refresh on given element
   */
  $.fn.refresh = function (options) {
    return this.each(function () {
      refresh($(this), options);
    });
  };

  // ------------------------------------------
  //  READY
  // ------------------------------------------

  // Plugin initialization on DOM ready
  $(document).ready(function ($) {
    register();
  });
})(window.jQuery);

// ------------------------------------------
//  DEPRECATED
// ------------------------------------------

jQuery(document).on('jalios:refresh', function (event) {
  if (!event || !event['refresh']) {
    return false;
  }
  if (!Event.observe) {
    return false;
  }

  var data = event['refresh'];

  try {
    if (data.type == 'before') {
      var id = event.refresh.target.first().identify().attr('id');
      $(document).fire('refresh:before', { wrapper: id });
    } else if (data.type == 'after') {
      var id = event.refresh.target.first().identify().attr('id');
      $(document).fire('refresh:after', { wrapper: id });
    }
  } catch (ex) {
    jQuery.console.error('AjaxRefresh', 'Exception while firing refresh:after', ex);
  }
});

JCMS = JCMS || {};
JCMS.ajax = JCMS.ajax || {};
JCMS.ajax.Refresh = JCMS.ajax.Refresh || {};

JCMS.ajax.Refresh.getFragment = function (event) {
  jQuery.console.warn('[Deprecated] getFragment() Should use new Ajax-Refresh');
  jQuery.console.stacktrace();

  var fragment = $(document.body);
  if (event && event.refresh) {
    return $(event.refresh.target[0]);
  }
  return fragment;
};

JCMS.ajax.Refresh.refreshDIV = function (refreshDiv, url) {
  jQuery.console.warn('[Deprecated] refreshDIV() Should use new Ajax-Refresh');
  jQuery.console.stacktrace();
  jQuery(refreshDiv).refresh({ url: url });
};

JCMS.ajax.Refresh._request = function (refreshDiv, url, options) {
  jQuery.console.warn('[Deprecated] _request Should use new Ajax-Refresh', refreshDiv);
  jQuery.console.stacktrace();
  options['url'] = url;
  options['target'] = refreshDiv;
  jQuery(refreshDiv).refresh(options);
};

JCMS.ajax.Refresh.refreshFromInput = function (input, refreshDiv, callback) {
  jQuery.console.warn('[Deprecated] refreshFromInput() Should use new Ajax-Refresh');
  jQuery.console.stacktrace();
  jQuery(input).refresh({
    target: refreshDiv,
    callback: callback
  });
};
