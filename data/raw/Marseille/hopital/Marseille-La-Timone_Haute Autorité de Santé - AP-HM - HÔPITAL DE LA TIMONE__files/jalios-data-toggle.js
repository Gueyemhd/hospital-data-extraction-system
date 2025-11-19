  
!function ($) {
  
  // Namespace
  if (!$.jalios) { $.jalios = {}; }

  // ------------------------------------------
  //  PRIVATE
  // ------------------------------------------

  // Action regexp
  var pattern = /(toggle|add|remove|sync|run):([\w-]+)/i;
  
  // ------------------------------------------
  //  PRIVATE: Options
  // ------------------------------------------
  
  function Options(swtch, target, position) {
    this.target = target;
    this.swtch  = swtch;
    this.position = position;
    this.self   = true;  // False to remove this from query
    this.clazz  = true;  // True to add a class for given attr
    this.attr   = false; // String, the target attribute
    this.previous = '';  // previous value to remove
    this.sync   = true;  // Sync state to know to add or remove info (for classes)

  }
  
  Options.prototype = {
    
    constructor: Options,
    
    getTarget: function(elm){
      if (!this.target){
        return $(elm);
      }

      var $target = false;
      if (this.position){
        $target = $(elm)[this.position].apply($(elm), [this.target]);
      } else {
        $target = $(this.target);
      }
      
      // Remove self
      if (!this.self){ $target = $target.not(elm); }

      return $target;
    },
    
    getAttribute: function(elm, def){ 
      if (this.attr){
        return this.attr;
      }

      var data = $(elm).attr('data-jalios-target-attribute');
      return data ? data : def;
    }
  }
  
  // ------------------------------------------
  //  PRIVATE: Clazz, Boolean, ...
  // ------------------------------------------
  
    // Working on classes
    var _Clazz = function(elm, clazz, options){
      
      var $e = $(elm); 
      var $target = options.getTarget(elm);
      
      if ('add' == options.swtch){
        $target.toggleClass(clazz, true);
      } else if ('remove' == options.swtch){
        $target.toggleClass(clazz, false);
      } else if ('toggle' == options.swtch){
        $target.removeClass(options.previous);
        $target.toggleClass(clazz);
      } else if ('sync' == options.swtch){
        $target.removeClass(options.previous);
        $target.toggleClass(clazz, options.sync);
      }
    }
    
    // Working on boolean attributes
    var _Boolean = function(elm, attribute, options){
    
      var $target = options.getTarget(elm);
      var tgtAttr = options.getAttribute(elm, attribute);
      
      if ('add' == options.swtch){
        $target.attr(tgtAttr, true);
      } else if ('remove' == options.swtch){
        $target.attr(tgtAttr, false);
      } else if ('toggle' == options.swtch){
        $target.attr(tgtAttr, function(index, attr){return !attr; });
      } else if ('sync' == options.swtch){
        var srcValue  = $(elm).is(':checked'); // $(elm).is(':'+attribute); because only checked/disabled
        $target.prop(tgtAttr, srcValue); // use prop: see http://forum.jquery.com/topic/please-explain-attr-vs-prop-change-in-1-6
      }
    }

    // Working on String attributes
    var _String = function(elm, attribute, options){
      var $elm     = $(elm);
      var srcValue = $elm.attr(attribute);
      var tgtAttr  = options.getAttribute(elm, attribute);
      
      if (srcValue === undefined){ 
        srcValue = $elm.find('['+attribute+']:selected').attr(attribute);
      }
      
      if (srcValue === undefined){ 
        srcValue = $elm.find('['+attribute+']:checked').attr(attribute);
      }
      
      if (srcValue === undefined){
        srcValue = attribute;
      }
      
      // Custom mapping data-jalios-mapping
      // var mapping = $elm.attr('data-jalios-mapping');
      // if (mapping){
      //   mapping = $.parseJSON(mapping);
      //   srcValue = mapping[srcValue] || srcValue;
      // }
      
      if ('class' == tgtAttr){
        _Clazz(elm, srcValue, options);
        return;
      }

      // Find the parameter to apply
      var param = '';
      if ('add' == options.swtch){
        param = srcValue;
      } else if ('toggle' == options.swtch){
        param = function(index, attr){ return attr == srcValue ? param : srcValue; };
      } else if ('sync' == options.swtch){
        param = srcValue;
      }
      
      // Apply jquery function or attr()
      var $target  = options.getTarget(elm);
      if ($.fn[tgtAttr]){
        $.fn[tgtAttr].apply($target, param.split('|'));
      } else {
        $.fn['attr'].apply($target, [tgtAttr, param]);
      }
    }
  
  // ------------------------------------------
  //  PRIVATE: Register
  // ------------------------------------------
  
  var callback = function(event){
  
    var broker = $.jalios.Event.match(event, 'broker')
    if (!broker){ return; }
  
    // No pattern
    var  regex = broker.type.match(pattern);
    if (!regex){ return; }
    
    // No action
    var  regex = broker.type.match(pattern);
    var swtch  = regex[1];
    var attr   = regex[2];
    if (!swtch || !attr){ return; }
    
    // Prevent propagation
    event.stopPropagation();
    
    // Dispatch to action
    var elm = broker.source.currentTarget;
    if (swtch == 'run'){
      return window[attr](elm);
    }
    
    var options = $.jalios.ToggleManager.getOption(swtch, broker.target, broker.position);
    $.jalios.ToggleManager.toggle(elm, attr, options);
  }
  
    // Register a logger
  var register = function(){
    $(document).on("jalios:broker", callback);
  }
  
  // ------------------------------------------
  //  PUBLIC
  // ------------------------------------------

   /**
    * ToggleManager listen to DataBroker to handle toggle action to perform on target elements (or self).<br/> 
    * <br/>
    * 
    * <h5>Actions: {toggle|add|remove|sync}-{class|disable|checked|...}</h5>
    * <ul>
    *   <li>toggle: Toggle Add or Remove the target value</li>
    *   <li>add:    Add or set to true the target value</li>
    *   <li>remove: Remove or set to false the target value</li>
    *   <li>sync:   Set the target value equals to self</li>
    *   <li>run:    Run given function (bind to window)</li>
    * </ul>
    * 
    * <ul>
    *   <li>class: a  class name</li>
    *   <li>data-* element's data attribute</li>
    *   <li>disabled: disabled/enabled</li>
    *   <li>checked:  check/uncheck</li>
    *   <li>title:    element's title</li>
    *   <li>longdesc: element's longdesc</li>
    *   <li>value:    element's value</li>
    * </ul>
    * 
    * <h5>Introduce custom field:</h5>
    * <ul>
    *   <li>data-jalios-target-attribute The target's field name to update. The name of the field can be a jQuery funcion like 'html', 'css' or 'after' ... </li>
    * </ul> 
    * 
    * 
    * @namespace $.jalios.ToggleManager
    * @copyright Jalios SA
    * 
    * @see $.jalios.DataBroker
    * @unittest js/tests/jalios/core/jalios-data-toggle.html
    */

  
  // Plugin definition
  $.jalios.ToggleManager = {
    
    getOption: function(swtch, target, position){
      return new Options(swtch, target, position);
    },
    
    /**
     * Toggle given attribute of given element with given options.<br/>
     * Toggle can be performed on self or targets elements.
     * 
     * @param elm the source element
     * @param attr the attribut to switch
     * @param options option object
     * 
     * @example
     * 
     * var $elm = $('#link1');
     * var options = $.jalios.ToggleManager.getOption('toggle', false, false);      
     * $.jalios.ToggleManager.toggle($elm[0], 'clazz', options);
     * 
     * => Toggle state of class 'clazz'
     * 
     * @example
     * 
     * var $elm = $('#link4A');
     * var options = $.jalios.ToggleManager.getOption('sync', '#link4B', false);
     * $.jalios.ToggleManager.toggle($elm[0], 'clazz', options);
     * 
     * => Synchronize state of class 'clazz' on #link4A with #link4B
     * 
     * @example
     * 
     * var $elm = $('#input8');
     * var options = $.jalios.ToggleManager.getOption('sync', 'DIV.input8Div');
     * options.attr = 'html';
     * 
     * $elm.attr('value','typed values in input8');
     * $.jalios.ToggleManager.toggle(elm, 'value', options);
     * 
     * => Value on #input8 is set to all $('DIV.input8Div').html(...) on focusin/focusout  
     * 
     */
    toggle: function(elm, attr, options){
      
      if ($.jalios.ToggleManager[attr]){
        options.clazz = false;
        $.jalios.ToggleManager[attr].apply(this, [elm, options]);
      }
      else if (attr.indexOf('data-') == 0){
        options.clazz = false;
        _String(elm, attr, options);
      }
      else if (options.getAttribute(elm, false)){
        options.clazz = false;
        _String(elm, attr, options);
      }
      
      if (options.clazz) {
        var $elm = $(elm);
        options.sync = $elm.hasClass(options.clazz) || $elm.is(':checked');
        _Clazz(elm, attr, options);
      }
    },
    
    checked: function(elm, options){
      options.self = false;
      options.clazz = true;
      _Boolean(elm, 'checked', options);
    },
    
    disabled: function(elm, options){
      options.clazz = true;
      _Boolean(elm, 'disabled', options);
    },
    
    title: function(elm, options){
      _String(elm, 'title', options);
    },
    
    longdesc: function(elm, options){
      _String(elm, 'longdesc', options);
    },
    
    value: function(elm, options){
      var $elm = $(elm);
      
      // Custom use case for SELECT
      if ($elm.is('SELECT')){
        $.each(elm.options, function(){  options.previous += ' ' + $(this).attr('value');  });
      } 
      else if ($elm.is('INPUT[type=radio]')) {
        options.previous = $('input[name='+$elm.attr('name')+']', elm.form).map(function() { return $(this).attr('value'); }).get().join(' ');
      }
    
      _String(elm, 'value', options);
    }
  };
  
  // ------------------------------------------
  //  DOM READY
  // ------------------------------------------
  
  $(document).ready(function($) {
    register();
  });
  
}(window.jQuery);