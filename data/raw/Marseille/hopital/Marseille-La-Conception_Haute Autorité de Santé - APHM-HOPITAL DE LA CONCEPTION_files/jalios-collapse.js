!function ($) {

  let ready = function() {
    // Then setup
    setup();
  };

  let setup = function() {

    // checks collasped/expanded/dropup classes in app sidebar
    let adjustCollapsingClasses = function () {
        
      // use of data toggle class
      let $selector = $('[data-toggle="collapse"]:not(.collapsed)');
      // JCMS-8299: Only add .dropup class if there is no child already having .dropup class
      // (prevents duplicate .dropup class on parent and on great-parent)
      if (!$selector.has('.dropup')) {
        $selector.addClass('dropup');
      }

      // collapse class - hierarchical menu itself
      $selector = $('ul.collapse li.active').children(".app-sidebar-menu-node:not(.collapsed)");
      $selector.addClass('dropup');

      // collapse class - check sub-levels
      let $collapsedMenuItem = $('ul.collapse .app-sidebar-menu-node').closest('.app-sidebar-menu').find('li.active');
      if ($collapsedMenuItem.length) {
        do {
          $collapsedMenuItem = $collapsedMenuItem.closest('.app-sidebar-menu').siblings('.app-sidebar-menu-node:not(.collapsed)');
          $collapsedMenuItem.addClass("dropup");
        } while ($collapsedMenuItem.length !== 0);
      }
    };

    $(document).on('shown.bs.collapse hidden.bs.collapse', function(e) {
      let $trigger = $('[data-toggle="collapse"][href="#' + e.target.id + '"], [data-toggle="collapse"][data-target="#' + e.target.id + '"]');
      let $element = $($trigger.data('parent'));
      if($element.length <= 0) {
        $element = $trigger;
      }
      
      let $collapsIcon = $trigger.find('.jalios-icon.caret');
      $collapsIcon.parent().toggleClass('dropup');

      adjustCollapsingClasses();

      let toggleClass = $element.data('jalios-collapse-toggle');
      if(toggleClass) {
        $collapsIcon.toggleClass(toggleClass);
      }
    });

    $(document).on("jalios:refresh", function(event) {
      let refresh = $.jalios.Event.match(event, 'refresh', 'after');
      if (!refresh) {
        return;
      }
      adjustCollapsingClasses();
    });
    adjustCollapsingClasses();
  };

  // ------------------------------------------
  //  READY
  // ------------------------------------------

  // Plugin initialization on DOM ready
  $(document).ready(ready);

}(window.jQuery);