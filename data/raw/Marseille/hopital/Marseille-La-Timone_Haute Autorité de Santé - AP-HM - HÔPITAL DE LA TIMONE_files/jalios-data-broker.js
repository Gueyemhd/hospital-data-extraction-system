
!function ($) {
  
  // ------------------------------------------
  //  PRIVATE
  // ------------------------------------------
  
  const SPACE_KEY = 32;
  const ENTER_KEY = 13;

  var callback = function(event) {

    var $e    = $(event.currentTarget);
    var type  = $e.attr('data-jalios-event');
    
    // Do not handle right click
    if (event.type == 'click' && event.which && event.which > 1){ return; }
    // Do not handle left click + ctrl key
    if (event.type == 'click' && event.which && event.which === 1  && event.ctrlKey){ return; }
    
    // Bypass dedicated events
    if (type && type != event.type && ((type === "input" && event.type !== "change") || type !== "input")){ return; }
    
    // Bypass not default events
    if (!type && event.type == 'contextmenu'){ return; }
    
    // 
    var isBtnWidget = $e.is(':button') || $e.is(':submit') || $e.is(':image'); // $e.attr('type') == 'submit' || $e.attr('type') == 'button';
    if (!type && isBtnWidget && event.type != 'click'){ return; }
    
    // Handle default event change or focusIn 
    var isTextWidget = !($e.attr('type') == 'radio' || $e.attr('type') == 'checkbox' || $e.prop('tagName') == 'SELECT'); 
    if (!type &&  isTextWidget && event.type == 'change'){ return; }
    if (!type && !isTextWidget && event.type != 'change'){ return; }
    
    // Handle CheckBox click
    // if ($e.is('INPUT[type=checkbox]')){
    //   $e.attr('checked',$e.attr('checked'));
    // }

    // Trigger actions
    var trapped = $.jalios.DataBroker.trigger($e, event);
    
    // Do not prevent event if there is no listeners
    if (!trapped){ return; }
    
    // Prevent click
    if ($e.is('A, :submit')){ event.preventDefault(); }
    
    // Prevent propagation
    event.stopPropagation();
    
    // Prevent other handlers
    event.stopImmediatePropagation();
  };

  var trigger = function(action, event, target, position, options) {

    var evt = jQuery.Event("jalios:broker");
    evt.broker = {};
    
    // The performed action
    evt.broker.type = action;

    // The source evt
    evt.broker.source = event;
    
    // The CSS Expression (or false)
    evt.broker.target = target === "this" ? event.currentTarget : target;
    
    // The jQuery function to run on CSS expression
    evt.broker.position = position;
    
    // Add custom options
    evt.broker.options = options || {};
    
    // The original trigger
    evt.broker.options.brokerTrigger = event.currentTarget;
    
    // Transfert the skip information to the new evt (see Modal) avoid loop
    evt.skip = event.skip;
    

    // Trigger on document
    $(document).trigger(evt);
    
    // Check if evt has been trapped
    return evt;
  };
  
  var register = function() {
    
    // A
    $(document).on('click', 'A[data-jalios-action]', callback);
    $(document).on('contextmenu', 'A[data-jalios-action]', callback);
    
    // INPUT, BUTTON
    $(document).on('click', ':button[data-jalios-action], :submit[data-jalios-action], :image[data-jalios-action]', callback);
    //$(document).on('click', ':submit[data-jalios-action]', callback);
    //$(document).on('click', ':image[data-jalios-action]' , callback);
    
    // DIV (FIXME: Should we authorize this behavior ?)
    $(document).on('click', '.broker[data-jalios-action]', callback);
    
    $(document).on('keydown', function(e){
      if(!$(document.activeElement).is('A[data-jalios-action], :button[data-jalios-action], :submit[data-jalios-action], :image[data-jalios-action], .broker[data-jalios-action]')) {
        return;
      }
      
      if(e.keyCode === SPACE_KEY || e.keyCode === ENTER_KEY) {
        $(document.activeElement).trigger("click");
        e.preventDefault();
      }
    }); 
    
    
    // INPUT TEXTAREA SELECT
    // see jQuery doc for change event 
    $(document).on('focusin focusout change input propertychange', ':input[data-jalios-action]', callback);
    // INPUT OF DATEPICKER
    $(document).on('datechange', ':input[data-jalios-event="datechange"]', callback);

  };
  
  // ------------------------------------------
  //  PUBLIC
  // ------------------------------------------
  
 /**
  * DataBroker forward events on DOM Elements with HTML5 data-* attributes to dedicated listener
  * 
  * <h5>Attributes:</h5>
  * <ul>
  *   <li>data-jalios-action: (required) a list of action to perform separated by spaces
  *     <ul>
  *       <li>modal: open a modal</li>
  *       <li>popin: trigger a popin</li>
  *       <li>ajax-refresh: trigger the ajax-refresh</li>
  *       <li>toggle-*: toggle elements values</li>
  *       <li>...</li>
  *     </ul>
  *   </li>
  *   <li>data-jalios-target: CSS expression to apply action</li>
  *   <li>data-jalios-target-position: jQuery function to apply CSS expression (closest, next, prev, ...)</li>
  *   <li>data-jalios-event: define the not default event to trigger</li>
  *   <li>data-jalios-options: the option object in JSON format</li>
  * </ul>
  * 
  * <h5>Default Events:</h5>
  * <ul>
  *   <li>A: click (or contextmenu)</li>
  *   <li>INPUT, BUTTON: click</li>
  *   <li>DIV: click</li>
  *   <li>INPUT, TEXTAREA: focusin focusout (or change)</li>
  *   <li>INPUT[checkbox,radio] SELECT change (or focusin focusout)</li>
  * </ul>
  * 
  * Modules must listen to jalios:broker Events on document. Events provides following hints:
  * <ul>
  *   <li>event.broker.type:     the action</li>
  *   <li>event.broker.target:   the css expression</li>
  *   <li>event.broker.source:   the source event (be carefull of memory leaks vs element references)</li>
  *   <li>event.broker.position: the jQuery function name</li>
  * </ul>
  * 
  * <p>Modules must call "event.stopPropagation()" to trap the event and stop bubbling</p>
  * <p>Modules can trigger (click) event with attribute 'skip' to forward an event. The function <code>$.jalios.DOM.follow()</code> trigger a click on given element. It is called by Modal module to follow actions after a prompt.</p>
  * 
  * <h5>RFE/FIXME</h5>
  * <ul>
  *   <li>Add Data-Broker to handle all popup, modal,... (fron input, links, ...)</li>
  * </ul>
  * 
  * @fires jalios:broker
  * @namespace $.jalios.DataBroker
  * @copyright Jalios SA
  * 
  * @see $.jalios.ToggleManager
  * @see $.jalios.AjaxRefresh
  * 
  * 
  * @example
  * 
  * &lt;a href="..." data-jalios-action="anything"&gt;Click me&lt;/a&gt;
  * 
  * var listener = function(event){
  *   ...
  *   var broker = event.broker;
  *   alert(broker.type);   // ajax-refresh, toggle-clazz, anything
  *   event.stopPropagation() // stop propagation on other handlers
  *   ...
  * }
  * $(document).on("jalios:broker", listener);
  * 
  * 
  * @unittest js/tests/jalios/core/jalios-data-broker.html
  */
  
    // Namespace
  if (!$.jalios) { $.jalios = {}; }
  
  $.jalios.DataBroker = {
  
    /**
     * Explicit trigger of a DataBroker Event for given element.
     * Usefull for jalios custom event on document
     * 
     * @param $e the working element
     * @param event the initial event 
     */
    trigger: function($e, event, options) {
      // Decode event's action
      var actions  = $e.attr('data-jalios-action');
      var target   = $e.attr('data-jalios-target');
      var position = $e.attr('data-jalios-target-position');
      var opt      = $e.attr('data-jalios-options');
      
      if (!actions){ return false; }
      actions = actions.replace(/[\s]+/g, ' ');
      
      if (opt){
        try { opt = $.parseJSON(opt); } catch(ex){ 
          try { opt = $.jalios.Http.toQueryParams(opt); } catch(ex) { /* empty */ }  
        }
        options = $.extend(true, options || {}, opt);
      }
      
      // Kludge helper
      target   = target   ? target.split('|')   : false;
      position = position ? position.split('|') : false;
      
      // Trigger: FIXME synchronous vs XHR ?
      var trapped = false;
      var bubble  = false;
      $.each(actions.split(' '),function(idx, action){
        if (bubble){ return; } // bubbling has been prevent to other actions
        try {
          var t     = !target   ? false : target.length   == 1 ? target[0]   : (target.length > idx ? target[idx]   : '');
          var p     = !position ? false : position.length == 1 ? position[0] : (target.length > idx ? position[idx] : '');
          var evt   = trigger(action, event, t, p, options);
          bubble    = bubble || evt.isImmediatePropagationStopped();
          trapped   = bubble || trapped || evt.isPropagationStopped();
        } catch (ex){
          $.console.log(ex);
          trapped = true;
        }
      });
      
      return trapped;
    }
  };
  
  
  // ------------------------------------------
  //  DOM Ready
  // ------------------------------------------
  
  
  // Plugin initialization on DOM ready
  $(document).ready(function($) {
    register();
  });
  
}(window.jQuery);