(function ($, window, document, undefined) {
  const pluginName = 'jaliosDirtyFormControlPlugin',
    dataKey = 'plugin_' + pluginName,
    defaults = {
      config: {}
    };

  function Plugin(element) {
    this.$element = $(element);
    this._defaults = defaults;
    this._name = pluginName;
    this.init();
  }

  Plugin.prototype = {
    // initialize options
    init: function () {
      this.registerFormChange();
    },

    /**
     * listen to any input change in a form
     */
    registerFormChange: function () {
      let that = this;
      if (!this.$element.is('form')) {
        $.console.log('Jalios dirty form control only works on FORM element');
      }

      this.$element.find(':input').on('jalios.date.change change input', function () {
        that.$element.data('is-form-dirty', true);
      });
    },

    /**
     * Check if a form is dirty
     * Also handle any wysiwyg changes
     */
    isFormDirty: function () {
      let isDirty = this.$element.data('is-form-dirty');
      if (isDirty) {
        return true;
      }

      // Special case for wysiwyg
      if (typeof tinyMCE !== 'undefined') {
        var isAnyWysiwygDirty = false;
        $.each(tinyMCE.editors, function (idx, editor) {
          if ($(editor.formElement).hasClass('jalios-dirty-form-control')) {
            isAnyWysiwygDirty |= editor.isDirty();
          }
        });
        if (isAnyWysiwygDirty) {
          return true;
        }
      }

      return false;
    }
  };

  /*
   * Plugin wrapper, preventing against multiple instantiations and return plugin instance.
   */
  $.fn[pluginName] = function (options) {
    var args = arguments;

    // Is the first parameter an object (options), or was omitted,
    // instantiate a new instance of the plugin.
    if (options === undefined || typeof options === 'object') {
      return this.each(function () {
        // Only allow the plugin to be instantiated once,
        // so we check that the element has no plugin instantiation yet
        if (!$.data(this, dataKey)) {
          var objD = $(this).data();
          // if it has no instance, create a new one, pass options to our plugin constructor,
          // and store the plugin instance in the elements jQuery data object.
          $.data(this, dataKey, new Plugin(this, options, objD));
        }
      });

      // If the first parameter is a string and it doesn't start
      // with an underscore or "contains" the `init`-function,
      // treat this as a call to a public method.
    } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
      // Cache the method call
      // to make it possible
      // to return a value
      var returns;

      this.each(function () {
        var instance = $.data(this, dataKey);

        // Tests that there's already a plugin-instance
        // and checks that the requested public method exists
        if (instance instanceof Plugin && typeof instance[options] === 'function') {
          // Call the method of our plugin instance,
          // and pass it the supplied arguments.
          returns = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
        }

        // Allow instances to be destroyed via the 'destroy' method
        if (options === 'destroy') {
          $.data(this, dataKey, null);
        }
      });

      // If the earlier cached method
      // gives a value back return the value,
      // otherwise return this to preserve chainability.
      return returns !== undefined ? returns : this;
    }
  };

  /**
   * Init form with css class jalios-dirty-form-control
   */
  const initDirtyFormListener = function () {
    if ($('.jalios-dirty-form-control').length > 0) {
      window.onbeforeunload = validateDirtyFormBeforeUnload;
      $('.jalios-dirty-form-control').each(function (index, element) {
        if (!$(element).data('jalios-dirty-form-control-initialized')) {
          $(element).data('jalios-dirty-form-control-initialized', true);
          $(element).jaliosDirtyFormControlPlugin();
        }
      });
    }
  };

  /**
   * If any form got the css class jalios-dirty-form-control
   * Check if the form is not dirty
   * @param {*} event
   */
  const validateDirtyFormBeforeUnload = function (event) {
    // If this flag is enabled, the message will not be displayed
    if (window.disableOnBeforeUnloadMessage) {
      return;
    }

    let isAnyFormDirtry = false;
    $('.jalios-dirty-form-control').each(function (index, element) {
      if ($(element).data(dataKey).isFormDirty()) {
        isAnyFormDirtry = true;
      }
    });

    if (isAnyFormDirtry) {
      return I18N.glp('warn.edit.contentlost');
    }
    return;
  };
  $(document).ready(function () {
    initDirtyFormListener();

    $(document).on('jalios:refresh', function (event) {
      let refresh = $.jalios.Event.match(event, 'refresh', 'after');
      if (refresh) {
        initDirtyFormListener();
      }
    });
  });
})(jQuery, window, document);
