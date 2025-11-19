var CtxMenuManager = CtxMenuManager || {}; // DuckTape
!function ($) {

  // ------------------------------------------
  //  PRIVATE
  // ------------------------------------------

  var register = function(){

    // Register to broker
    $(document).on("jalios:broker", callback);

    // Register fallback
    $(document).on('click', '.ctxmenu', fallback);

    // Register fallback
    $(document).on('contextmenu', '.ctxmenu-right', fallback);

    // Prevent click on LI.disabled
    $(document).on('click', 'UL.dropdown-menu LI.disabled A', function(event){ event.preventDefault(); });

    // Hide menu on refresh
    $(document).on('jalios:refresh', function(event){
      var refresh = $.jalios.Event.match(event, 'refresh', 'before');
      if (refresh){ hide(); }
    });

    // If event 'hide.bs.dropdown' is not prevented jQuery trigger 'hide'
    // on document then call target.hide() and break behavior
    // - see tabdrop
    // - see datetimepicker
    $(document).on('hide.bs.dropdown', function(event){
      event.preventDefault();
      $(event.target).removeClass('open');
    });
  }

  var pattern = /ctxmenu(-right)*/i;
  var callback = function(event){

    // Check event
    var broker = $.jalios.Event.match(event, 'broker', pattern, true, true);
    if (!broker){ return; }

    // Element
    var elm = broker.source.currentTarget;

    // Call show() function
    show(elm, broker.options);
  }

  var fallback = function(event){

    // Prevent click
    event.preventDefault();

    // Prevent bootstrap-dropdown
    event.stopImmediatePropagation();

    // Call show() function
    show(event.currentTarget);
  }

  // ------------------------------------------
  //  SHOW / RELOCATE
  // ------------------------------------------


  var show = function(trigger, options){

    if (!trigger){ return false; }
    var $trigger = $(trigger);

    // Add clue
    $(document.body).addClass('contextual-menu-displayed');
    $trigger.addClass('ctxTrigger');
    $trigger.parent().addClass('ctxTriggerParent');

    // Kludge patch for compatibility with widget.js and other ptototype functions
    CtxMenuManager.latestElement = $trigger.identify().attr('id');
    $.jalios.ui.CtxMenu.$latest  = $trigger;

    $trigger.dropdown('toggle');
    $trigger.off('click'); // Kludge ByPass Cache
  }

  var hide = function(){
    var $latest = $.jalios.ui.CtxMenu.$latest;
    if ($latest){
      $.jalios.ui.CtxMenu.hide();
      $latest.removeClass('ctxTrigger');
      $latest.parent().removeClass('ctxTriggerParent');
    }

    $(document.body).removeClass('contextual-menu-displayed');

    return false;
  }

  var setup = function($ctxmenu, $trigger){

    var hint = $ctxmenu.data('ctxmenu.hint');
    if (hint){ $ctxmenu.removeClass(hint); }

    var $context = $trigger;
    for (var i = 0 ; i < 10; i++){
      var hint  = $context.matchClass(/hints-([\w-]+)/, 1)
      if (!hint || hint.length <= 0){
        $context = $context.parent();
        continue;
      }

      hint = hint[0];
      $ctxmenu.addClass(hint);
      $ctxmenu.data('ctxmenu.hint', hint);
      return $ctxmenu;
    }

    return $ctxmenu;
  }

  var relocate = function($ctxmenu){

    if (!$ctxmenu.html()){
      if ($.jalios.ui.CtxMenu.$latest) {
        $.jalios.ui.CtxMenu.$latest.dropdown('toggle');
      }
      return;
    }

    // Clean all onclick in LI.disabled
    $ctxmenu.find('LI.disabled A[onclick]').each(function(){
      $(this).removeAttr('onclick');
    });

    var $win  = $(window);
    var winW  = $win.width();
    var winSL = $win.scrollLeft();
    var winH  = $win.height();
    var winST = $win.scrollTop();

    $ctxmenu.addClass('open');
    var bounds = $ctxmenu.bounds();
    var overflow = (bounds.left  + bounds.width) - (winW + winSL);
    var sublow   = (bounds.right + bounds.width) - (winW + winSL);
    if (sublow > 0){
      $ctxmenu.addClass('dropdown-menu-right');
      var left = overflow > 0 ? bounds.left - overflow : bounds.left;
      if (left < 0){ left = 0; }
      $ctxmenu.css('left', left + 'px');
    } else {
      $ctxmenu.css('left', bounds.left+12 + 'px');
      $ctxmenu.removeClass('dropdown-menu-right');
    }

    // Accessibility
    $ctxmenu.attr('aria-hidden', 'false');
    var targetId = $ctxmenu.attr('id');
    if (targetId && targetId !== '') {
      $("."+targetId).attr('aria-expanded', 'true');
    }

    var top = bounds.top;
    if (bounds.bottom > winH + winST){
      top = bounds.top - (bounds.bottom - winH - winST) - 10;
      $ctxmenu.css('top', top + 'px');
    }
    if (top < 40 ){
      $ctxmenu.css('top', 40 + 'px');
    }
  }

  // ------------------------------------------
  //  DROPDOWN PROTOTYPE: getParent
  // ------------------------------------------

  $.fn.dropdown.clearMenus = function(e) {
    var $target = e && $(e.target);

    if($target && !$target.hasClass('dropdown-backdrop') && ($target.hasClass('dropdown-clear') || $target.closest('.dropdown-clear').length > 0)) {
      // Only clear menu with .dropdown-clear class
      var relatedTarget = {
        relatedTarget: this
      };
      
      $target.closest('.dropdown-clear').removeClass("open");
      $target.closest('.dropdown-menu').trigger(e = $.Event('hide.bs.dropdown', relatedTarget));
      if (!e.isDefaultPrevented()) {
        $target.closest('.dropdown-menu').trigger('hidden.bs.dropdown', relatedTarget);
      }      
      return false;
    }
    
    var closeCurrentMenu = true;
    if($target && $target.closest("[data-toggle=dropdown]").length === 0 && !$target.hasClass('dropdown-backdrop') && !$target.hasClass('dropdown-clear') && !$target.closest('.dropdown-clear').length > 0
       && ($target.data('dropdown-keep-open') || $target.closest('.keep-open').length > 0)) {
      closeCurrentMenu = false;
    }
    
    var returnValue = true;

    $('.dropdown, .dropdown-menu').each(function () {
      var $this = $(this);

      if (!closeCurrentMenu) {
        if ($target.closest(".dropdown-menu").exists() && $this[0] === $target.closest(".dropdown-menu")[0]) {
          return true;
        }
        if ($target.closest(".dropdown").exists() && $this[0] === $target.closest(".dropdown")[0]) {
          return true;
        }
      }
      
      if (!$this.hasClass('open') && !$this.parent().hasClass('open')) {
        returnValue = false;
        return;
      }

      $this.removeClass('open');
      $this.parent().removeClass('open');
      //Remove all dropdown backdrop (Added for touch devices since bootstrap 3.3.7)
      $('.dropdown-backdrop').remove();

      // Accessibility
      var targetId = $this.attr('id');
      if (targetId && targetId !== '') {
        $("."+targetId).attr('aria-expanded', 'false');
      }
      
      var relatedTarget = {
        relatedTarget: this
      };

      $this.trigger(e = $.Event('hide.bs.dropdown', relatedTarget));
      if (!e.isDefaultPrevented()) {
        $this.trigger('hidden.bs.dropdown', relatedTarget);
      }
    });

    return returnValue;
  };

  $.fn.dropdown.getParent = function($trigger, fast) {

    if (!$trigger || !$trigger.exists() || !$trigger.attr('class') ){
      return hide();
    }

    // Static Menu
    $ctxmenu = getLocalParent($trigger, fast);
    if ($ctxmenu && $ctxmenu.exists()){ return setup($ctxmenu, $trigger); }

    // Using Ajax-Refresh
    var $ctxmenu = getAjaxParent($trigger, fast);
    if ($ctxmenu && $ctxmenu.exists()){ return setup($ctxmenu, $trigger); }


    // Hide menu
    return false;
  }

  var getLocalParent = function($trigger, fast, bypass){ // Kludge way to do this
    if (fast){ return false; }

    var clazz = $trigger.attr('class');
    if (!clazz){ return false; }

    if ($trigger.hasClass('mceButton')) {
      return false;
    }

    var selector = '#'+clazz.trim().replace(/\S+[%\/]+\S+/g,'').trim().split(/\s+/).join(', #'); // Backward compatible but not fast / simple
    var $menu = $(selector);
    if (!$menu.exists()){ return false; }

    if (!$menu.hasClass('dropdown-menu')){
      $menu.addClass('dropdown-menu');
      $menu.css('display', '');
      $menu.appendTo(document.body);
    }

    // Position
    var bounds = $trigger.bounds();
    $menu.css('top', bounds.bottom+'px').css('left', bounds.left+'px');

    if (!bypass){
      $menu.addClass('open');
      relocate($menu);
      $menu.removeClass('open');
    }

    return $menu;
  }


  var cache = false
  var getAjaxParent = function($trigger, fast) {

    // Check trigger
    if (!($trigger.hasClass('ctxmenu')
       || $trigger.hasClass('ctxmenu-right')
       || $trigger.attr('data-jalios-action') == 'ctxmenu')
       || $trigger.attr('data-jalios-action') == 'ctxmenu-right'){ return false; }

    if (fast)                       { return $('UL#ctxAjaxMenu'); }
    if (cache && $trigger.is(cache)){ return $('UL#ctxAjaxMenu'); }
    cache = $trigger;

    // Build menu
    var $ctxmenu = $('UL#ctxAjaxMenu');
    if (!$ctxmenu.exists()){
      $ctxmenu = $('<ul id="ctxAjaxMenu" class="dropdown-menu" role="menu" data-jalios-ajax-refresh-url="jcore/ctxmenu/ctxmenu.jsp"></ul>').appendTo($(document.body));
    }

    // Reset content
    $('#ctxAjaxMenu').html('<li style="padding-left:10px;">'+$.jalios.I18N.glp('info.msg.loading')+'</li>');

    var params = { 'ctxId': $trigger.getJcmsId(), 'classes': $trigger.attr('class') }

    // Kludge: look for TreeCat
    var $t = $trigger.closest('.TreeCat')
    if ($t.exists()){
      params.context = $t.attr('id');
    }

    // Simulate Ajax
    $trigger.refresh({
      'target'    : '#ctxAjaxMenu',
      'params'    : params,
      'noscroll'  : true,
      'nohistory' : true,
      'waiting'   : false,
      'callback'  : relocate
    });

    // Position
    var bounds = $trigger.bounds();
    $ctxmenu.css('top', bounds.bottom+'px').css('left', bounds.left+'px');

    // Return menu
    return $ctxmenu;
  }

  // ==========================================
  //  CLOSEST HACK
  // ==========================================

  var closest = $.fn.closest;
  $.fn.closest = function( selectors, context ){
    var match = $.proxy(closest,this)(selectors, context);
    if (match.exists()){ return match; }

    var $latest = $.jalios.ui.CtxMenu.$latest;
    if (!$latest){ return match; }

    if ($('#ctxAjaxMenu').is(this) || $('#ctxAjaxMenu').find(this).exists()){
      return $.proxy(closest, $latest)(selectors, context);
    }

    var lp = getLocalParent($latest, false, true);
    if (lp && lp.find(this).exists()){
      return $.proxy(closest, $latest)(selectors, context);
    }

    return match;
  }

  // ==========================================
  //  PUBLIC
  // ==========================================

  // Namespace
  if (!$.jalios)    { $.jalios    = {}; }
  if (!$.jalios.ui) { $.jalios.ui = {}; }

  /**
   * Utility function for ctxmenus
   */
  $.jalios.ui.CtxMenu = {
    'show'   : show,
    'hide'   : $.fn.dropdown.clearMenus
  }

  // ------------------------------------------
  //  DOM Ready
  // ------------------------------------------

  // Plugin initialization on DOM ready
  $(document).ready(function($) {
    register();
  });

}(window.jQuery);

// ------------------------------------------
//  DEPRECATED
// ------------------------------------------

CtxMenuManager.hideAllCtxtMenus = function(){
  jQuery.fn.dropdown.clearMenus();
}
