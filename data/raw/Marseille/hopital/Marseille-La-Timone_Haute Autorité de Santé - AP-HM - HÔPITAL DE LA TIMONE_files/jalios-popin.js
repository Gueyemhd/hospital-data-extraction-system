!function ($) {
  
  // Namespace
  if (!$.jalios)      { $.jalios    = {}; }
  if (!$.jalios.ui)   { $.jalios.ui = {}; }
  
  
  // ------------------------------------------
  //  PRIVATE: Register
  // ------------------------------------------
  
  // Action regexp
  var pattern = /popin/i;
  
  
  // Debug function
  var callback = function(event){
    
    // Check event
    var broker = $.jalios.Event.match(event, 'broker', pattern, true);
    if (!broker){ return; }
    
    // Element
    var elm = broker.source.currentTarget;
    
    // Call show() function
    $.jalios.ui.Popin.open(elm);
    
  }
  
  
  var register = function(){
    // Register to broker
    $(document).on("jalios:broker", callback);
  }
  
  
  var getPopinRefresh = function(){
  
    // Build a popin container
    $popin = $('#PopinBottomLeft');
    if ($popin.exists()){
      $popin.remove();
      $popin = $('#PopinBottomLeft');
    }

    if (!$popin.exists()){
       $popin = $('<div id="PopinBottomLeft" class="popin in fade bottom-left"></div>').appendTo('BODY');
    }
    
    // Build popin option
    var options = {
      message: { html: '<div class="ajax-refresh-div"></div>' }, // $trigger.attr('title')
      type: 'popin',
      fadeOut: { enabled: true, delay: 3000 }
      //onClosed : function(){ }
    }
    
    // Show the popin
    var notif = $popin.notify(options);
    notif.show();
    
    // Get ajax-refresh-div
    return notif.$note.find('.ajax-refresh-div').first();
  }
  
  // ------------------------------------------
  //  PUBLIC
  // ------------------------------------------
  
  /**
   * Manage Jalios Popins using <a href="http://nijikokun.github.com/bootstrap-notify/">Bootstrap/Notify</a> framework.
   * <br/><br/>
   * 
   * <h5>Behavior</h5>
   * 
   * Open a popin on BottomLeft screen corner, then perform an Ajax-Refresh with trigger.<br/>
   * Triggers must contains <code>data-jalios-action="popin"</code> there is no class fallback.
   * 
   * @namespace $.jalios.ui.Popin
   * @copyright Jalios SA
   * @see $.jalios.ui.Modal
   * @see $.jalios.DataBroker
   * @see $.jalios.AjaxRefresh
   * 
   */
  $.jalios.ui.Popin = {
    
    openFromUrl: function(url, options){
      
      // Create popin
      var $div = getPopinRefresh();
     
      // Perform refresh
      $div.refresh({
        'url'       : url,
        'noscroll'  : true,
        'nohistory' : true,
        'waiting'   : options ? options.waiting : false
      });
    },
    
    open: function(trigger, options){
      if (!trigger){ return false; }
      var $trigger = $(trigger);
      
      // Create popin
      var $div = getPopinRefresh();
     
      // Perform refresh
      $trigger.refresh({
        'target'    : $div,
        'noscroll'  : true,
        'nohistory' : true,
        'waiting'   : options ? options.waiting : false
      });
    }
  }
  
  
  // Plugin initialization on DOM ready
  $(document).ready(function($) {
    register();
  });
  
  
}(window.jQuery);