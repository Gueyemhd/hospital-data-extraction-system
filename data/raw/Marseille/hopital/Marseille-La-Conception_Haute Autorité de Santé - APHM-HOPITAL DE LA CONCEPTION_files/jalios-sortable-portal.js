!function ($) {

  var register = function(){
    $(document).on("jalios:sortable",  callback);
  }
  
  var callback = function(event){

    var sortable = $.jalios.Event.match(event, 'sortable');
    if (!sortable){ return; }
    
    update(sortable.container, false, false, event.sortable.ui.sender);
    
    // Fix JCMS-4311 : cannot easily drag portlet in empty column
    // --> ensure empty column get some padding so items can be draged in it, see doPortletColumnFullDisplay.jsp
    var $container = $(sortable.container);
    if ($container.children().length == 0) {
      $container.css( "padding-bottom", "50px" );
    }
  }
  
  var update = function(container, jcmsId, remove, senderContainer){
    
    var $container = $(container);
    if (!$container || !$container.hasClass('dnd-container')){ return; }

    // If dnd-single-update was specified on container, 
    // Only perform one ajax refresh operation for all, and merge all container parameters at once 
    var singleDndUpdate = $container.hasClass('dnd-single-update');     
    
    var callback = false; 
     // Refresh if we switch sender, unless single update event was requested
    if (!jcmsId && senderContainer && !singleDndUpdate) {
      callback = function(){
        $container.refresh({ 'noscroll': true,  'nohistory': true });
      }
    }
    
    var params = $.jalios.Sortable.serialize($container, 'dnd-sortable', senderContainer);
    if (singleDndUpdate && senderContainer !== null) {
      var senderSerialize = $.jalios.Sortable.serialize(senderContainer, 'dnd-sortable-sender');
      params = $.extend(params, senderSerialize);
    }
    
    // Add new element
    if (jcmsId && !remove){
      var key = $.jalios.Sortable.getSortableKey($container);
      params[key].push(jcmsId);
    }
    
    // Remove new element
    else if (jcmsId && remove){ 
      var key = $.jalios.Sortable.getSortableKey($container);
      var array = params[key];
      array.splice($.inArray(jcmsId, array),1);
    }
    
    // Response on add/remove, unless dnd-noresponse requested
    var noresponse = $container.hasClass('dnd-noresponse') || !jcmsId;    
    
    $container.refresh({
      'noscroll'   : true,
      'nohistory'  : true,
      'noresponse' : noresponse, 
      'callback'   : callback,
      'params'     : params
    });
  }
  
  // ------------------------------------------
  //  PUBLIC
  // ------------------------------------------
  
  // Namespace
  if (!$.jalios)          { $.jalios = {}; }
  if (!$.jalios.Sortable) { $.jalios.Sortable = {}; }
  
  $.jalios.Sortable.Portal = {
    
    add:    function(container, jcmsId){ return update(container, jcmsId); },
    remove: function(container, jcmsId){ return update(container, jcmsId, true); },
    
    insert: function(jcmsId, label, displayURL){
      if (!jcmsId) return;
      var $container = $.jalios.Sortable.Portal.$container;
      if (!$container || !$container.exists()) return;
      $.jalios.Sortable.Portal.add($container,jcmsId);
    },
    
    $container: false,
    openPubChooser: function(link){

      var $link      = $(link);
      var $container = $link.closest('DIV.dnd-container');
      var url        = link.href;
    
      if (!$container.exists()){
        JcmsLogger.warn('Sortable.Portal','openPubChooser(): cannot find container', $link, $container);
        return false;
      }
      
      // Backup latest container id
      $.jalios.Sortable.Portal.$container = $container;
      
      return Popup.popupWindow(url,'pubChooser',900,500,false,true,true,false);
    }
  }
  
  // ------------------------------------------
  //  DOM Ready
  // ------------------------------------------
  
  // Plugin initialization on DOM ready
  $(document).ready(function($) {
    register();
  });
  
}(window.jQuery);