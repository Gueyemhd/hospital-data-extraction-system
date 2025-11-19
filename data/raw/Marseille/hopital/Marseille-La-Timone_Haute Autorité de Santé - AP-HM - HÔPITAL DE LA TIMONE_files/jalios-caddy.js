!function ($) {
  
  // Register
  var register = function(){
    // Register to broker
    $(document).on("jalios:refresh", callback);
  }
  
  /**
   * Plugged into Ajax-Refresh mechanism:
   * <ul>
   *   <li>Before: perform modification on request URL</li>
   *   <li>After: update all icons based on refreshed content</li> 
   * </ul>
   */
  var callback = function(event){
    
    // ----------
    //  Before
    // ----------
    
    var refresh = $.jalios.Event.match(event, 'refresh', 'before');
    if (refresh && $(refresh.options.trigger).hasClass('caddyUpdate')){
    
      var params = refresh.options.params || {};
      params.elmIds = $('.caddyUpdate').identify().map(function() { 
        
        var id  = $(this).attr('id'); 
        var caddyParams = $.jalios.Http.toQueryParams($(this).attr('data-jalios-caddy-params'));
        for (var key in caddyParams) {
          params[id + key] = caddyParams[key];
        }
        return id;
      
      }).get();
      params.ws = Element.getJcmsId(document.body,'WS_');
    }
    
    // ----------
    //  After
    // ----------
    
    var refresh = $.jalios.Event.match(event, 'refresh', 'after');
    if (refresh && $(refresh.options.trigger).hasClass('caddyUpdate')){
         
      var params = refresh.options.params;
      if (!params){ return; }
      
      params.elmIds.each(function(id) {
        var $elm = $('#'+id);
        var $rep = $('#' + id + 'Replacement > *:first-child');
        $elm.replaceWith($rep);
        $rep.attr('id',id);
      });
      
      // update topbar to ensure caddy icon is refreshed (and displayed or hidden if item count change from/to zero)
      $(".topbar-caddy-menu").refresh();
      
      // Fire event
      var event = jQuery.Event("jalios:caddy");
      $(document).trigger(event);
    }
    
    $('#caddyPopinAjaxReplacements').remove();
  }
  
  // Plugin initialization on DOM ready
  $(document).ready(function($) {
    register();
  });
  
}(window.jQuery);