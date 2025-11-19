
/**
 * Hack Bootstrap TypeAhead to provides improved features<br/>
 * <br/>
 * 
 * <ul>
 *   <li>Handle TextArea (show menu under selection)</li>
 *   <li>Handle Callback</li>
 *   <li>Fire <code>jalios:autocomplete</code> event </li>
 * </ul>
 * 
 * @copyright Jalios SA
 * @see $.jalios.AjaxRefresh
 * 
 * @example
 * 
 * &lt;input class="typeahead" data-jalios-ajax-refresh-url="path/to/page.jsp"/&gt;
 * 
 * &lt;ul class="dropdown-menu"&gt;
 *   &lt;li data-value='itemId1'&gt;&lt;a href='#'&gt;Matching Item 1&lt;/a&gt;&lt;/li&gt;
 *   &lt;li data-value='itemId2'&gt;&lt;a href='#'&gt;Matching Item 2&lt;/a&gt;&lt;/li&gt;
 *   &lt;li class='ajax-refresh'&gt;&lt;a href='path/jsp'&gt;&lt;%= glp("...") %&gt;&lt;/a>&lt;/li&gt;
 * &lt;/ul&gt;
 */


!function ($) {
  
  // ------------------------------------------
  //  TYPEAHEAD PROTOTYPE: lookup
  // ------------------------------------------
  // 
  // - TextArea Hook
  // - Handle Ajax-Refresh
  // - Require 2 chars min
  
  var ajaxTimeout = false;
  var lookup = Typeahead.prototype.lookup;
  Typeahead.prototype.lookup = function(explicit) {

    // Default behavior
    if (!this.options.ajax){ return $.proxy(lookup,this)(); }

    if(this.$element.data('autocomplete-lookup-event')) {
      // Handle custom autocomplete-lookup-event
      var autocompleteInfos = {typeahead: this, explicit : explicit, stop: false };
      $(this.$element).trigger(this.$element.data('autocomplete-lookup-event'), [autocompleteInfos]);
      if (autocompleteInfos.stop) { return this; }
    }
    // Hook for TEXTAREA (scoped to prevent to many events)
    else if (this.$element.prop('tagName') == 'TEXTAREA') {
    
      var event = { type: 'lookup', typeahead: this, explicit : explicit } 
      Typeahead.hooks.fire(event);
      if (event.stop){ return this; }
      
    } else {
    
      // Retrieve textfield value
      this.query = this.$element.val() || '';
      
      // Trigger behavior when no value was yet entered
      var lookupOnEmpty = this.$element.attr('data-ac-lookup-empty') || false;
      if (this.query === '' && !lookupOnEmpty) {
        return this.shown ? this.hide() : this;
      }
      
      // Trigger behavior based on length of query text
      var minLength = this.$element.attr('data-ac-min-length') || $.jalios.Properties.get('autocomplete-min-chars');
      if (!lookupOnEmpty && (this.query.length < minLength)) {
        return this.hide();
      }

    }
    
 // Perform Ajax-Refresh
    var that = this;
    if (ajaxTimeout) clearTimeout(ajaxTimeout);
    ajaxTimeout = setTimeout(function(){
      ajaxLookup(that);
      ajaxTimeout = false;
    }, $.jalios.Properties.get('autocomplete-chooser-timeout'));
    
    // Trigger behavior to keep result list open while refreshing
    var lookupPendingRefresh = this.$element.data('ac-lookup-pending-refresh');
    if (lookupPendingRefresh) {
      return this.show();
    }
    
    return this.hide();
  }
  
 
  var ajaxLookup = function(that) {
    var options = {
      'url'       : that.options.ajax,
      'params'    : { 'autocomplete' : that.query },
      'noscroll'  : true,
      'nohistory' : true,
      'waiting'   : false,
      'noerror'   : true,
      'callback'  : function() { that.show(); }
    };
    $.extend(true, options, that.options.ajaxOptions);
    that.$menu.refresh(options); 
  }
  
  // ------------------------------------------
  //  TYPEAAHEAD PROTOTYPE: click
  // ------------------------------------------
  //
  // - Adds the click event when the select is performed
  
  var click = Typeahead.prototype.click;
  Typeahead.prototype.click = function (e) {
    if(e.target && $(e.target).data('already-clicked')) {
      return true;
    }
    e.stopPropagation()
    e.preventDefault()
    this.select(undefined, e)
  }
  
  // ------------------------------------------
  //  TYPEAAHEAD PROTOTYPE: select
  // ------------------------------------------
  //
  // - Perform Ajax-Refresh on LI.ajax-refresh
  // - Handle explicit callback
  // - Handle Event callback 
  
  var select = Typeahead.prototype.select;
  Typeahead.prototype.select = function (active, e) {
    if (ajaxTimeout) clearTimeout(ajaxTimeout);
    
    if(this.$element.data('autocomplete-select-event')) {
      // Handle custom autocomplete-select-event
      var autocompleteInfos = {active: active, event: e, typeahead: this};
      $(document).trigger(this.$element.data('autocomplete-select-event'), [autocompleteInfos]);
      return;
    }

    // 0. Retrieve value
    var $e = this.$element;
    var $active = active || this.$menu.find('.active');
    var value = $active.attr('data-value');
    
    if (e) {
      var $target = $(e.target);
      var $targetRefresh = $target.hasClass("typeahead-ajax-refresh") ? $target : $target.closest(".typeahead-ajax-refresh");
      if ($targetRefresh.exists()) {
        
        var options = {
          params: $targetRefresh.data("jalios-typeahead-options-params")
        }
        
        this.$menu.refresh(options);
        return;
      }
    }
    
    if ($active.hasClass("typeahead-layout")) {
      return;
    }
    
    // Fix bug JCMS-4504 "There is no matching result." is clickable and redirect to home page
    if ($active.is('.nomatch')) {
      return this.hide();
    }
    
    // 1. Ajax-refresh Hook
    var that = this;
    if ($active.hasClass('ajax-refresh')){
      $e.focus();
      $active.find('A').refresh({
        'noscroll'  : true,
        'nohistory' : true,
        'callback'  : $.proxy(function(){
           var $select = that.$menu.find('LI.select').first();
           if ($select.exists()){ that.select($select); }
        }, that)
      });
      return this.show();
    }
    
    // 2. Hook
    var event = { type: 'select', typeahead: this, $active: $active } 
    Typeahead.hooks.fire(event);
    
    if (!event.stop) {
      // 3. Default behavior
      if (value){
        $.proxy(select,this)();
      
      // 4. Follow AHref
      } else if ($active.exists() || ($target && $target.closest(".typeahead-link").exists())) {
        var $link;
        if(e && $(e.target).is('A')) {
          $link = $(e.target);
        } else {
          var $parentLink = e ? $(e.target).closest("A.typeahead-link") : undefined;
          if ($parentLink && $parentLink.exists()) {
            // Force a link on the target parent
            $link = $parentLink;
          } else {
            // Use the first link in the active item
            $link = $active.find('A');
          }
        }
        
        if (!$link) {
          return;
        }
        
        var href = $link.prop("href");
        var protocol = $link[0].protocol;
        
        if (!protocol) {
          href = $(document).find('base').prop('href') + href;
        } else if(protocol.indexOf('http') < 0) { // NOT http(s) (can be tel:, mailto: ...)
          $link.data('already-clicked', true);
          $link.click();
        }
        
        if (e && e.which === 2) {
          // Handle middle click
          var win = window.open(href, '_blank');
        } else {
          // Default behaviour (Left click)
          $.jalios.Browser.redirect(href, false, false); 
        }
      
      } else {
	    // 5. Submit Form
        if ($e[0] && $e[0].form) {
          var tcform = $e[0].form;
          // Super kludge solution needed by EXPLORER-91
          if (tcform && !$(tcform).hasClass('nosubmit-on-autocomplete')) {
            tcform.submit();
          }
        }
      }
    }
    
    // 7. Trigger Event
    var event = $.Event("jalios:autocomplete");
    event.autocomplete = this;
    event.autocomplete.value = value;
    $(document).trigger(event);
    
    return this.hide();
  }
  
  // ------------------------------------------
  //  TYPEAAHEAD PROTOTYPE: listen
  // ------------------------------------------
  
  var keydown = Typeahead.prototype.keydown;
  Typeahead.prototype.keydown = function (e) {
    
    // Flag to indicate we are editing
    if (e.keyCode != 9){
      this.$element.data('autocomplete-update', true);
    }

    // CTRL + SPACE
    if (e.keyCode == 32 && e.ctrlKey){
      this.lookup(true)
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Call previous declaration
    $.proxy(keydown, this)(e);
  }
  
  // ------------------------------------------
  //  TYPEAAHEAD PROTOTYPE: show
  // ------------------------------------------
  //
  // - For TextArea display menu under carret/selection
  
  var show = Typeahead.prototype.show;
  Typeahead.prototype.show = function (e) {
    $.proxy(show,this)(e);

    if (!this.$element.is(':visible')){ 
      return this.hide();
    }
    
    if (this.$element.prop('tagName') != 'TEXTAREA'){
      
      var $m =  this.$menu;
      var ml = $m.offset().left;
      var wLeft = $(window).width() + $(window).scrollLeft();
      
      if (ml+$m.width() > wLeft){
        $m.find('UL').css('width', (wLeft -ml -20)+'px'); // Resize menu if larger than window 
      }
      
      return this; 
    }
    
    var event = { type: 'show', typeahead: this } 
    Typeahead.hooks.fire(event);
    
    return this;
  }
  
  //------------------------------------------
  //  TYPEAAHEAD PROTOTYPE: blur
  // ------------------------------------------
  //
  //  Handles cursor exiting the textbox
  //  @see https://github.com/twbs/bootstrap/issues/2715
  //  @see https://github.com/tcrosen/twitter-bootstrap-typeahead/issues/24 
  //
  var blur = Typeahead.prototype.blur;
  Typeahead.prototype.blur = function(e) {
    var that = this;
    e.stopPropagation();
    e.preventDefault();
    setTimeout(function() {
      if (!that.$element.is(':focus') && !that.$menu.is(':hover')) {
        that.hide();
      }
    }, 150)
  }
  
  // ------------------------------------------
  //  TYPEAAHEAD PROTOTYPE: clear
  // ------------------------------------------
  //
  // - Override Typeahead default behavior for these events
  
  Typeahead.prototype.clear = function (e) {}
  
  // ------------------------------------------
  //  TYPEAAHEAD PROTOTYPE: next/prev
  // ------------------------------------------
  //
  // - Bypass LI.typeahead-layout once
  
  var next = Typeahead.prototype.next;
  Typeahead.prototype.next = function (e) {
    $.proxy(next,this)(e);
    if (!this.$menu.find('.active').is('.typeahead-layout')){ return; }
    $.proxy(next,this)(e);
  }
  
  var prev = Typeahead.prototype.prev;
  Typeahead.prototype.prev = function (e) {
    $.proxy(prev,this)(e);
    if (!this.$menu.find('.active').is('.typeahead-layout')){ return; }
    $.proxy(prev,this)(e);
  }
  
  // ------------------------------------------
  //  DEFAULT HOOK 
  // ------------------------------------------
  
  Typeahead.hooks = $.Callbacks();
  
  // Register
  var register = function(){
    $(document).on('focusin', '.typeahead[data-jalios-ajax-refresh-url]', callback);    
    $(document).on('jalios:refresh', hide);
    $(document).on('click', handleHide);
  }
  
  var handleHide = function(event) {
    var $target = $(event.target);
    if ($target.exists && ($target.hasClass("typeahead-menu")
        || $target.hasClass("typeahead-input")
        || $target.hasClass("typeahead-label")
        || $target.parent().hasClass("typeahead-container"))
    ) {
      return;
    }
    var $typeaheadMenu = $(".typeahead-menu")
    if($typeaheadMenu.is(':visible')) {
      $typeaheadMenu.hide();
    }
  }
  
  
  var hide = function(event){
    var refresh = $.jalios.Event.match(event, 'refresh', 'success')
    if (!refresh){ return; }
    if (refresh.target && refresh.target.hasClass('typeahead-menu')){ return; }
    var $typeaheadMenu = $(".typeahead-menu")
    if($typeaheadMenu.is(':visible')) {
      $typeaheadMenu.hide();
    }
  }
    // Callback
  var callback = function(event){
    var $e = $(event.currentTarget);
    
    // Quick escape
    if ($e.data('typeahead')) { return; }
    
    // Build new menu or use existing one
    // Allow typeahead-menu to be used from existing DOM through selector 
    // specified in "data-ac-typeahead-menu" attribute of input
    // (eg: used for topbar workspace preloading)
    var $menu = $($e.data('ac-typeahead-menu'));
    if (!$menu.exists()) {
      $menu = $('<div class="typeahead-menu ajax-refresh-div"></div>');
    }
    
    // Ajax-Refresh URL
    var url = $e.attr('data-jalios-ajax-refresh-url');
    if (url) {
      $e.attr('autocomplete','off');
      $e.typeahead({
        menu: $menu,
        ajax: url,
        ajaxOptions: $e.data('jalios-options')
      });
    }
  } 
  
  // Plugin initialization on DOM ready
  $(document).ready(function($) {
    register();
  });
  
  
}(window.jQuery);

