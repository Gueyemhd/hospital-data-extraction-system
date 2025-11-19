!function ($) {
  
  // Namespace
  if (!$.jalios)      { $.jalios      = {}; }
  if (!$.jalios.form) { $.jalios.form = {}; }
 
  // ------------------------------------------
  //  PRIVATE
  // ------------------------------------------
  
  var markAlreadyDisabledForExclusion = function(event) {
    $('.disabled, :disabled').each(function(index) {
      var $this = $(this);
      $this.addClass('excludeSingleSubmit');
    });
  }
  
  var refresh = function(event){
    var refresh = event.refresh;
    if (!refresh){ return; }

    if (refresh.type == 'before'){
      
      // Only ajax-refresh of forms
      if (!refresh.options || !refresh.options.isform){ return; }

      var $form = $(refresh.options.isform);
      if (!$form.exists()){ return; } // Check element
    
      // Prevent submit if wysiwyg init still in progress
      var hasPendingWysiwigInit = $form.hasClass('wysiwyg-init-in-progress');
      if (hasPendingWysiwigInit){
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return;
      }
    
      // Check class="noSingleSubmitButton"
      // FIXME: Use data-* attribute instead ?

      $.jalios.form.SingleSubmit.ajaxRefreshing = true;
      if ($form.hasClass('noSingleSubmitButton')){ return; }
      
      // Prevent submit if we are processing something
      if ($.jalios.form.SingleSubmit.processing){
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return;
      }
      
      // Disable buttons
      $.jalios.form.SingleSubmit.disable();
      
    } else if (refresh.type == 'success' || refresh.type == 'fail'){ // after, fail, error, ... 
      $.jalios.form.SingleSubmit.enable();
      $.jalios.form.SingleSubmit.ajaxRefreshing = false;
    }
  }
  
  var submit = function(event){

    var $form =  $(event.currentTarget);
    
    // Check element
    if (!$form.exists()){ return; }
    
    // An ajax-refresh is running
    if ($.jalios.form.SingleSubmit.ajaxRefreshing){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return;
    }
    
    // Prevent submit if wysiwyg init still in progress
    var hasPendingWysiwigInit = $form.hasClass('wysiwyg-init-in-progress');
    if (hasPendingWysiwigInit){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return;
    }
    
    // Check class="noSingleSubmitButton"
    // FIXME: Use data-* attribute instead ?
    if ($form.hasClass('noSingleSubmitButton')){ return; }
    
    // Prevent submit if we are processing something
    if ($.jalios.form.SingleSubmit.processing){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return;
    }
    
    // Disable buttons
    $.jalios.form.SingleSubmit.disable();
    
    // Remove unload message
    window.onbeforeunload = null;
  }
 
  // Register a logger
  var register =  function(){
    $(document).ready(markAlreadyDisabledForExclusion);
    $(document).on("jalios:refresh", refresh);
    $(document).on('submit','FORM', submit);
  }
  
  // ----------
  //  UNLOAD
  // ----------
  
  var onKeyPress = function(event){
    // Skip F5 key
    if (event.keyCode == 116) {
      return;
    }

    $(event.target).attr('data-jalios-dirty-input', 'true');    
  }
  
  var isDirty = function() {
    // 1. Check basic input that were observed using keypress
    var hasDirtyInput = $(document).find('[data-jalios-dirty-input="true"]').length;
    if (hasDirtyInput) {
      return true;
    }
    
    // 2. use custom API for TinyMCE wysiwyg
    if (typeof(tinyMCE) !== 'undefined') {
      var isAnyWysiwygDirty = false;
      jQuery.each(tinyMCE.editors, function(idx, editor) { 
        isAnyWysiwygDirty |= editor.isDirty();
      });
      if (isAnyWysiwygDirty) {
        return true;
      }
    }
    
    return false;
  }
  
  var initUnload = function(){
    // Register unload message
    window.onbeforeunload = onFormUnload;
    
    // Register dirty check for basic input
    $(document).on('keypress', ':input', onKeyPress);
    
  }
  
  var onFormUnload = function(){
    // If this flag is enabled, the message will not be displayed 
    if (window.disableOnBeforeUnloadMessage) {
      return;
    }

    if (!isDirty()) {
      return;
    }
    
    // Otherwise display the message to the user
    return I18N.glp('warn.edit.contentlost');
  }

  // ------------------------------------------
  //  PUBLIC
  // ------------------------------------------
 
 /**
   * SingleSubmit plugin will prevent forms and XHR to be submited more than once<br/>
   * <br/> 
   * 
   * <h5>Features</h5>
   * <ul>
   *   <li>Listen to Ajax-Request submits</li> 
   *   <li>Add global boolean to prevent multiple submit</li>
   *   <li>Activate feature with disable() / enable()</li>
   *   <li>FORM.noSingleSubmitButton bypass the process</li>
   * </ul>
   * 
   * <h5>Convention</h5>
   * <ul>
   *   <li>
   *     disable: new class convention to disable a given element. (do not use attribute because of side effects)
   *     <br/>=> Handled by Ajax-Refresh
   *   </li>
   * </ul>
   *            
   * 
   * @namespace $.jalios.form.SingleSubmit
   * @copyright Jalios SA
   * @example
   * 
   * $.jalios.form.SingleSubmit.disable();
   * 
   * @unittest js/tests/jalios/core/jalios-single-submit.html
   */
 
  // Plugin definition
  $.jalios.form.SingleSubmit = {
    
    // Expose variable for hacks
    processing: false,
    
    /**
     * Enable all formButton of Forms
     */
    enable:  function(){ $.jalios.form.SingleSubmit.toggle(true);  },
    
    /**
     * Disable all formButton of Forms without class 'noSingleSubmitButton'
     */
    disable: function(){ $.jalios.form.SingleSubmit.toggle(false); },
    
    /**
     * Toggle availability of all formButton of Forms without class 'noSingleSubmitButton'
     *  @param {boolean} enable to force state enbale/disable
     */
    toggle:  function(enable){
      
      // Rise a flag for the given page
      // FIXME: add a class on BODY ? to handle live()
      $.jalios.form.SingleSubmit.processing = !enable;
      
      // Update all formButton
      $('INPUT.formButton, BUTTON.formButton, A.formButton, INPUT.btn, BUTTON.btn, A.btn').each(function(index) {
         var $this = $(this);
         var $form = $($this.prop('form') || $this.closest('FORM'));
         if ($form.hasClass('noSingleSubmitButton')){ return; }
         if ($this.hasClass('excludeSingleSubmit')){ return; }
         
         $this.toggleClass('disabled', !enable);
      });
    },
    
    /**
     * Init an unload message before leaving form
     */
    'initUnload': initUnload
  };
  
  // Plugin initialization on DOM ready
  $(document).ready(function($) {
    register();
  });
  
}(window.jQuery);


// ------------------------------------------
//  DEPRECATED
// ------------------------------------------

function initUnloadMessage(){
  jQuery.jalios.form.SingleSubmit.initUnload();
}
