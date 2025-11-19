jq2 = jQuery.noConflict();
// DOM ready
jq2(function($) {

  // Define override new Plugin name
  $.fn.editedScrollSpy = $.fn.scrollspy;
  $.fn.editedAffix = $.fn.affix;

  // Override scrollspy
  $.fn.editedScrollSpy.Constructor.prototype.refresh = function () {
    var offsetMethod = 'offset'
    var offsetBase   = 0

    if (!$.isWindow(this.$scrollElement[0])) {
      offsetMethod = 'position'
      offsetBase   = this.$scrollElement.scrollTop()
    }

    this.offsets = []
    this.targets = []
    this.scrollHeight = this.getScrollHeight()

    var self = this

    this.$body
        .find(this.selector)
        .map(function () {
          var $el   = $(this)
          var href  = $el.data('target') || $el.attr('href')
          var $href = /^#./.test(href) && $(href)
          if (!$href) {
            $href = href.match(/#[\S]*/i);
            $href = $href ? $($href[0]) : $href;
          }

          return ($href
              && $href.length
              && $href.is(':visible')
              && [[$href[offsetMethod]().top + offsetBase, href]]) || null
        })
        .sort(function (a, b) { return a[0] - b[0] })
        .each(function () {
          self.offsets.push(this[0])
          self.targets.push(this[1])
        })
  }
  
  // Override affix
  $.fn.editedAffix.Constructor.prototype.checkPosition = function () {
    if (!this.$element.is(':visible')) return;

    var scrollHeight = $(document).height();
    var scrollTop    = this.$target.scrollTop();
    var position     = this.$element.offset();
    var offset       = this.options.offset;
    var offsetTop    = offset.top;
    var offsetBottom = offset.bottom;

    if (typeof offset != 'object')         offsetBottom = offsetTop = offset;
    if (typeof offsetTop == 'function')    offsetTop    = offset.top(this.$element);
    if (typeof offsetBottom == 'function') offsetBottom = offset.bottom(this.$element);

    var affix = this.unpin   != null && (scrollTop + this.unpin <= position.top) ? false :
          offsetBottom != null && (Math.floor(position.top + this.$element.height()) + 1 >= scrollHeight - offsetBottom) ? 'bottom' :
          offsetTop    != null && (scrollTop <= offsetTop) ? 'top' : false;

    // if (this.affixed !== affix && this.affixed === 'bottom') debugger;
    if (this.affixed === affix) return;
    if (this.unpin != null) this.$element.css('top', '');

    var affixType = 'affix' + (affix ? '-' + affix : '');
    var e         = $.Event(affixType + '.bs.affix');

    this.$element.trigger(e);

    if (e.isDefaultPrevented()) return;

    // if (affix == 'bottom') debugger;
    this.affixed = affix;
    this.unpin = affix == 'bottom' ? this.getPinnedOffset() : null;

    this.$element
      .removeClass($.fn.editedAffix.Constructor.RESET)
      .addClass(affixType)
      .trigger($.Event(affixType.replace('affix', 'affixed')));

    if (affix == 'bottom') {
      this.$element.offset({
        top: scrollHeight - this.$element.height() - offsetBottom
      });
    }
  }

  /**
   * Registering scroll spy and custom event handler
   */
    $('#sommaireAuto > nav ul li').on('activate.bs.scrollspy', function (e) {
    var $target = $(e.target);
    var $wrapper = $target.parents('#sommaireAuto');
    $target.prevUntil().addClass('active-up');
    $target.nextUntil().removeClass('active-up');

    if ($wrapper.length) {
      var $border = $wrapper.find('> .scrollSpy--border');
      var $nav = $wrapper.find('> nav');

      if ($nav.length) {
        if ($border.length) {
          $nav.append($border);
        } else {
          $border = $wrapper.find('> nav > .scrollSpy--border');
        }

        if ($border.length && $target.hasClass('active')) {
          var $link = $target.find('> a, .active > a').last();
          var newPosBotttom = ($nav.height() - ($link.position().top + $link.height()) - 8);
          newPosBotttom = newPosBotttom >= 10 ? newPosBotttom : 0;
          $border.css({'bottom': newPosBotttom + 'px'});
        }
      }
    }
  });
  // Registering
  var headerOffset = 120;
  $('body').editedScrollSpy({target: '#sommaireAuto', offset: headerOffset});
  $('#sommaireAuto').editedAffix({
    offset: { 
      top: function () {
        return Math.floor($('#articleScrollspy').offset().top - $(".header-site .header-main").outerHeight()) + 1;
      },
      bottom: function() {
        return Math.floor($('footer[role="contentinfo"]').outerHeight()) + 20;
      }
    }
  }).on('affix.bs.affix', function () {
      //console.log('affix.bs.affix');
      $(this).css({
        'top': Math.floor($(".header-site .header-main").outerHeight() + 20),
        'bottom': 'auto'
      });
    }
  ).on('affix-bottom.bs.affix', function () {
      //console.log('affix-bottom.bs.affix');
      $(this).css({
        'top': Math.floor($(".header-site .header-main").outerHeight() + 20),
        'bottom': 'auto'
      });
    }
  );
});