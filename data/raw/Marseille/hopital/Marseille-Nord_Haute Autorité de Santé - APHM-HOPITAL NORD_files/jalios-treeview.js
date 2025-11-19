!function ($) {
  
  var register = function() {
    
    // Upgrade
    $.jalios.ui.TreeView.upgrade();
    
    // Setup autocomplete
    autocomplete($(document));
    
    // Register to Ajax-Refresh
    $(document).on('jalios:refresh', function(event) {
      
      var refresh = $.jalios.Event.match(event, 'refresh', 'after');
      if (!refresh){ return; }
      if (!refresh.target){ return; }
      
      refresh.target.each(function() {
        $.jalios.ui.TreeView.upgrade(this);
      });
      
      autocomplete(refresh.target);
    });
    
    // Populate Treeview after autocomplete
    $(document).on("jalios:autocomplete", populateTreeView);
    
    // Register click event
    $(document).on('click', 'UL.treeview .icon-treeview', toggle);
    
    $(document).on('click', ".js-unselect-radio", function(event) {
      let $radioInput = $(event.currentTarget);
      if($radioInput.attr('previousValue') == 'true'){
        $radioInput.prop('checked', false)
      } else {
        $radioInput.attr('previousValue', false);
      }
  
      $radioInput.closest(".treeview").find(".js-unselect-radio").each(function(idx, element) {
        $(element).attr('previousValue', false);
      });
      
      $radioInput.attr('previousValue', $radioInput.is(":checked"));
    });
    
    $(document).on('change', ".js-unselect-radio", function(event) {
      let $radioInput = $(event.currentTarget);
      $radioInput.attr('previousValue', $radioInput.is(":checked"));
    });
    
    // Register mouseover
    $(document).on('mouseover', 'UL.treeview.dragdrop .treeview-item-icon', drag);
  }

  var autocomplete = function($e) {
  
    // Init Autocomplete on TreeCat
    $e.find('UL.treeview.autocomplete').each(function() {
      var $this = $(this);
      if($this.children('LI').exists()) {
        var url = 'jcore/autocomplete/accategory.jsp?acadd=false';
        url += $this.hasClass('filter-manage') ? '&filter=MANAGE'
               : $this.hasClass('filter-use') ? '&filter=USE'
               : $this.hasClass('filter-read') ? '&filter=READ'
               : '';
        url += $this.hasClass('selectable') ? '&selectable=true' : '';
        url += "&rootCids="+$this.matchClass(/ID_(\w+)/g).join('&rootCids=');
        url += "&rm="+$this.matchClass(/RM_(\w+)/g).join('&rm=');
        
        var clazz = 'form-control typeahead treecatcomplete hidden-print' + ($this.hasClass('hide') ? ' hide' : '');
        var ph = $this.data("jalios-categorytree-search-input-context") && $this.data("jalios-categorytree-search-input-context").placeholder ? $this.data("jalios-categorytree-search-input-context").placeholder : I18N.glp('info.msg.autocomplete');
        var ariaLabel = $this.data("jalios-categorytree-search-input-context") && $this.data("jalios-categorytree-search-input-context").ariaLabel ? $this.data("jalios-categorytree-search-input-context").ariaLabel : I18N.glp('info.msg.autocomplete.search-category');
        var id = $this.attr('id');
        
        $this.before('<input type="text" class="' + clazz + '" data-jalios-treecat="' + id + '" aria-label="'+ ariaLabel +'" data-jalios-ajax-refresh-url="' + url + '" placeholder="' + ph + '"/>');
      } else {
        var clazz = 'alert alert-info' + ($this.hasClass('hide') ? ' hide' : '');
        $this.before('<div class="' + clazz + '"><p>' + I18N.glp('treecat.no-item') + '</p></div>');
      }
    });
    
    $(document).on('keydown', '.treecatcomplete', function(e) {
      // Prevent to submit the form when we click on the ENTER key on the empty input
      if (e.which == 13 && $(this).val().trim() === '') {
        e.preventDefault();
        return false;
      }
    });
  };

  var populateTreeView = function(event) {
    
    var typeahead = jQuery.jalios.Event.match(event, 'autocomplete');
    var treecat = typeahead.$element.attr('data-jalios-treecat');
    if (!treecat){ return; }
    
    // Clear input
    typeahead.$element.val('');
    
    // Refresh treecat with given value
    var value = typeahead.$menu.find('.active').attr('data-value');
    
    var $ul = typeahead.$element.next('UL.treeview');
    
    // Checked
    var checked = [];
    if($ul.hasClass('treeview-checkbox')) {
      $ul.find('INPUT[type=checkbox]:checked').each(function() {
        checked.push($(this).val());
      });
    }
    if ($ul.hasClass('treeinput')) {
      checked.push(value);
    }
    
    // Refresh
    var options = { params : { }};
    options.url = $ul.attr('data-jalios-ajax-refresh-url');

    options.params.treeHint = $ul.attr('data-jalios-treeview-hint');
    options.target = $ul;
    options.scroll = false;
    
    var $ahref = $ul.find('A[data-jalios-id=' + value + '].treeview-name');
    if ($ahref.exists()) {
      // Do not follow the link of the node if it's already selected/highlighted to not unselected this category
      if(!$ahref.hasClass('treeview-hl')) {
        // Add a callback to follow the link of the node after the tree is refreshed
        options.callback = function() {
          if ($ul.hasClass('treeinput')){ return; }
          $.jalios.DOM.follow($ahref);
        }
      }
    } else {
      options.callback = function(){
        if ($ul.hasClass('treeinput')){ return; }
        var $ahref = $ul.find('A[data-jalios-id='+value+'].treeview-name');
        $.jalios.DOM.follow($ahref);
      }
    }
    

    options.params.treeOpened  = checked.length > 0 ? checked : value;
    options.params.treeChecked = checked;
    options.params.treeHighlighted = checked;
    options.nohistory = true;
    
    $ul.refresh(options);
  }

  var drag = function(event) {
   
    var $e = $(event.currentTarget);
    
    $e.closest('UL[data-jalios-ajax-refresh-url].treeview-root.dragdrop').find('LI').each(function() {
      $(this).droppable({
        tolerance: 'pointer',
        greedy: true,
        drop: drop,
        accept: 'LI',
        hoverClass: 'sortable-active' // same as jalios-sortable.js
      });
    });
    
    $e.closest('LI').draggable({
      axis: 'y',
      cursor: 'move',
      revert: 'invalid',
      handle: '.treeview-item-icon'
    });
  }
  
  var drop = function(event, ui) {
    var $drag    = $(ui.helper);
    var $drop    = $(this);
    
    // Build options with drag/drop info
    var options = {
      params: {
        drag : $drag.getJcmsId(),
        drop : $drop.getJcmsId()
      }
    }
    
    // Retrieve wrapper
    var $ul = $drop.closest('UL[data-jalios-ajax-refresh-url].treeview');
    if (!$ul.exists()){ return; }
    
    // Checked
    var checked = [];
    $ul.find('INPUT[type=checkbox]:checked').each(function() {
      checked.push($(this).val());
    });
    
    // Refresh
    options.url = $ul.attr('data-jalios-ajax-refresh-url');
    options.params.treeOpened = $drop.getJcmsId();
    options.params.treeHighlighted = $drop.getJcmsId();
    options.params.treeHint = $ul.attr('data-jalios-treeview-hint');
    options.target = $ul;
    options.scroll = false;
    options.params.treeChecked = checked;
    
    $ul.refresh(options);
  }
  
  /**
   * Upgrade LI with:
   * - .icon-treeview
   * - Convenient state open/close
   * - Input vs Label
   */
  var upgrade = function(context) {
    
    var $lookup = $('.treeview', context || document);
    if (context && $(context).is('.treeview')) {
      $lookup = $lookup.add(context);
    }
    
    var now = new Date().getTime();
    $lookup.each(function() {
      $(this).children('LI').each(function() {

        var $li = $(this);

        // Set open/close LI status
        if (!$li.hasClass('treeview-open') && !$li.hasClass('treeview-close')) {
          var $ul = $li.children('UL.treeview');
          if ($ul.exists()) {
            if ($ul.children('LI').html()) {
              $li.addClass('treeview-open');
            } else {
              $li.addClass('treeview-close');
            }
          }
        }

        // Append trigger open/close
        if (!$li.hasClass('treecat-msg') && !$li.children(':first-child').is('.icon-treeview')) {
          $li.prepend('<span class="icon-treeview"></span> ');
        }
        
        // Bind checkbox and labels
        $li.children('INPUT').attr('id', function(idx, attr) {
          if (attr) return attr;
          attr = "treev_"+(now++);
          $(this).siblings('LABEL').attr('for', attr);
          return attr;
        });
      });
    });
  }
  
  /**
   * Toggle open/close of LI
   */
  var toggle = function(event) {
    var $li = $(this).parent();
    if ($li.hasClass('treeview-open')) {
      $li.removeClass('treeview-open').addClass('treeview-close');
    } else if ($li.hasClass('treeview-close')) {
      $li.removeClass('treeview-close').addClass('treeview-open');
      refresh($li);
    }
  }
  
  var refresh = function($li, openIds) {
    var $target = $li.is('UL') ? $li :  $li.find('> UL');
    
    // Build options
    var options = {
      url: 'jcore/treeview/treeview.jsp',
      target: $target,
      params: { treeId : $li.getJcmsId(true), treeChecked : [], treeHighlighted : [], treeOpened : [], treeCollection : [] },
      nohistory: true
    };
    
    // Add checked
    $li.find('INPUT[type=checkbox]:checked').each(function() {
      options.params.treeChecked.push($(this).val());
      options.params.treeHighlighted.push($(this).val());
    });
    
    var $wrapper = options.target.closest('UL[data-jalios-ajax-refresh-url].treeview');
    if ($wrapper.exists()) {
      options.url = $wrapper.attr('data-jalios-ajax-refresh-url');
      options.params.treeHint = $wrapper.attr('data-jalios-treeview-hint');
    }
    // JCMS-9415: Propagate original queryString / parameters
    if ($wrapper.length) {
      let $treeRoot = $wrapper.closest('UL.treeview-root');
      if ($treeRoot.length) {
        // Retrieve params as JSON string on treeview's UL main wrapper
        let originalQueryStringJSON = $treeRoot.attr('data-jalios-treeview-original-qs');
        if (originalQueryStringJSON) {
          let originalParams = JSON.parse(originalQueryStringJSON);
          if (originalParams) {
            // Add/restore each parameter for refresh
            for (let key in originalParams) {
              if (Object.prototype.hasOwnProperty.call(originalParams, key)) {
                options.params[key] = originalParams[key];
              }
            }
          }
        }
      }
    }

    if (openIds) {
      if($.isArray(openIds)) {
        $.merge(options.params.treeOpened, openIds);
        $.merge(options.params.treeCollection, openIds);
      } else {
        options.params.treeOpened.push(openIds);
        options.params.treeCollection.push(openIds);        
      }
    }
    
    // Refresh for Treeid
    if (options.params.treeId) {
      $li.refresh(options);
    }
    
    // Refresh if there is one parent
    else if (options.url /*&& options.url.indexOf('treeId') > 0*/) {
      $li.refresh(options);
    }
    
    // Refresh browser
    else {
      $.jalios.Browser.reload();
    }
  };
  
  var refreshNode = function(options) {
    let $refreshingElement = $('LI[data-jalios-id="' + options.nodeId + '"]');
    let $treeview;
    if (options.refreshRoot === "true") {
      // Refresh whole treeview
      $treeview = $refreshingElement.closest('UL[data-jalios-ajax-refresh-url].treeview-root');
    } else {
      // Refresh parent treeview
      $treeview = $refreshingElement.closest('UL[data-jalios-ajax-refresh-url].treeview');
    }
    // Simple refresh
    jQuery.jalios.ui.TreeView.refresh($treeview, false);
    jQuery.jalios.ui.CtxMenu.hide();
  }
  
  // ------------------------------------------
  //  PUBLIC
  // ------------------------------------------
  
  // Namespace
  if (!$.jalios)      { $.jalios    = {}; }
  if (!$.jalios.ui)   { $.jalios.ui = {}; }
  
  $.jalios.ui.TreeView = {
    'upgrade': upgrade,
    'refresh': refresh,
    'refreshNode': refreshNode
  }
  
  // ------------------------------------------
  //  READY
  // ------------------------------------------
  
  // Plugin initialization on DOM ready
  $(document).ready(function($) {
    register();
  });
  
}(window.jQuery);

  