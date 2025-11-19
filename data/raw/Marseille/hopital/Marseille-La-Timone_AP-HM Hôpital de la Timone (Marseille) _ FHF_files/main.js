(function ($, Drupal, window, document) {
  /**
   * Sticky header
   */
  Drupal.behaviors.fhfStickyHeader = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      var body = $('body', context);

      $(window).on('scroll', function() {
        if ($(this).scrollTop() > 153) {
          body.addClass('has-sticky');
        } else {
          body.removeClass('has-sticky');
        }
      });
    }
  };

  /**
   * Search on header
   */
  Drupal.behaviors.fhfSearchHeader = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      // We may have multiple search forms in one page
      $('.form-autocomplete', context).each((index, input) => {
        let searchInput = $(input);
        let parent = searchInput.parent();
        if (searchInput.length) {
          searchInput.autocomplete({
            appendTo: parent,
            open: function () {
              searchInput.addClass('is-focused');
              searchInput.siblings('ul').wrap('<div class="ui-autocomplete--wrapper"></div>');
            },
            close: function () {
              searchInput.removeClass('is-focused');
              searchInput.siblings().find('ul').unwrap();
            }
          });
        }
      });
    }
  };

  /**
   * ScrollTop
   */
  Drupal.behaviors.fhfTarteaucitronPanel = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      $('.tarteaucitron-panel', context).click(function () {
        if (tarteaucitron) {
          tarteaucitron.userInterface.openPanel();
        }
      });
    }
  };

  /**
   * ScrollTop
   */
  Drupal.behaviors.fhfScrollTop = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      $('.js-scroll-top', context).each(function () {
        $(window).scroll(function(){
          var st = $(this).scrollTop();
          if (st > 50){
            $('.js-scroll-top').fadeIn(200);
          } else {
            $('.js-scroll-top').fadeOut(200);
          }
        });

        $(this).on('click', function () {
          $('html,body').animate({scrollTop: 0}, 'fast', 'linear');
        });
      });
    }
  };

  /**
   * Custom select
   */
  Drupal.behaviors.fhfCustomSelect = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      var select = $('select', context);
      var dataPlaceholder = select.attr('data-placeholder');
      var placeholder;

      if (dataPlaceholder) {
        placeholder = dataPlaceholder;
      } else {
        placeholder = 'Sélectionner';
      }

      select.SumoSelect({
        placeholder: placeholder,
        selectAll: true,
        forceCustomRendering: true,
        locale: ['OK', 'Annuler', 'Tout'],
        captionFormatAllSelected: 'Tous sélectionnés'
      });

      // Change "Select all" label for lists' date filter
      var filterDateSelect = $('.views-exposed-form .js-form-item-created-year select');

      if (filterDateSelect.length) {
        filterDateSelect[0].sumo.unload();

        filterDateSelect.SumoSelect({
          placeholder: placeholder,
          selectAll: true,
          locale: ['OK', 'Annuler', 'Toutes les dates'],
          captionFormatAllSelected: 'Tous sélectionnés'
        });
      }
    }
  };

  /**
   * Sticky nav with anchors - scrollspy
   */
  Drupal.behaviors.fhfScrollSpy = {
    attach: function (context) {
      if (context !== document) {
        return;
      }


      var body = $('body');
      var menuLi = $('.nav-anchors li', context);
      var menu = $('.nav-anchors', context);
      var menuNavRight = $('.nav-right.nav-bottom-list', context);
      var mainDiv = $('.region.region-content', context);
      mainDiv.before(menuNavRight);

      setTimeout(() => {
        var findHeader = true;
        if(!body.hasClass('page-node-type-storytelling')){
          var sectionParagraph = $('[data-nav]', context);
          if (menuLi.length) {
            body.attr('data-bs-spy', 'scroll');
            body.attr('data-bs-target', '#block-content-summary-nav');
            body.attr('data-bs-offset', 100);
            if (sectionParagraph.length) {
              sectionParagraph.each(function (index) {
                $(this).attr('id', `section-${index}`);
                menuLi.eq(index).find('a').attr('href', `#section-${index}`);
                findHeader = false;
                index++;
              });
            }
            menuNavRight.css("opacity", "1");
          }
        }

        if(findHeader) {
          var headerItems = $('article h2, .taxonomy-term > h2', context);
          $('.nav-anchors ul').remove();
          if (headerItems.length > 0) {
            if ($('.nav-anchors > div > ul.links').length === 0) {
              menu.prepend("<ul class='links'></ul>");
              var menuUl = $('.nav-anchors > ul.links');
              headerItems.each(function (index) {
                const id = $(this).attr('id');
                if (id === undefined) {
                  const text = headerItems[index].innerText.trim();
                  $(this).attr('id', `section-${index}`);
                  menuUl.append("<li><a class='nav-link' href=#section-" + index + ">" + text + "</a></li>");
                  index++;
                }
              });
              menuNavRight.css("opacity", "1");
            }
          }else{
            $('.nav-anchors').parent().remove();
          }
        }

      }, 2000);

    }
  };

  /**
   * Sticky nav with anchors - nav-link
   */
  Drupal.behaviors.fhfScrollNavLink = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      var navLink = $('.nav-anchors .nav-link', context);
      if (navLink.length) {
        navLink.click(function(e) {
          e.preventDefault();
          var href = $(this).attr('href');
          $('html, body').animate({
            scrollTop: $(`${href}`).offset().top - 150
          }, 300);
        });
      }
    }
  };

  /**
   * Tooltips
   */
  Drupal.behaviors.fhfTooltip = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      var tooltipTriggerList = [].slice.call(context.querySelectorAll('[data-bs-toggle="tooltip"]'));

      if (tooltipTriggerList) {
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
          return new bootstrap.Tooltip(tooltipTriggerEl);
        });
      }
    }
  };

  /**
   * Tooltips
   */
  Drupal.behaviors.fhfPopover = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      var popoverTriggerList = [].slice.call(context.querySelectorAll('[data-bs-toggle="popover"]'));

      if (popoverTriggerList) {
        var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
          return new bootstrap.Popover(popoverTriggerEl);
        });
      }
    }
  };

  /**
   * Table wrapper
   */
  Drupal.behaviors.fhfTableWrapper = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      var wrapper = '<div class="table-wrapper"></div>';
      $('.article__content table', context).each(function () {
        $(this).wrap(wrapper);
      });
    }
  };

  /**
   * Mobile slider
   */
  Drupal.behaviors.fhfMobileSlider = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      $('.paragraph--type--block-main-events .view-content', context).addClass('mobile-slider js-mobile-slider');
      $('.view-id-seach.view-display-id-block_similar_content .row', context).addClass('mobile-slider js-mobile-slider');
      var mobileSlider = $('.js-mobile-slider', context);
      var mobileSliderOptions = {
        autoWidth: true,
        margin: 20,
        dots: false,
        nav: true,
        navText : ["<span class='fhficon fhficon-angle-left'></span>","<span class='fhficon fhficon-angle-right'></span>"]
      };

      function initMobileSlider() {
        if ( $(window).width() < 768 ) {
          mobileSlider.addClass('owl-carousel').owlCarousel(mobileSliderOptions);
        } else {
          mobileSlider.removeClass('owl-carousel').trigger('destroy.owl.carousel');
        }
      }

      initMobileSlider();

      $(window).resize(function() {
        initMobileSlider();
      });
    }
  };

  /**
   * Paragraph carousel (HP top)
   */
  Drupal.behaviors.fhfParagraphCarousel = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      $('.paragraph--type--paragraph-carousel .field--type-entity-reference-revisions', context).addClass('owl-carousel').owlCarousel({
        items: 1,
        loop: true,
        autoplay: true,
        autoplayTimeout: 7000,
        autoplaySpeed: 1000,
        dots: true,
        dotsSpeed: 1000,
        nav: false,
        navSpeed: 1000,
        navText : ["<span class='fhficon fhficon-angle-left'></span>","<span class='fhficon fhficon-angle-right'></span>"],
        responsive : {
          768 : {
            nav: true
          }
        }
      });
    }
  };

  /**
   * Recent articles Slider (HP)
   */
  Drupal.behaviors.fhfRecentArticlesSlider = {
    attach: function (context) {
      if (context !== document) {
        //return;
      }
      $('.main-articles .view-content').addClass('owl-carousel mobile-slider').owlCarousel({
        loop: false,
        dots: false,
        nav: true,
        margin: 20,
        navText : ["<span class='fhficon fhficon-angle-left'></span>","<span class='fhficon fhficon-angle-right'></span>"],
        responsive : {
          0: {
            autoWidth: true
          },
          768: {
            autoWidth: false,
            items: 2
          },
          1100: {
            items: 3
          }
        }
      });
    }
  };

  /**
   * Expertises slider (HP)
   */
  Drupal.behaviors.fhfExpertiseSlider = {
    attach: function (context) {
      //if (context !== document) {
        //return;
      //}
      $('.main-expertises .view-content', context).addClass('owl-carousel');
      $('.main-expertises .view-content', context).owlCarousel({
        autoWidth: true,
        items: 3,
        stagePadding: 279,
        loop: false,
        dots: false,
        nav: true,
        margin: 30,
        navText : ["<span class='fhficon fhficon-angle-left'></span>","<span class='fhficon fhficon-angle-right'></span>"]
      });

      $('.js-main-expertise-slider', context).owlCarousel({
        autoWidth: true,
        items: 2,
        stagePadding: 279,
        loop: false,
        dots: false,
        nav: true,
        margin: 30,
        navText : ["<span class='fhficon fhficon-angle-left'></span>","<span class='fhficon fhficon-angle-right'></span>"]
      });

      // Mobile filter dropdown
      $('.js-main-expertises .option').each(function() {
        var radio = $(this).prev();
        var dropDownBtn = $('.js-expertise-active-filter');

        if (!$(this).find('span').length) {
          $(this).wrapInner('<span></span>');
        }

        if (radio.is(':checked')) {
          var label = $(this).html();
          var id = radio.attr('value');

          dropDownBtn.html(label);
          dropDownBtn.attr('data-id', id);
        }
      });
    }
  };

  /**
   * PublicationsSlider (annuaire)
   */
  Drupal.behaviors.fhfAnnuairePublicationsSlider = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      const numChildren = $('.view-id-catalog_item.view-display-id-another_news .view-content .views-row, ' +
        '.block-catalog__recent-members .content article, ' +
        '.block-catalog__latest-updated-structures .content article').length; // just an example
      const isTrueMob = numChildren > 1;
      const isTrueTab = numChildren > 2;
      const isTrueDes = numChildren > 3;
      $('.view-id-catalog_item.view-display-id-another_news .view-content, ' +
        '.block-catalog__recent-members .content, ' +
        '.block-catalog__latest-updated-structures .content', context).addClass('owl-carousel mobile-slider').owlCarousel({
        dots: false,
        nav: true,
        margin: 30,
        navText : ["<span class='fhficon fhficon-angle-left'></span>","<span class='fhficon fhficon-angle-right'></span>"],
        responsive : {
          0: {
            loop: isTrueMob,
            autoWidth: true
          },
          768: {
            loop: isTrueTab,
            autoWidth: false,
            items: 2
          },
          1100: {
            loop: isTrueDes,
            items: 3
          }
        }
      });
    }
  };

  /**
   * FHF-data Slider
   */
  Drupal.behaviors.fhfDataSlider = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      const numChildren = $('.view-display-id-fhf_data_news .view-content .views-row').length; // just an example
      const isTrueMob = numChildren > 1;
      const isTrueTab = numChildren > 2;
      const isTrueDes = numChildren > 3;
      $('.view-display-id-fhf_data_news .view-content', context).addClass('owl-carousel mobile-slider').owlCarousel({
        loop: true,
        dots: false,
        nav: true,
        margin: 30,
        navText : ["<span class='fhficon fhficon-angle-left'></span>","<span class='fhficon fhficon-angle-right'></span>"],
        responsive : {
          0: {
            loop: isTrueMob,
            autoWidth: true
          },
          768: {
            loop: isTrueTab,
            autoWidth: false,
            items: 2
          },
          1100: {
            loop: isTrueDes,
            items: 3
          }
        }
      });
    }
  };

  /**
   * offre-emploi candidatez slider
   */
  Drupal.behaviors.fhfoffresHomeSlider = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      $('.paragraph--type--offers__hot-job-offers .view-content').addClass('owl-carousel mobile-slider').owlCarousel({
        loop: false,
        dots: false,
        nav: true,
        margin: 20,
        navText : ["<span class='fhficon fhficon-angle-left'></span>","<span class='fhficon fhficon-angle-right'></span>"],
        responsive : {
          0: {
            autoWidth: true
          },
          768: {
            autoWidth: false,
            items: 2
          },
          1100: {
            items: 3
          }
        }
      });
    }
  };

  /**
   * offre-emploi branding sliders
   */
  Drupal.behaviors.fhfoffresBrandingSlider = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      $('.paragraph--type--branding .paragraph-content').each(function() {
        $(this).addClass('owl-carousel mobile-slider').owlCarousel({
          loop: false,
          dots: false,
          nav: true,
          margin: 20,
          navText : ["<span class='fhficon fhficon-angle-left'></span>","<span class='fhficon fhficon-angle-right'></span>"],
          responsive : {
            0: {
              autoWidth: true
            },
            768: {
              autoWidth: false,
              items: 2
            },
            1100: {
              items: 4
            }
          }
        });
      });

    }
  };

  /**
   * agenda carousel
   */
  Drupal.behaviors.fhfAgendaCarousel = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      $('.view-agenda-carrousel .view-content').addClass('owl-carousel mobile-slider').owlCarousel({
        loop: false,
        dots: false,
        nav: true,
        margin: 20,
        navText : ["<span class='fhficon fhficon-angle-left'></span>","<span class='fhficon fhficon-angle-right'></span>"],
        responsive : {
          0: {
            autoWidth: true
          },
          768: {
            autoWidth: false,
            items: 3
          },
          1200: {
            items: 5
          }
        }
      });
    }
  };

  /**
   * Filter-list buttons
   */
  Drupal.behaviors.fhfFilterListButton = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      // cherck if the url parameter 'display_style' is present. if it is, we apply the corresponding style
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      if(urlParams.has('display_style')) {
        let listButton = $('.list-filter--tools button.btn-filter-list');
        $(listButton).addClass('active')
          .siblings()
          .removeClass('active');
        $(listButton).parents().find('.views-row').css('display', 'block');
        $(listButton).parents('.view').attr('data-mode', 'list');
      }
      $('.view .list-filter--tools button', context).each(function () {
        $(this).click(function () {
          var target = $(this).parents().find('.views-row');
          var map = $(this).parents().find('.view-display-id-map');

          if (!$(this).hasClass('active')) {
            $(this).addClass('active')
              .siblings()
              .removeClass('active');

            if ($(this).hasClass('btn-filter-list')) {
              target.css('display', 'block');
              map.removeClass('show');
              $('.pager').show();
              $(this).parents('.view').attr('data-mode', 'list');
              // add a parameter in pager items url, to keep the dislay after clicking on the button.
              if(!urlParams.has('display_style')) {
                /*
                document.querySelectorAll('nav.pager .pager__item a').forEach(function (link) {
                  link.href = link.href + "&display_style=list";
                });

                 */
              }
            } else if ($(this).hasClass('btn-filter-map')) {
              target.hide();
              map.addClass('show');
              $('.pager').hide();
              $(this).parents('.view').attr('data-mode', 'map');
              // hotest fix
              drupalSettings.leaflet[Object.keys(drupalSettings.leaflet)[0]].lMap.invalidateSize(false);
              var bounds = drupalSettings.leaflet[Object.keys(drupalSettings.leaflet)[0]].features;
              drupalSettings.leaflet[Object.keys(drupalSettings.leaflet)[0]].lMap.fitBounds(bounds);
              window.dispatchEvent(new Event('resize'));
            } else {
              target.css('display', 'grid');
              map.removeClass('show');
              $('.pager').show();
              $(this).parents('.view').attr('data-mode', 'grid');
              // remove url parameter 'display_style' from pagination links
              if(urlParams.has('display_style')) {
                /*
                document.querySelectorAll('nav.pager .pager__item a').forEach(function(link){
                  let href = link.href;
                  if (href.indexOf('&display_style=list') !== -1) {
                    let replace = href.replace('&display_style=list');
                    link.href = replace;
                  }
                });
                */
              }
            }
          }
        });
      });


      $('.grid-container .list-filter--tools button', context).each(function () {
        $(this).click(function () {
          var target = $(this).parents().find('.views-row');

          if (!$(this).hasClass('active')) {
            $(this).addClass('active')
              .siblings()
              .removeClass('active');

            if ($(this).hasClass('btn-filter-list')) {
              target.css('display', 'block');
              $('[data-display="content"]').removeClass('visually-hidden');
              $('[data-display="map"]').addClass('visually-hidden');
            } else if ($(this).hasClass('btn-filter-map')) {
              $('[data-display="content"]').addClass('visually-hidden');
              $('[data-display="map"]').removeClass('visually-hidden');
              // hotest fix
              drupalSettings.leaflet[Object.keys(drupalSettings.leaflet)[0]].lMap.invalidateSize(false);
              var bounds = drupalSettings.leaflet[Object.keys(drupalSettings.leaflet)[0]].features;
              drupalSettings.leaflet[Object.keys(drupalSettings.leaflet)[0]].lMap.fitBounds(bounds);
              window.dispatchEvent(new Event('resize'));
            } else {
              target.css('display', 'grid');
              $('[data-display="content"]').removeClass('visually-hidden');
              $('[data-display="map"]').addClass('visually-hidden');
            }
          }
        });
      });

    }
  };

  /**
   * Account menu
   */
  Drupal.behaviors.fhfAccountMenu = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      // Adding gradient background under user menu
      var bannerBg = $('.js-top-bg', context);
      var userMenu = $('#block-account-menu', context);

      function setBg() {
        if (userMenu.length) {
          var height = userMenu.innerHeight();
          bannerBg.height(height);
        }
      }

      setBg();

      $(window).resize(function() {
        setBg();
      });
    }
  };

  /**
   * modal alert
   */
  Drupal.behaviors.fhfModalAlert = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      $('.alert.modal', context).each(function () {
        $(this).on('click', function(e) {
          if (e.target !== this)
            return;

          $(this).find('.btn-close').click();
        });
      });
    }
  };

  /**
   * Search page filters
   */
  Drupal.behaviors.fhfSearchFilters = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      var searchField = $('.path-recherche .form--inline .js-form-item-created-year', context);
      if (searchField.length) {
        searchField.each(function() {
          $(this).add($(this).next('.js-form-item-sort-bef-combine', context)).wrapAll('<div class="filter-group"></div>');
        });
      }
    }
  };

  //Behavior for modals
  Drupal.behaviors.ModalDialogClose = {
    attach: function (context) {
      if (context !== document) {
        return;
      }
      /*
      $(document, context).once('modalClose').on('click', '.ui-widget-overlay', function () {
        $('.ui-dialog-titlebar-close').trigger('click');
      });
       */
    }
  };

  Drupal.behaviors.fhfExternalLinkBlank = {
    attach: function (context) {

      document.addEventListener("DOMContentLoaded", function() {
        const allowedDomains = ['fhf.fr', 'pockost.dev', 'localhost'];
        const links = document.querySelectorAll('a[href]');

        links.forEach(link => {
          const linkHref = link.getAttribute('href');
          const linkDomain = new URL(linkHref, window.location.origin).hostname;

          // Vérifie si le domaine est autorisé ou si c’est un lien interne (commence par /)
          const isAllowed = allowedDomains.some(domain => linkDomain.endsWith(domain));

          if (!(isAllowed || linkHref.startsWith('/'))) {
            link.setAttribute('target', '_blank');
          }
        });
      });
    }
  };

})(jQuery, Drupal, window, window.document);
