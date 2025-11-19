!(function ($) {
  // Action regexp
  var pattern1 = /(chooser):([\w-]+)/i;
  var pattern2 = /(widget):([\w-]+)/i;

  var chooserConfiguration = {
    acl: {
      path: $.jalios.Http.buildUrl('work/chooser/aclChooser.jsp'),
      name: 'ACL'
    },
    category: {
      path: $.jalios.Http.buildUrl('work/categoryChooser.jsp?cids={value}'),
      name: 'Category'
    },
    country: {
      path: $.jalios.Http.buildUrl('work/chooser/countryChooser.jsp'),
      name: 'Country'
    },
    dbrecord: {
      path: $.jalios.Http.buildUrl('work/dbrecordChooser.jsp'),
      name: 'DBRecord'
    },
    document: {
      path: $.jalios.Http.buildUrl('work/docChooser.jsp', { nbElt: '1' }),
      name: 'Document'
    },
    group: {
      path: $.jalios.Http.buildUrl('work/chooser/groupChooser.jsp'),
      name: 'Group'
    },
    image: {
      path: $.jalios.Http.buildUrl('work/mediaBrowser.jsp', { selectMode: 'true', medias: 'image' }), // use plural "medias" to restrict list
      name: 'Image',
      ref: 'mediabrowser'
    },
    language: {
      path: $.jalios.Http.buildUrl('work/langChooser.jsp'),
      name: 'Language'
    },
    media: {
      path: $.jalios.Http.buildUrl('work/mediaBrowser.jsp', { selectMode: 'true' }),
      name: 'Media',
      ref: 'mediabrowser'
    },
    member: {
      path: $.jalios.Http.buildUrl('work/chooser/memberChooser.jsp'),
      name: 'Member'
    },
    publication: {
      path: $.jalios.Http.buildUrl('work/pubChooser.jsp'),
      name: 'Publication'
    },
    query: {
      path: $.jalios.Http.buildUrl('work/queryChooser.jsp', { qs: '{value}' }),
      name: 'Query'
    },
    workspace: {
      path: $.jalios.Http.buildUrl('work/workspace/workspaceChooser.jsp'),
      name: 'Workspace'
    },
    unifiedinsert: {
      path: 'work/unifiedinsert/unifiedinsert.jsp?',
      name: 'UnifiedInsert'
    }
  };

  // ------------------------------------------
  // PRIVATE
  // ------------------------------------------

  var register = function () {
    // Register to broker
    $(document).on('jalios:broker', brokerCallback);

    // Fix duration chooser
    $(document).on('keyup', '.duration_user', function (event) {
      var $e = $(event.currentTarget);
      updateDuration($e, 1000);
    });
    $(document).on('change', '.duration_unit', function (event) {
      var $e = $(event.currentTarget);
      updateDuration($e, 1000);
    });
    $(document).on('change', '.jalios-country', function (event) {
      var $e = $(event.currentTarget);
      $e.prev('INPUT.jalios-country-display')
        .removeClass(event.previousValue + '-flag')
        .addClass(event.currentVal + '-flag');
    });
    $(document).on('change', '.control-date', function (event) {
      var $e = $(event.currentTarget);
      updateDateHiddenInput($e);
      var options = { event: 'change' };
      $e.trigger(jQuery.Event('jalios.date.change', options));
    });
    $(document).on('focusout', ':input[data-jalios-event="datechange"]', function (ev) {
      var $this = $(this);
      var value = $this.val();
      if (value) {
        var $elm = $this.closest('.datepicker-wrapper');
        var lang = jQuery.jalios.I18N.glp('lang.datepicker');
        var showTime = $elm.closest('.widget').hasClass('jalios-date-time');
        var date = stringToDate(value, showTime, lang);
        if (date) {
          var oldDate = stringToDate($elm.data('date'), showTime, lang);
          if (!oldDate || oldDate.getTime() !== date.getTime()) {
            setTimeout(function () {
              var options = {
                date: moment(date), // date the picker changed to. Type: moment object (clone)
                event: 'focusout'
              };
              $this.trigger(jQuery.Event('datechange', options));
            }, 100);
          }
        }
      }
    });
    $(document).on('change', '.form-control-value.jalios-workspace', function (event) {
      var $e = $(event.currentTarget);
      var $widget = $e.closest('.widget');
      if (!$widget || !$widget.exists()) {
        return;
      }
      var $wkChooser = $widget.find('.triggerWsChangeRefresh');
      if (!$wkChooser || !$wkChooser.exists()) {
        return;
      }
      var $input = $widget.find('.workspaceChangeEvent');
      if (!$input || !$input.exists()) {
        return;
      }
      $input.val(true);
      $e.refresh();
    });
  };

  // ------------------------------------------
  // WIDGET
  // ------------------------------------------

  var brokerCallback = function (event) {
    var broker = $.jalios.Event.match(event, 'broker');
    if (!broker) {
      return;
    }

    // No pattern
    var regex1 = broker.type.match(pattern1);
    var regex2 = broker.type.match(pattern2);
    if (!(regex1 || regex2)) {
      return;
    }

    // No action
    var regex = regex1 ? broker.type.match(pattern1) : broker.type.match(pattern2);
    var swtch = regex[1];
    var attr = regex[2];
    if (!swtch || !attr) {
      return;
    }

    // Element
    var $elm = $(broker.source.currentTarget);

    // Handle dropdown menus and dropdown submenus
    var $parent = $elm.closest('.input-group-btn').find('.dropdown-menu');
    while ($parent.exists() && $parent.hasClass('dropdown-menu')) {
      $parent = $parent.parent();
      if ($parent.hasClass('dropdown-submenu')) {
        $parent = $parent.parent();
      }
    }
    if (!$parent.exists()) {
      $parent = $elm.parent();
    }

    var $chooser = $parent.prevAll('INPUT.form-control-value');
    if (!$chooser.exists()) {
      $chooser = $parent.prevAll('INPUT.form-control.control-file');
    } // Simple file
    if (!$chooser.exists()) {
      $chooser = $elm.closest('.control-file.plupload');
    } // Plupload file

    var options = broker.options;

    // Action
    if (chooserConfiguration[attr]) {
      openElementDataChooser($chooser, attr, options, $elm);
    } else if (attr == 'color') {
      try {
        if (!$elm.is('INPUT')) {
          let $spectrumInput = $elm.closest('.input-group').find('.spectrum');
          $spectrumInput.spectrum('show');
        }
      } catch (err) {
        $.console.log(err);
      }
    } else if (attr == 'duration') {
      // FIXME
    } else if (attr == 'date') {
      if (!$chooser.exists() && $elm.is('INPUT')) {
        $chooser = $elm;
      }
      openDateChooser($elm, $chooser);
    } else if (attr == 'clear') {
      $.jalios.ui.Widget.clear($chooser);

      // Clear color
      try {
        if (!$elm.is('INPUT')) {
          let $spectrumInput = $elm.closest('.input-group').find('.spectrum');
          if ($spectrumInput.length) {
            $spectrumInput.spectrum('set', '');
          }
        }
      } catch (err) {
        $.console.log(err);
      }

      // Clear country flag
      if ($chooser.hasClass('jalios-country') && !$chooser.val()) {
        var $countryDisplay = $chooser.prev('.control-country');
        var match = $countryDisplay[0].className.match(/\w*-flag/g);
        if (match) {
          for (var i = 0; i < match.length; i++) {
            $countryDisplay.removeClass(match[i]);
          }
          $countryDisplay.addClass('-flag');
        }
      }

      if ($chooser.data('jalios-event') === 'datechange') {
        var options = {
          event: 'clear'
        };
        $chooser.trigger(jQuery.Event('datechange', options));
      }

      // Clear filedocument chooser to display back the input file
      if ($chooser.hasClass('jalios-publication')) {
        var $widget = $.jalios.ui.Widget.getWidget($chooser);
        // Check if the chooser is in a widget because when we remove one of choosers, the chooser is removed from the widget. So it is useless to try to display the input file.
        // If there is only one chooser it is not removed from the widget, so we try to display the input file.
        if ($widget.exists()) {
          var $item = $chooser.closest('.jalios-input-group');
          var $fileInput = $item.find('.jalios-publication-filebrowser');
          if ($fileInput.exists()) {
            // Do not enable if the field is disabled
            $fileInput.prop('disabled', $widget.hasClass('disabled'));
            $fileInput.attr('disabled', null);
            // Show file input
            $fileInput.removeClass('hide');

            // Hide and disable publication input
            $item.find('INPUT.form-control-display').addClass('hide').prop('disabled', true);
            // Hide and disable publication input
            $item.find('INPUT.form-control-value').addClass('hide').prop('disabled', true);
          }
        }
      }
    } else if ($elm.attr('data-jalios-chooser')) {
      options.customId = attr;
      openElementDataChooser($chooser, $elm.attr('data-jalios-chooser'), options, $elm);
    }
  };

  var openElementDataChooser = function ($chooser, chooserName, customParams, $elm) {
    var callback = function (id, title, media, url) {
      var $parent = $chooser.parent();
      var $input = $parent.find('INPUT.form-control-display');
      if ($input.exists()) {
        var previousIdValue = $chooser.val();
        $chooser.val(id || '').trigger(jQuery.Event('change', { previousValue: previousIdValue, currentVal: id }));
        var previousTitleValue = $input.val();
        $input
          .val(title || '')
          .trigger(jQuery.Event('change', { previousValue: previousTitleValue, currentVal: title }));
      } else {
        var previousValue = $chooser.val();
        $chooser.val(url || '').trigger(jQuery.Event('change', { previousValue: previousValue, currentVal: url }));
      }

      // Handle publication chooser with input file
      var $fileInput = $parent.find('.jalios-publication-filebrowser');
      if ($fileInput.exists()) {
        // Hide file input
        $fileInput.addClass('hide');
        // Disable file input
        if ($fileInput.is(':input')) {
          // classic file input
          $fileInput.prop('disabled', true);
        } else {
          // plupload
          $fileInput.find('INPUT[type="file"]').prop('disabled', true);
        }
        // Display publication input
        $input.removeClass('hide');
        // Enable publication/chooser inputs
        $input.prop('disabled', false);
        $chooser.prop('disabled', false);
      }

      // Handle publication chooser with dropdown menu: if there is an id, display the dropdown and hide the clear button
      if ($chooser.hasClass('jalios-publication') && id) {
        var isKeyword = $.jalios.ui.Widget.Keyword.isInKeyword($chooser);
        // Do not display the dropdown menu if it's a publication keyword
        if (!isKeyword) {
          var $inputGroupBtn = $parent.find('.input-group-btn');
          var $dropdown = $inputGroupBtn.find('.dropdown-toggle');
          if ($dropdown.exists()) {
            $.fn.dropdown.clearMenus();
            var $dropdownMenu = $inputGroupBtn.find('.dropdown-menu');
            $dropdownMenu.find('.edit-item').removeClass('hide'); // Show the edit item
            $dropdownMenu.find('.add-item').addClass('hide'); // Hide the add item
            // $dropdown.removeClass('hide'); // Display the dropdown
            // $parent.find('.input-group-btn .btn-remove').addClass('hide') // Hide the clear button
          }
        }
      }

      var $widget = $chooser.closest('.widget');
      if ($widget.exists() && $widget.hasClass('keyword')) {
        // Add new empty input for keyword field
        JCMS.form.Widget.add($input[0]);
      }
    };

    var options = {
      currentValue: $chooser.val(),
      params: customParams,
      popup: {}
    };

    if ($elm.data('jalios-chooser-popup-width')) {
      options.popup.width = $elm.data('jalios-chooser-popup-width');
    }

    if ($elm.data('jalios-chooser-popup-height')) {
      options.popup.height = $elm.data('jalios-chooser-popup-height');
    }

    // Automatically retrieve the workspace from the "ws" input IF :
    // - Workspace is not specifically defined,
    // - and the chooser is in a publication editing form (eg. edit a generated type), a modal or any other form with ws input
    // - and chooser is not a group chooser (cf JCMS-7176)
    // - and chooser is not a member chooser (cf JCMS-6904)
    var $editPubForm = $chooser.closest('.edit-pub,#jalios-modal,form');
    if (!options.params.ws && !options.params.workspaceFilter && $editPubForm.exists() && chooserName !== 'group' && chooserName !== 'member') {
      var $wsInput = $editPubForm.find(':input[name="ws"]');
      if ($wsInput.exists()) {
        options.params.ws = $wsInput.val();
      }
    }
    // However, for chooser:edit action, never replace the workspace of the content being edited
    if (options.params.customId === 'edit') {
      delete options.params.ws;
    }

    $.jalios.ui.Widget.Chooser.openDataChooser(chooserName, callback, options);
  };

  // See also:
  // https://eonasdan.github.io/bootstrap-datetimepicker/
  var openDateChooser = function ($trigger, $chooser) {
    var $elm = $trigger.closest('.datepicker-wrapper');
    if (!$elm.data('DateTimePicker')) {
      var lang = jQuery.jalios.I18N.glp('lang.datepicker');
      var showTime = $elm.closest('.widget').hasClass('jalios-date-time');

      $elm
        .datetimepicker({
          locale: lang, // document.documentElement.getAttribute('xml:lang'),
          format: getDateFormat(!showTime),
          calendarWeeks: true,
          stepping: 1,
          /* allowInputToggle: true, */
          widgetParent: $(document.body),
          // debug: true,
          keyBinds: {
            "left": null,
            "right": null,
            "delete": null
          },
          icons: {
            "time": 'glyphicons-clock',
            "date": 'glyphicons-calendar',
            "up": 'glyphicons-chevron-up',
            "down": 'glyphicons-chevron-down',
            "previous": 'glyphicons-chevron-left',
            "next": 'glyphicons-chevron-right',
            "today": 'glyphicons-screenshot',
            "clear": 'glyphicons-trash'
          }
        })
        .on('dp.change', function (ev) {
          var options = {
            date: ev.date, // date the picker changed to. Type: moment object (clone)
            oldDate: ev.oldDate, // previous date. Type: moment object (clone) or false in the event of a null
            event: 'change'
          };
          updateDateHiddenInput($elm);
          $chooser.trigger(jQuery.Event('jalios.date.change', options));
        })
        .on('dp.hide', function (ev) {
          var options = {
            date: ev.date, // date the picker changed to. Type: moment object (clone)
            event: 'hide'
          };
          updateDateHiddenInput($elm);
          if (ev.date) {
            $chooser.trigger(jQuery.Event('datechange', options));
          }
        });
    }

    $elm.data('DateTimePicker').show();
  };

  // ------------------------------------------
  // DATA
  // ------------------------------------------

  $.jalios.ui.Widget.Chooser = {
    /**
     * Open a Data chooser of the specified type, or a custom chooser if the specified type does not match any known chooser.
     *
     * @param chooserTypeOrCustomPath a chooser type from one of the following values : 'acl', 'category', 'country', 'dbrecord', 'document', 'group', 'image', 'media', 'member', 'publication', 'query', 'workspace' or a custom path to be opened in the chooser
     * @param options an options object that may specify the following property 'currentValue' : for any current value being select 'params' : an optional array or object that will be serialized in the choose URL if specified
     * @param callback a callback function invoked when chooser is closed with a value
     */
    openDataChooser: function (chooserTypeOrCustomPath, callback, options) {
      var options = options || {};
      options.currentValue = options.currentValue || '';
      options.params = options.params || {};
      var callback = callback || function (args) { };

      var chsrId, chsrUrl, chsrName;
      if (chooserConfiguration[chooserTypeOrCustomPath]) {
        chsrId = chooserConfiguration[chooserTypeOrCustomPath]['ref'] || chooserTypeOrCustomPath;
        chsrUrl = chooserConfiguration[chooserTypeOrCustomPath].path;
        chsrName = chooserConfiguration[chooserTypeOrCustomPath].name;
      } else {
        chsrId = options.params.customId || 'custom';
        chsrUrl = chooserTypeOrCustomPath;
        chsrName = 'Custom';
      }

      // Replace {value} in chooser path with the current chooser value if any
      chsrUrl = chsrUrl.replace(new RegExp(encodeURIComponent('{value}')), encodeURIComponent(options.currentValue));

      // Merge the parameters retrieved from the options
      chsrUrl = $.jalios.Http.buildUrl(chsrUrl, options.params);

      // Add context path to complete the URL
      chsrUrl = $.jalios.Http.getContextPath() + '/' + chsrUrl;

      // Fallback on default popup width & height
      options = $.extend(
        true,
        {
          popup: {
            width: 1080,
            height: 600
          }
        },
        options
      );

      // Compute chooser dimension
      var chsrWidth = options.popup.width;
      var chsrHeight = options.popup.height;

      // Open Chooser
      $.jalios.Browser.popupWindow(chsrUrl, chsrName, chsrWidth, chsrHeight, false, true, true, false, false, callback);
    }
  };

  // ------------------------------------------
  // DATE
  // ------------------------------------------

  /**
   * For date field, update hidden input used on server side when
   * timezone is enabled.
   *
   * If timezone is enabled, 2 input will be used for date picker :
   * - the display input, in the user timezone
   * - the hidden input, in the server timezone
   *
   * This method uses moment-timezone to update the hidden
   * input from the new date selected in the display input
   *
   * @param elm any DOM element inside a date field wrapper
   * @since jcms-10.0.1 / JCMS-4865 ++ jcms-10.0.3 / JCMS-7514
   */
  var updateDateHiddenInput = function (elm) {
    var lang = jQuery.jalios.I18N.glp('lang.datepicker');
    var $elm = jQuery(elm).closest('.datepicker-wrapper').addBack('.datepicker-wrapper');
    var $widgetElm = $elm.closest('.widget');
    var showTime = $widgetElm.hasClass('jalios-date-time');
    var $userInput = $elm.find('.form-control-display');
    var $hiddenInput = $elm.find('.form-control-value');
    if (!$userInput.exists()) {
      return;
    }
    var userTimeZone = $userInput.data('timezone');
    var serverTimeZone = $hiddenInput.data('timezone');
    var userSelectedDate = $userInput.val();
    var userZonedDate = moment.tz(userSelectedDate, getDateFormat(!showTime), userTimeZone);
    if (userZonedDate.isValid()) {
      var serverZonedDate = userZonedDate.clone().tz(serverTimeZone);
      var serverZoneDateStr = serverZonedDate.format(getDateFormat(!showTime));
      $hiddenInput.val(serverZoneDateStr);
    }
  };

  /**
   * Parse the string value of date input to a Date object.
   *
   * @param str the date to parse
   * @param showTime true if the str contains date & time, false if str contains only the date
   * @return a Date object or null if date could not be parsed
   */
  var stringToDate = function (str, showTime, lang) {
    var date;

    if (str) {
      var d = moment(str, getDateFormat(!showTime), lang || I18N['lang.datepicker'], true);
      if (d.isValid()) {
        date = d.toDate();
      }
    }

    return date;
  };

  /**
   * Retrieve a string representation of the specified Date object.
   *
   * @param str the date to parse
   * @param showTime true if the resulting str must contains date & time, false if str must constains only the date
   * @return a string representation of the date or null if date could not be parsed
   */
  var dateToString = function (date, showTime, lang) {
    var dateString;

    if (date) {
      dateString = moment(date)
        .locale(lang || I18N['lang.datepicker'])
        .format(getDateFormat(!showTime));
    }

    return dateString;
  };

  /**
   * Retrieve the date string format used in date input.
   *
   * @param dateOnly true if the date format should contains only the date, false if the str must also contains the time
   * @return a date format
   */
  var getDateFormat = function (dateOnly) {
    return I18N.glp(dateOnly ? 'datechooser.js.date-format' : 'datechooser.js.date-time-format');
  };

  /**
   * Update the Date field convert the long to date
   *
   * @param $trigger the trigger of the update
   */
  var updateDate = function ($e) {
    var time = $e.closest('.widget').hasClass('jalios-date-time');
    var val = $e.val();
    if (!val) {
      return;
    }

    var lg = parseInt(val);
    var date = new Date(lg);
    $e.val(dateToString(date, time));
  };

  /**
   * Update the Duration field of Duration Chooser
   *
   * @param $trigger the trigger of the update
   */
  var updateDuration = function ($trigger, resolution) {
    var $wrapper = $.jalios.ui.Widget.getWrapper($trigger);
    var $duration = $wrapper.find('INPUT.duration');
    var $time = $wrapper.find('INPUT.duration_user');
    var $unit = $wrapper.find('SELECT.duration_unit');

    if (!$time.exists()) {
      return;
    }

    $time.val($time.val().replace(/[^0-9\.]/, ''));
    var value = $time.val() ? parseInt(Math.round($time.val())) * parseInt($unit.val()) : '';
    $duration.val(value);
  };

  $.jalios.ui.Widget.Date = {
    stringToDate: stringToDate,
    dateToString: dateToString,
    getDateFormat: getDateFormat,
    updateDuration: updateDuration,
    updateDate: updateDate,
    openDateChooser: openDateChooser
  };

  // ------------------------------------------
  // REGISTER
  // ------------------------------------------

  // Plugin initialization on DOM ready
  $(document).ready(function ($) {
    register();
  });
})(window.jQuery);
