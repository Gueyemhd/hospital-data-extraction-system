/*
 * jalios-lightbox initializes lightbox on images
 *
 * Uses the https://www.lightgalleryjs.com/ plugin
 * @since jcms-9.0.3
 *
 * @example
 *
 * Import :
 *   WebAssetsUtils.addWebAssets(jcmsContext, "jalios-lightbox");
 * Add on img tag : DataAttribute dataAttribute = LightboxUtils.getImageDataAttribute(fileDoc, userLang, userLocale, loggedMember);
 * Add the "lightbox-img" class on a link with an img tag in it :
 *
 * <a class="lightbox-img" <%= dataAttribute %> href="pathToFullImg.jpg"><img src="pathToThumb.jpg"/></a>
 *
 * Or for a complete gallery, add a wrapper div with the "lightbox-img-gallery" class :
 *
 * <div class="lightbox-img-gallery">
 *   <a class="lightbox-img" href="pathToFullImg.jpg"><img src="pathToThumb.jpg"/></a>
 *   <a class="lightbox-img" href="pathToFullImg2.jpg"><img src="pathToThumb2.jpg"/></a>
 * </div>
 */
!(function ($) {
  // Constants
  // ===============

  let DEFAULT_LG_OPTIONS = {
    licenseKey: JCMS_Properties['lightbox.light-gallery.licence-key'],
    dynamic: true,
    actualSize: false,
    showZoomInOutIcons: true
  };

  // Private methods
  // ===============

  /*
   * Relaunch setup after ajax refresh
   */
  var handleAjaxRefreshInit = function (event) {
    var refresh = $.jalios.Event.match(event, 'refresh', 'after');

    if (!refresh) {
      return;
    }

    initializeLightboxes();
  };

  const handleLightGalleryAfterOpen = function (e) {
    let gallery = $(e.currentTarget).data('lightGallery');

    if (gallery.galleryItems.length <= 1) {
      $(gallery.$container.firstElement).find('.lg-counter').addClass('hide');
    }
  };

  const initializeSingleImageLightbox = function () {
    $('.lightbox-img:not(.lightbox-initialized)').each(function (idx, link) {
      let $link = $(link);

      if ($link.closest('.lightbox-img-gallery').exists()) {
        return;
      }

      let $image = $link.find('img');
      $image.addClass('lightbox-initialized');

      $link.on('click', function (event) {
        initGalleryOnImage($image);
        event.preventDefault();
        let gallery = $(event.currentTarget).find('img').data('lightGallery');
        gallery.openGallery();
      });
    });
  };

  /*
   * Common actions performed on lightbox and bind of event when a lightbox is opened
   */
  const handleLightboxOpening = function ($container) {
    let container = $($container)[0];
    addButtonTitles(container);
    container.addEventListener('lgAfterOpen', handleLightGalleryAfterOpen, false);
  };

  const addButtonTitles = function (container) {
    container.addEventListener('lgInit', (event) => {
      const pluginInstance = event.detail.instance;

      // Note attr and find are not jQuery methods
      // These are utility methods provided by lightGallery
      const $toolbar = pluginInstance.$toolbar;

      //TODO : remove if pr is accepted : https://github.com/sachinchoolur/lightGallery/issues/1246
      $toolbar.find('.lg-close').attr('title', $.jalios.I18N.glp('lightbox.close'));
      $toolbar.find('.lg-download').attr('title', $.jalios.I18N.glp('lightbox.download'));
      $toolbar.find('.lg-zoom-in').attr('title', $.jalios.I18N.glp('lightbox.zoom-in'));
      $toolbar.find('.lg-zoom-out').attr('title', $.jalios.I18N.glp('lightbox.zoom-out'));
      $toolbar.find('.lg-fullscreen').attr('title', $.jalios.I18N.glp('lightbox.fullscreen'));
    });
  };

  const getSubHtml = function (lightboxOptions) {
    if (!lightboxOptions) {
      return '';
    }

    let html = '';
    if (lightboxOptions.title) {
      html += '<h4>' + lightboxOptions.title + '</h4>';
    }
    if (lightboxOptions.abstract) {
      let text =
        lightboxOptions.abstract.length < 50
          ? lightboxOptions.abstract
          : lightboxOptions.abstract.substring(0, 100) + '...';
      html += '<p>' + text + '</p>';
    }
    return html;
  };

  /**
   * Load additionals plugins that might be added to the element which will launch lightbox
   * @function
   */
  const loadAdditionalPluginsFromDataAttributes = function ($element) {
    $element = $($element);
    if ($element.data('jaliosLightboxPlugins')) {
      let extendedPluginNamesArray = $element.data('jaliosLightboxPlugins').split(' ');

      if (extendedPluginNamesArray) {
        let extendedPlugins = [];
        for (const pluginName of extendedPluginNamesArray) {
          extendedPlugins.push(globalThis[pluginName]);
        }

        extendedConfig.plugins = [...extendedConfig.plugins, ...extendedPlugins];
      }
    }
  };

  // Initialization methods (Gallery / Wysiwyg / Unique image)
  // ===============

  const pushImage = function (lightboxOptions, $image, $link) {
    return {
      src: lightboxOptions && lightboxOptions.thumb ? lightboxOptions.thumb : $link ? $link.attr('href') : $image.attr("src"),
      thumb: $image.attr('src'),
      subHtml: getSubHtml(lightboxOptions),
      downloadUrl: lightboxOptions ? lightboxOptions.downloadUrl : null,
      lightboxOptions: lightboxOptions
    };
  };

  const initializeLightbox = function ($element, config, lightboxOptions) {
    $element = $($element);
    handleLightboxOpening($element);
    loadAdditionalPluginsFromDataAttributes($element);
    let gallery = lightGallery($element[0], config);
    if (lightboxOptions) {
      gallery.lightboxOptions = lightboxOptions;
    }
    $element.addClass('lightbox-initialized');
    $element.data('lightGallery', gallery);
    return gallery;
  };

  const initializeWysiwygLightbox = function () {
    $('.wysiwyg:not(.lightbox-initialized), .wiki:not(.lightbox-initialized)').each(async (_idx, wysiwygWrapper) => {
      let filteredImages = [];
      let $images = $(wysiwygWrapper).find('img');
      if ($images.length === 0) {
        return false;
      }
      let $filteredImages = $images
        .filter(function (idxImage, image) {
          return !$(image).hasClass('wysiwyg-lightbox') && !$(image).closest('A').exists() && !$(image).closest('.mejs-responsive-wrapper').exists();
        })
        .each(function (idx, element) {
          let $img = $(element);
          $img.addClass('wysiwyg-lightbox');
          $img.wrap("<picture class='wysiwyg-lightbox-wrapper'></picture>");
          let picture = $img.closest('picture');
          //picture.css("width", element.width).css("height", element.height);

          $img.attr('data-lg-size', $img[0].width + '-' + $img[0].height);

          $img.on('click', function (event) {
            event.preventDefault();
            $(event.currentTarget)
              .closest('.wysiwyg, .wiki')
              .data('lightGallery')
              .openGallery(idx, $img.closest('picture')[0]);
          });

          let lightboxOptions = $img.data('jalios-lightbox-options');
          filteredImages.push(pushImage(lightboxOptions, $img));
        });

      if ($filteredImages.length <= 0) {
        return false;
      }

      let extendedConfig = $.extend({}, DEFAULT_LG_OPTIONS, {
        dynamicEl: filteredImages,
        enableDrag: false,
        dynamic: true,
        addClass: 'wysiwyg-container',
        showCloseIcon: true,
        controls: false,
        download: false,
        enableSwipe: false
      });

      let gallery = initializeLightbox(wysiwygWrapper, extendedConfig);

      // On scroll on window, hide the light gallery (Since we do not remove the scroll on light
      // galleries opened from a wysiwyg to apply the same style as medium)
      wysiwygWrapper.addEventListener(
        'lgBeforeOpen',
        function (event) {
          $('html').addClass('lg-on-wysiwyg');
          document.addEventListener(
            'scroll',
            function (event) {
              gallery.closeGallery();
            },
            {
              once: true
            }
          );
        },
        false
      );
      wysiwygWrapper.addEventListener(
        'lgAfterClose',
        function (event) {
          $('html').removeClass('lg-on-wysiwyg');
        },
        false
      );
    });
  };

  const initializeGalleryLightbox = function () {
    $('.lightbox-img-gallery:not(.lightbox-initialized)').each(function (idx, galleryWrapper) {
      let $galleryWrapper = $(galleryWrapper);
      let dynamicElements = [];

      $galleryWrapper.find('.lightbox-img').each(function (idx, link) {
        let $link = $(link);
        let $image = $link.find('img');

        let lightboxOptions = $image.data('jalios-lightbox-options');
        dynamicElements.push(pushImage(lightboxOptions, $image, $link));
        $link.on('click', function (event) {
          event.preventDefault();
          gallery.openGallery(idx);
        });
      });

      let extendedConfig = $.extend({}, DEFAULT_LG_OPTIONS, {
        dynamicEl: dynamicElements
      });

      let gallery = initializeLightbox($galleryWrapper, extendedConfig);
      return gallery;
    });
  };

  const initGalleryOnImage = function (image) {
    let $image = $(image);

    if ($image.data('lightGallery')) {
      return $image.data('lightGallery');
    }

    let lightboxOptions = $image.data('jalios-lightbox-options');

    let extendedConfig = $.extend({}, DEFAULT_LG_OPTIONS, {
      dynamicEl: [pushImage(lightboxOptions, $image)],
      enableDrag: false
    });

    let gallery = initializeLightbox($image, extendedConfig, lightboxOptions);
    return gallery;
  };

  // Public API
  // ===============

  $.jalios.Lightbox = {
    launchLightbox: function (image, thumb) {
      let $image = $(image);
      let gallery = initGalleryOnImage($image);
      gallery.openGallery();
    }
  };

  $.jalios.Lightbox.getGallery = function (element) {
    if (!element) {
      return undefined;
    }
    return $(element).data('lightGallery');
  };

  // Initialization
  // ===============

  /*
   * Initializes all lightbox images and galleries
   */
  var initializeLightboxes = function () {
    if (typeof lightGallery == 'function') {
      initializeSingleImageLightbox();
      initializeGalleryLightbox();
      initializeWysiwygLightbox();
    }
  };

  var register = function () {
    $(document).on('jalios:refresh', handleAjaxRefreshInit);
    $(document).on('jalios:imageEditor', function (event) {
      initializeLightboxes();
    });
    initializeLightboxes();
  };

  // Plugin initialization on DOM ready
  $(document).ready(function ($) {
    if (lightGallery == null || typeof lightGallery != 'function') {
      return;
    }

    // If lib is available, load plugins (This need to be performed on dom ready since libraries might not be available when declaring the global DEFAULT_LG_OPTIONS)
    DEFAULT_LG_OPTIONS = $.extend({}, DEFAULT_LG_OPTIONS, {
      plugins: [lgJPlatformZoom, lgFullscreen, lgJPlatformAccessPub, lgJPlatformImageEditor]
    });

    register();
  });
})(window.jQuery);
