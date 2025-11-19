!function ($) {

  // ------------------------------------------
  //  PRIVATE
  // ------------------------------------------

  var register = function(){
    setup();
    $(document).on('jalios:refresh', callback);
  }
  
  var callback = function(event){
  
    var refresh = $.jalios.Event.match(event, 'refresh', 'after')
    if (!refresh){ return; }
    if (!refresh.target){ return; }
    
    setup(refresh.target);
  }
  
  var setup = function($container){
    
    $container = $container || $(document);
    
    // Handle generic drag and drop lists
    $container.find('UL.sortable, OL.sortable').each(function(){
      $.jalios.Sortable.buildSortable(this, {
        'connectWith' : $(this).attr('data-jalios-sortable-connect')
      });
    }); 
    
    var clazz = 'sortable-active';
    
    // Handle generic drag and drop container
    $container.find('DIV.dnd-container').each(function(){
      var $this = $(this);
      var axis = $this.hasClass('dnd-horizontal') ? 'x' : $this.hasClass('dnd-vertical') ? 'y' : false;
      $.jalios.Sortable.buildSortable(this, {
        'items': '> DIV',
        'axis': axis,
        'revert': true,
        'handle': '.dnd-header, .dnd-handle',
        'placeholder' : 'dnd-placeholder',
        'connectWith': $this.hasClass('dnd-single') || axis ? false : 'DIV.dnd-container'
      });
    });
  }
  
  var hover = function(sortable, on){
    var $this = $(sortable);
    if ( on &&  $this.hasClass('sortable-active')){ return; }
    if (!on && !$this.hasClass('sortable-active')){ return; }
    $this.toggleClass('sortable-active', on);
  }
  
  var trigger = function(that, ui){

    var $that = $(that);

    if ($that.hasClass('dnd-debug')) {
      // http://stackoverflow.com/questions/3492828/jquery-sortable-connectwith-calls-the-update-method-twice
      if (that === ui.item.parent()[0]) {   
        // the movement was from one container to another, ui.sender is the reference to original container
        if (ui.sender !== null) {
          jQuery.console.log('[jalios-sortable]', ' item' , ui.item, ' moved from container', ui.sender, ' to ', $that);
        }
        // the move was performed within the same container
        else {      
          jQuery.console.log('[jalios-sortable]', ' item ', ui.item, ' moved inside container', $that);
        }   
      }
    }
    
    // If dnd-single-update was specified on container, 
    // Only send one 'jalios:sortable' and DataBroker event for all 'update' event sent by jQuery sortable,
    // merging all container parameters at once 
    var singleDndUpdate = $that.hasClass('dnd-single-update');
    if (singleDndUpdate && that !== ui.item.parent()[0]) {
      return;
    }

    // Trigger a document Event
    var event = jQuery.Event("jalios:sortable");
    event.sortable = {
      'container' : $that,
      'ui' : ui
    };
    $(document).trigger(event);
    
    // Trigger DataBroker Event
    var serialize = $.jalios.Sortable.serialize($that, $that.hasClass('dnd-container') ? 'dnd-sortable' : false);
    
    // for single update event, also include the serialization of the sender container
    if (singleDndUpdate && ui.sender !== null) {
      var senderSerialize = $.jalios.Sortable.serialize(ui.sender, $(ui.sender).hasClass('dnd-container') ? 'dnd-sortable-sender' : 'sortable-sender');
      serialize = $.extend(serialize, senderSerialize);
    }
    
    event.currentTarget = that;
    $.jalios.DataBroker.trigger($that, event, { 
      params : serialize
    });
    
  }
  
  // ------------------------------------------
  //  PUBLIC
  // ------------------------------------------
  
  // Namespace
  if (!$.jalios) { $.jalios = {}; }
  
  /**
   * Provides mechanisms to handle sortable (drag and drop) of list's items and container's boxes using jQueryUI Sortable Widget.
   * <br/><br/>
   * 
   * <h5>List</h5>
   * List with classes <code>UL.sortable</code> and <code>OL.sortable</code> will trigger this feature.
   * <ul>
   *   <li><code>.sortable-x</code> constraint horizontal drag</li>
   *   <li><code>.sortable-y</code> constraint vertical drag</li>
   *   <li><code>.sortable-handle</code> define drag handle and must be on sortable</li>
   *   <li><code>.sortable-disable</code> element to bypass</li>
   * </ul>
   * 
   * Attribute <code>data-jalios-sortable-connect</code> define the sortable to connect with
   * 
   * <h5>Boxes</h5>
   * DIV with classes <code>DIV.dnd-container</code> will trigger this feature.
   * <ul>
   *   <li><code>.dnd-horizontal</code> constraint horizontal drag</li>
   *   <li><code>.dnd-vertical</code> constraint vertical drag</li>
   *   <li><code>.dnd-single</code> prevent a connection with other dnd-container</li>
   *   <li><code>.dnd-single-update</code> will trigger only one jalios:sortable event and databroker event for all connection with other dnd-container</li>
   *   <li><code>.dnd-debug</code> will print update event in browser console</li> 
   *   <li><code>.dnd-noresponse</code> for portal ajax refresh, the DOM will not be refresh with the response.</li>
   * </ul>
   * 
   * <h5>Events</h5>
   * An event <code>jalios:sortable</code> is trigged when a drop has been performed.
   * <ul>
   *   <li>sortable.container: the container element (dnd-sortable forboxes)</li>
   *   <li>sortable.ui: the jQuery sortable ui event</code></li>
   * </ul>
   * 
   * A broker event is also performed to trigger listeners: ajax-refresh, modal, ...<br/>
   * 
   * The options's param is filled with the serialised content  
   * 
   * <h5>FIXME</h5>
   * <ul>
   *   <li>Handle connectWith on list</li>
   *   <li>Handle nested list</li>
   * </ul>
   * 
   * @namespace $.jalios.Sortable
   * @copyright Jalios SA
   * @see $.jalios.DataBroker
   * @see $.jalios.AjaxRefresh
   * 
   * @example
   * 
   * Drop will trigger action ajax-refresh on UL with parameters: key=HelloA&key=HelloB&key=HelloC&key=HelloD&sortable=key
   * 
   * &lt;ul id="key" class='sortable' data-jalios-action="ajax-refresh"&gt;
   *   &lt;li data-value="HelloA"&gt;&lt;a href='#'&gt;Hello World 1&lt;/a&gt;&lt;/li&gt;
   *   &lt;li id="HelloB"&gt;&lt;a href='#'&gt;Hello World 2&lt;/a&gt; Yep&lt;/li&gt;
   *   &lt;li data-value="HelloC"&gt;&lt;a href='#'&gt;Hello World 3&lt;/a&gt;&lt;/li&gt;
   *   &lt;li data-value="HelloD"&gt;&lt;a href='#'&gt;Hello World 4&lt;/a&gt;&lt;/li&gt;
   * &lt;/ul&gt;
   * 
   * @example
   * 
   * Drop on first column will trigger an ajax-refresh on dnd-container with parameters: bind1=c_1234&bind1=c_1234&bind1=c_1234&sortable=bind1.
   * 
   * This behavior simplifed by jalios-sortable-portal.js (data-jalios-action attribute is not required). PortletCollection includes doAjaxHandleSortable.jsp to updates portlet bindings 
   * 
   * &lt;jalios:buffer name="box"&gt;
   *   &lt;div class='box ID_c_1234'&gt;
   *     &lt;div class="box-header dnd-handle"&gt;&lt;h3&gt;Box title&lt;/h3&gt;&lt;/div&gt;
   *     &lt;div class="box-body"&gt;Box body&lt;/div&gt;
   *     &lt;div class="box-footer"&gt;Box footer&lt;/a&gt;&lt;/div&gt;
   *   &lt;/div&gt;
   * &lt;/jalios:buffer&gt;
   * 
   * &lt;div class='row-fluid'&gt;
   *   &lt;div id="bind1" class='span4 dnd-container'&gt;
   *     &lt;%= box %&gt; &lt;%= box %&gt; &lt;%= box %&gt;
   *   &lt;/div&gt;
   *   &lt;div id="bind2" class='span4 dnd-container'&gt;
   *     &lt;%= box %&gt; &lt;%= box %&gt; &lt;%= box %&gt;
   *   &lt;/div&gt;
   *   &lt;div id="bind3" class='span4 dnd-container'&gt;
   *     &lt;%= box %&gt; &lt;%= box %&gt; &lt;%= box %&gt;
   *   &lt;/div&gt;
   * &lt;/div&gt;
   * 
   */ 
  
  $.jalios.Sortable = {
  
   /**
    * Serialize a given sortable with serialized children.<br/>
    * Do not use defaut serialisation because of JcmsID and other custom behavior.
    * 
    * @param container the selector of the container
    * @param key optionnal parameter key to be used to send the container id
    * @return a JSON object representation
    */
    serialize: function(container, key){

      var key = key || 'sortable';
      
      // Perform selector
      var $container = $(container);
      
      // Serialize sortable items
      var serial = $container.children().map(function() {  // FIXME: should escape some children
        var $this  = $(this);
        
        // Retrive data-value ou JcmsId
        var value = $this.attr('data-value') || $this.getJcmsId();
        if (value){ return value; }
        
        // look into first child (Handle wrappers grid)
         var $child = $this.children(':first');
         value = $child.attr('data-value') || $child.getJcmsId();
         if (value){ return value; }
        
        // At last use ID
        return $this.attr('id'); 
      }).get();
      
      // Build sortable key
      var sortable = $.jalios.Sortable.getSortableKey($container);
      
      // Build params
      var params = {};

      var additionnalParams = $container.attr('data-sortable-params');
      try {
        params = $.extend(params, additionnalParams && JSON.parse( additionnalParams ));
      } catch ( error ) {
        jQuery.console.error('Error parsing data-sortable-params on ', $container, error );
      }
      
      params[key || 'sortable'] = sortable;
      params[sortable] = serial;
      
      // Returns the serialized representation
      return params;
    },
    
    getSortableKey: function($sortable){
      return $sortable.attr('data-value') || $sortable.attr('id') || $sortable.getJcmsId() || 'sortitem';
    },
    
    /**
     * Build a sortable for the given element using css declaration of list (sortable-*).<br/> 
     * Used by sortable-widget.js to lazy kickstart sortable on focusin.
     * 
     * @param element the element to work with
     * 
     */
    buildSortable: function(element, options){
      var $e = $(element);
      var options = options || {};
      $e.sortable({
        'items':       options.items  || '> LI', // Only LI
        'cancel':      options.cancel || '.sortable-disable, :input',
        'axis':        options.axis   || ($e.hasClass('sortable-x') ? 'x' : $e.hasClass('sortable-y') ? 'y' : false),
        'revert' :     options.revert || true,
        'handle':      options.handle || ($e.hasClass('sortable-handle') ? '.sortable-handle' : false),
        'connectWith': options.connectWith || false,
        'tolerance':   options.tolerance   || 'intersect',
        'placeholder': options.placeholder,
        'update': function(evt, ui){ trigger(this, ui);  },
        'stop':   function(evt, ui){ hover(this, false); },
        'sort':   function(evt, ui){ hover(this, true);  },
        'out':    function(evt, ui){ hover(this, false); }, 
        'over':   function(evt, ui){ hover(this, true);  }
      });
    }
  }
  
  // ------------------------------------------
  //  FUNCTION
  // ------------------------------------------
  
  $.fn.sortable = $.fn.sortable || {};
  
  $.fn.sortable.add = function(value){
    var $elm = $(value);
    if (!$elm.exists()){
      var tag = $(this).hasClass('sortable') ? 'li' : 'div';
      $elm = $('<'+tag+' data-value="'+value+'"></'+tag+'>');
    }
    
    return this.each(function() {
      $(this).append($elm);
      trigger(this);
    });
  }
  
  $.fn.sortable.remove = function(elm){
    $(elm).remove();
    return this.each(function() {
      trigger(this);
    });
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

  var Sortable = {};
  Sortable.create = function(){
    jQuery.console.warn("[Deprecated] JCMS requires the new Sortable framework");
    jQuery.console.stacktrace();
  }
  Sortable.destroy = function(){
    jQuery.console.warn("[Deprecated] JCMS requires the new Sortable framework");
    jQuery.console.stacktrace();
  }
  
  var Droppables = {};
  Droppables.add = function(){
    jQuery.console.warn("[Deprecated] JCMS requires the new Sortable framework");
    jQuery.console.stacktrace();
  }
  
  var PortalSortable = {};
  PortalSortable.create = function(){
    jQuery.console.warn("[Deprecated] JCMS requires the new Sortable framework");
    jQuery.console.stacktrace();
  }
