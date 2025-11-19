!function ($) {

  // Namespace
  if (!$.jalios)           { $.jalios           = {}; }
  if (!$.jalios.ui)        { $.jalios.ui        = {}; }


  // ------------------------------------------
  //  PRIVATE
  // ------------------------------------------

  var register = function() {

    $(document).on('focusin', 'DIV.widget INPUT,DIV.widget SELECT', function(event) {
      var $e = $(event.currentTarget);
      $e.getWidget().addClass('focus-widget');
    });

    $(document).on('focusout', 'DIV.widget INPUT,DIV.widget SELECT', function(event) {
      var $e = $(event.currentTarget);
      $e.getWidget().removeClass('focus-widget');
    });

    // Empty the hidden input value which contains the id of the chosen data (.form-control)
    // when the input chooser is empty
    $(document).on('input propertychange', 'DIV.widget INPUT.form-control-autocomplete', function(event) {
      // Check value
      var $input = $(this);
      if (!$input.val()) {
        $input.next('.form-control').val('');
        var $wrapper = $.jalios.ui.Widget.getWrapper($input);
        // Handle publication with dropdown menu: hide the dropdown menu and display the clear button
        var dropdown = $wrapper.find('.input-group-btn .dropdown-toggle');
        if(dropdown.exists()) {
          var $btnRemove = $wrapper.find('.input-group-btn .btn-remove');
          // hide the dropdown menu only if the clear button exists
          if($btnRemove.exists()) {
            dropdown.addClass('hide'); // Hide the dropdown
            $wrapper.find('.input-group-btn .btn-remove').removeClass('hide') // Display the clear button 
          }
        }
      }
    });

    $(document).on('click', 'DIV.widget .add-field', doAddFields);

    $(document).on('click', 'DIV.widget .insert-field', doInsertFields);

    $(document).on('click', '.js-reveal-password', togglePasswordReveal);

    // Keyword resize
    $(document).on('change', 'DIV.widget.keyword INPUT', function(event){
      $.jalios.ui.Widget.Keyword.resizeKeyword($(this));
      $.jalios.ui.Widget.Keyword.toggleClear.defer($(this));
    });

    $(document).on('keydown input', 'DIV.widget.keyword INPUT', function(event) {
      // Keydown
      $.jalios.ui.Widget.Keyword.resizeKeyword($(this));
    });

    // Smart Focus
    $(document).on('jalios:refresh', function(event){
      var refresh = $.jalios.Event.match(event, 'refresh', 'after');
      if (!refresh){ return; }
      if (refresh.options && refresh.options.fieldAutocomplete) {
        return;
      }
      if (refresh.target){ smartFocus(refresh.target, !refresh.options.noscroll); }
    });

    // CtxMenu
    $(document).on('jalios:refresh', function(event){
      var refresh = $.jalios.Event.match(event, 'refresh', 'before');
      if (!refresh || !refresh.options){ return; }

      var $trigger = $(refresh.options.trigger);
      if ($trigger.getJcmsId() != 'CtxWidget'){ return; }

      ctxWidgetMenuHook($trigger, refresh.options.params);
    });

    /*
     * This should be use for real attribute required
    var elements = document.getElementsByTagName("INPUT");
    for (var i = 0; i < elements.length; i++) {
      elements[i].oninvalid = function(e) {
          e.target.setCustomValidity("");
          if (!e.target.validity.valid) {
              e.target.setCustomValidity("This field "+ e.target.id +" cannot be left blank");
          }
      };
      elements[i].oninput = function(e) {
          e.target.setCustomValidity("");
      };
    }
    */
  };

  var smartFocus = function(e, scroll) {
    if (!e){ return; }
    var $e = $(e);

    // bypass nofocus div
    if ($e.closest('.no-focus').exists()) {
      return;
    }

    // Do not focus the inputs in a tab of group list

    // Do not handle focus if the current element is a tab of group list
    if($e.hasClass('tab-group-list-item')) {
      return;
    }
    // Do not handle focus if the current element is an input in a tab of group list
    if($e.hasClass('input-group-list-item')) {
      $e.blur(); // Force to focus out because IE keep the focus even if the input is not visible
      return;
    }

    // Narrow search on given area
    var $focus = $e.find('.focus');
    if ($focus.exists()){
      $e = $focus;
    }

    // Try searching for a wysiwyg, and focus it
    var $allInputs = $e.find('input[type=text]:visible, TEXTAREA');
    var $firstInput = $($allInputs[0]);

    if ($firstInput.hasClass("control-wysiwyg") && !$firstInput.closest(".no-focus").exists()) {

      var $multilingualWrapper = $firstInput.closest(".form-group.multilingual");
      var $multiValuedWrapper = $firstInput.closest(".form-group.multivalued");

      if ($multilingualWrapper.exists()) {
        var $activeMultilingualTab = $multiValuedWrapper.exists() ? $multilingualWrapper.find(".tab-content > .tab-pane.active  .input-group-list-item.active") : $multilingualWrapper.find(".tab-content > .tab-pane.active");
        if ($activeMultilingualTab.exists()) {
          $firstInput = $($activeMultilingualTab.find("TEXTAREA"));
        }
      }

      var $wysiwygEditor = $firstInput.closest(".wysiwyg-editor");
      if ($wysiwygEditor.find(".mce-tinymce,.tox-tinymce").exists()) {
        var editor = $firstInput.tinymce();
        if (editor) {
          editor.focus();
        }
        return;
      } else {
        $firstInput.closest(".wysiwyg-editor").addClass("focus");
      }
    }

    var $input = $e.find(':input:visible:first');
    if ($input.closest('.no-focus').exists()){ return;  }
    if (!$input.exists()){ return; }

    if (scroll){
      $input.focusElement();
      $('html,body').animate({ scrollTop: $input.offset().top - $(window).height()/2 }, 'fast');
    } else {
      $input.focusWithoutScrolling();
    }
  };

  /**
   * Clear Fields
   * @param $element the clicked element
   * @param skipRemove (optional) will not remove empty field
   */
  var clear = function($element, skipRemove) {
    var $trigger = $element || $.jalios.ui.CtxMenu.$latest;

    var $wrapper = $.jalios.ui.Widget.getWrapper($trigger);
    _clear($wrapper);

    // Handle Keyword
    var kw = $.jalios.ui.Widget.Keyword.isInKeyword($trigger);
    var mv = $.jalios.ui.Widget.getWidget($trigger).hasClass('multivalued');
    if (!skipRemove && (kw || mv)) {
      // Add data attribute to check if the element is in a dropdown which keep open.
      // This data attribute is used in jalios-ctxmenu.js (function '$.fn.dropdown.clearMenus')
      var $context = $($trigger.getOriginalContext());
      var keepOpen = $context.closest('.keep-open').exists();
      if(keepOpen) {
        $context.data('dropdown-keep-open', keepOpen);
        $context.children().data('dropdown-keep-open', keepOpen);
        $trigger.data('dropdown-keep-open', keepOpen);
      }
      
      var $widget = $.jalios.ui.Widget.getWidget($trigger);
      var ml = $.jalios.ui.Widget.getWidget($trigger).hasClass('multilingual');
      
      if (ml) {
        var triggerId = $trigger.attr('id');
        var triggerIndex = parseInt(triggerId.substring(triggerId.lastIndexOf('_') + 1));
        $widget.find('LI.jalios-input-group INPUT').each(function() {
          var inputId = $(this).attr('id');
          var index = parseInt(inputId.substring(triggerId.lastIndexOf('_') + 1));
          index = index || 0;
          if (index === triggerIndex && $(this).attr('value') === "") {
            JCMS.form.Widget.remove($(this)[0]);
          }
        });
      }
      
      else {
        JCMS.form.Widget.remove($trigger[0]);    	  
      }
    
      return false;
    }

  };

  var _clear = function($wrapper) {
    $wrapper.find('INPUT, SELECT, TEXTAREA').each(function() {
      var $e = $(this);
      if ($e.prop('checked')) {
        $e.prop('checked', false);
      } else if ($e.prop('selectedIndex')) {
        $e.prop('selectedIndex', 0);
      } else if ($e.is(':not(:radio)') && $e.is(':not(:checkbox)') && $e.is(':not(.wysiwyg-editor-infos)')) {
        $e.val('').change();
        if($e.is(':file')) {
          var $fileInput = $e.closest('.jalios-publication-filebrowser');
          if($fileInput.exists()) {
            if($fileInput.is(':input')) { // classic file input
              
            } else { // plupload
              var uploader = $fileInput.data('plupload');
              $.each(uploader.files, function(i, file) {
                uploader.removeFile(file);
              });
            }
          } else {
            var $fileInput = $e.closest('.control-file.plupload');
            if($fileInput.exists()) {
              var uploader = $fileInput.data('plupload');
              $.each(uploader.files, function(i, file) {
                uploader.removeFile(file);
              });
            }
          }
        }
      }
    });

    // Handle publication with dropdown menu: hide the dropdown menu and display the clear button
    var $inputGroupBtn = $wrapper.find('.input-group-btn');
    var $dropdown = $inputGroupBtn.find('.dropdown-toggle');
    if($dropdown.exists()) {
      $.fn.dropdown.clearMenus();
      var $dropdownMenu = $inputGroupBtn.find('.dropdown-menu');
      $dropdownMenu.find('.edit-item').addClass('hide'); // Hide the edit item
      $dropdownMenu.find('.upload-new-version-item').addClass('hide'); // Hide the upload new version item
      $dropdownMenu.find('.add-item').removeClass('hide'); // Show the add item
      // dropdown.addClass('hide'); // Hide the dropdown
      // $wrapper.find('.input-group-btn .btn-remove').removeClass('hide') // Display the clear button
    }

    // Reset the color picker addon to preview the color
    $wrapper.find(".color-preview").css("background", "");
  };
  
  const togglePasswordReveal = function(event) {
    let $target = $(event.currentTarget);
    let $passwordInput = $target.closest(".input-group").find(".form-control-password");
    let type = $passwordInput[0].type;
    let toggleTitle = $target.data("jalios-toggle-title");
    $target.data("jalios-toggle-title", $target.attr("title"));
    $target.attr("title", toggleTitle);
    $passwordInput.closest(".input-group").toggleClass("is-password-revealed");
    if (type === "text") {
      $passwordInput[0].type = 'password';
    } else if (type === "password") {
      $passwordInput[0].type = 'text';
    }
  }

  var doInsertFields = function(event) {
    event.preventDefault();
    var $e = $(event.currentTarget);

    doAddFields(event, null);
  };

  var doAddFields = function(event, index) {
    event.preventDefault();
    var $e = $(event.currentTarget);

    var $widget = $.jalios.ui.Widget.getWidget($e);
    var $tabsFieldGroup = $widget.find('.jalios-nav-pills');

    var $lastTab = $tabsFieldGroup.children().last();
    var $tabLink = $lastTab.children();
    var fieldGroup = $tabLink.data('jalios-fieldgroup');
    if(fieldGroup) {
      $('A[data-jalios-fieldgroup=' + fieldGroup + ']').each(function() {
        var $this = $(this);
        var $tabPaneLang = $this.closest('.tab-pane.wdglang');
        var $wrapper = $tabPaneLang.exists() ? $tabPaneLang : $.jalios.ui.Widget.getWidget($this);
        addFields($wrapper, index);
      });
    }
    else {
      addFields($widget, index);
    }
  };

  var addFields = function($wrapper, index) {
    if($.jalios.Wiki) {
      $.jalios.Wiki.hideWikiToolbar($wrapper); // Hide wiki toolbar to prevent to duplicate the wiki toolbar
    }

    var $tabML = $wrapper.find('.tab-pane.wdglang');
    if ($tabML.exists()) {
      $tabML.each(function() { addField($(this), index); });
    }
    else {
      addField($wrapper, index);
    }
  };

  var addField = function($wrapper, index) {
    // Main List
    var $list = $wrapper.find('OL.input-group-list, UL.input-group-list');

    // Create a new element by cloning the last element or the element to the given index
    var $elementToClone = $.isNumeric(index) ? $list.children().eq(index) : $list.children().last();
    var $clone1 = $elementToClone.clone();
    $clone1.removeClass('active');

    $clone1.insertAfter($elementToClone);

    // Update the id of the list item
    var nid = updateId($clone1);

    // Update the id of the inputs
    $clone1.find('.form-control').each(function() {
      var $this = $(this);
      updateId($this, $clone1);

      // Check if it is a wysiwyg field to initialize the wysiwyg editor
      if ($this.hasClass('control-wysiwyg')) {
        $this.css('display', ''); // Remove 'display:none' from textarea added by tinymce while initializing the editor
        $this.closest('.wysiwyg-editor').find('.mce-tinymce,.tox-tinymce').remove(); // Remove the DOM of the editor created for the element to clone
        $this.initWysiwyg(); // Initialize the wysiwyg editor
      }
    });

    // Update the id of the file input and initialize the ajax file input
    var $fileInput = $clone1.find('.jalios-publication-filebrowser');
    if ($fileInput.exists()) {
      updateId($fileInput, $clone1);

      // Enable file input
      if ($fileInput.is(':input')) { // classic file input
        $fileInput.prop('disabled', $wrapper.hasClass('disabled')); // Do not enable if the field is disabled
      } else { // plupload
        // Clean the plupload wrapper
        $fileInput.empty();
        // initialize the new plupload
        $fileInput.jcmsPlupload();
      }
      // Show file input
      $fileInput.removeClass('hide');

      // Hide and disable publication input
      $clone1.find('INPUT.form-control-display').addClass('hide').prop('disabled', true);
      // Hide and disable publication input
      $clone1.find('INPUT.form-control-value').addClass('hide').prop('disabled', true);
    } else {
      var $fileInput = $clone1.find('.control-file.plupload');
      if($fileInput.exists()) {
        updateId($fileInput);

        // Clean the plupload wrapper
        $fileInput.empty();
        // initialize the new plupload
        $fileInput.jcmsPlupload();
      }
    }

    // Clear the inputs
    _clear($clone1);

    // TextArea / Fieldgroup
    var $tabs = $wrapper.find('.jalios-nav-pills');
    var $clone2 = $tabs.children().last().clone();
    $clone2.removeClass('active');
    $tabs.append($clone2);

    if (nid) {
      // Update the id of the tab link and the 'data-jalios-fieldgroup' attribute if exists
      var clonedTabLink = $clone2.children();
      var cpt = parseInt(nid.substring(nid.lastIndexOf('_') + 1))
      clonedTabLink.attr('href', '#' + nid).html(cpt + 1);
      var fieldGroup = clonedTabLink.data('jalios-fieldgroup');
      if (fieldGroup) {
        var fieldGroupId = fieldGroup.substring(0, fieldGroup.lastIndexOf('_') + 1) + cpt;
        clonedTabLink.data('jalios-fieldgroup', fieldGroupId);
        clonedTabLink.attr('data-jalios-fieldgroup', fieldGroupId);
      }
    }
    
    // Focus the cloned element
    let firstFocusableElement = $.jalios.a11y.getFocusInformation($clone1).firstFocusableElement;
    if (firstFocusableElement) {
      firstFocusableElement.focus();
    }
    
    var event = $.Event('jalios:field');
    event.field = {};
    event.field.type = "addedField";
    event.field.wrapper = $wrapper;
    event.field.clones = [$clone1, $clone2];
    
    $(document).trigger(event);
  };

  var updateId = function(elt, parent) {
    var $elt = $(elt);
    var id = $elt.attr('id');
    if (id) {
      var prefix = id.substring(0, id.lastIndexOf('_') + 1);
      var cpt = parseInt(id.substring(id.lastIndexOf('_') + 1)) + 1;
      if(parent) {
        var pid = $(parent).attr('id');
        if(pid) {
          cpt = parseInt(pid.substring(pid.lastIndexOf('_') + 1));
        }
      }
      var newId = prefix + cpt;

      $elt.attr('id', newId);
      return newId;
    }
    return false;
  };

  // ==========================================
  //  CTXMENU
  // ==========================================

  var ctxItems = {
    UI_EDITOR_COLORCHOOSER:        'F',
    UI_EDITOR_IMAGEPATH:           'I',
    UI_EDITOR_SIMPLEIMAGEPATH:     'I',
    UI_EDITOR_MEDIAPATH:           'M',
    UI_EDITOR_SIMPLEMEDIAPATH:     'M',
    UI_EDITOR_DATECHOOSER:         'V',

    UI_EDITOR_MEMBERCHOOSER:       'EHJY',
    UI_EDITOR_GROUPCHOOSER:        'EGY',
    UI_EDITOR_PUBLICATIONCHOOSER:  'ELXMSCcY',
    UI_EDITOR_PUBLICATIONSCHOOSER: 'ELXMSCcY',
    UI_EDITOR_CATEGORYCHOOSER:     'EZY',
    UI_EDITOR_CATEGORIESCHOOSER:   'EZY',
    UI_EDITOR_WORKSPACECHOOSER:    'EOY',
    UI_EDITOR_QUERYCHOOSER:        'QY',
    UI_EDITOR_ACLCHOOSER:          'Y',
    UI_EDITOR_SQLQUERY:            '',
    UI_EDITOR_DBRECORDCHOOSER:     ''
  };

  var ctxWidgetMenuHook = function($elm, options) {

    var $widget  = $elm.getWidget();
    var $wrapper = $.jalios.ui.Widget.getWrapper($elm);

    // Items
    options.items = '';

    // Items: base
    var classes = $widget.attr('class').split(/\s+/);
    for (var i = 0 ; i < classes.length ; i++){
      if (!ctxItems[classes[i]]){ continue; }
      options.items += ctxItems[classes[i]];
    }

    // Items: MV
    if ($wrapper.is('LI')){
      options.items = ($wrapper.parent().is('OL') && !$widget.hasClass('nodnd')) ? ('R'+options.items+'-ATUD-') : (options.items+'-AT-');
    } else {
      options.items = 'R' + options.items;
    }

    // Items: ML
    if ($widget.is('ml')){
      options.items += 'y';
    }

    // Language
    options.lang = $.jalios.ui.Widget.getLanguage($elm);

    var $chooser = $wrapper.find('INPUT.formChooserfield');
    if (!$chooser.exists()){ return; }

    // Chooser Id
    options.chooserId = $chooser.val();

    // Chooser Type
    options.chooserType = $widget.matchClass(/super_([\w\.]+)/, 1) || false;
  };

  // ==========================================
  //  WIDGET
  // ==========================================

  /**
   * Utility function for widgets
   */
  $.jalios.ui.Widget = {

    /**
     * Return the wrapping widget DIV
     * @param {element} elm the trigger
     */
    getWidget: function(elm){
      if (!elm){ return; }
      var $e = $(elm);
      return $e.closest('DIV.widget, SPAN.widget');
    },

    /**
     * Return the first wrapper of element DIV or LI if multivalued widget
     * @param {element} elm the trigger
     */
    getWrapper: function(elm){
      if (!elm){ return; }
      var $e = $(elm);
      var $w = $e.closest('LI, DIV');
      return $w.is('.input-group-btn') ? $w.parent() : $w;
    },

    /**
     * Return the language for given widget element
     * @param {element} elm the trigger
     */
    getLanguage: function(elm){
      if (!elm){ return; }
      var $e = $(elm);
      return $e.closest('DIV.wdglang').matchClass(/wdglang-(\S+)/, 1) || false;
    },

    'smartFocus': smartFocus,
    'clear': clear
  };

  // ==========================================
  //  KEYWORD
  // ==========================================

  /**
   * Specific function for Widget Keyword
   */
  $.jalios.ui.Widget.Keyword = {

    isInKeyword: function(elm) {
      return $.jalios.ui.Widget.getWidget(elm).hasClass('keyword');
    },

    resizeKeyword: function(input){
      if (!$.jalios.ui.Widget.Keyword.isInKeyword(input)){ return; }
      var $input = $(input);
      $input.attr('size', $input.val().length || 1);
    },

    toggleClear: function(input){
      if (!$.jalios.ui.Widget.Keyword.isInKeyword(input)){ return; }
      var $input = $(input);

      // $input.parent().find('BUTTON[data-jalios-action^="chooser:"]').first().remove();
      // $input.parent().find('BUTTON[data-jalios-action^="chooser:"]').first().addClass('hide');
      // $input.parent().find('BUTTON[data-jalios-action^="widget:clear"]').removeClass('hide');
    }
  };

  // ==========================================
  //  $.fn
  // ==========================================

  /**
   * Helper to retrieve wrapping widget of given element.
   */
  $.fn.getWidget = function() {
    return $.jalios.ui.Widget.getWidget(this);
  };

  /**
   * Helper to perform smart focus in the wrapping DIV
   */
  $.fn.smartFocus = function() {
    return $.jalios.ui.Widget.smartFocus(this);
  };

  $.fn.focusWithoutScrolling = function(){
    if (!this.exists()){ return; }
    var x  = window.scrollX, y = window.scrollY, $w = $(window);

    this.parents('DIV').each(function(){
      if ($(this).css('overflow') != 'auto'){ return; }
      $w = $(this);
      y = $w.scrollTop();
      x = $w.scrollLeft();
      return false;
    });

    this.focus();
    $w.scrollTop(y);
    $w.scrollLeft(x);
  };

  /**
   * Toggle the field to be disabled or not.
   */
  $.fn.toggleDisabledField = function() {
    $(this).toggleClass('disabled');
    $(this).find(':input').prop('disabled', function (_, val) { return ! val; });
    $(this).find('A.ctxLangForm').toggleClass('disabled');
  };

  var _addClass = $.fn.addClass;
  $.fn.addClass = function(clazz) {
    var r = _addClass.apply(this, arguments);
    if (this.exists() && (clazz == 'active' || clazz == 'in')){
      smartFocus(this);
    }
    return r;
  };

  var _removeClass = $.fn.removeClass;
  $.fn.removeClass = function(clazz) {
    var r = _removeClass.apply(this, arguments);
    if (this.exists() && (clazz == 'hide' || clazz == 'hide-scroll')){
      smartFocus(this, clazz == 'hide-scroll');
    }
    return r;
  };

  // ==========================================
  //  READY
  // ==========================================


  // Plugin initialization on DOM ready
  $(document).ready(function($) {
    register();
  });

}(window.jQuery);