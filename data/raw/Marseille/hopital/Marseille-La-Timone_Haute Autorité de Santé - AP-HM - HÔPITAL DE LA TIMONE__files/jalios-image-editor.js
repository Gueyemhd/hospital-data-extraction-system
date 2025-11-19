!(function ($) {
  const ACTION_URL = 'front/imageEditor/imageEditorActionHandler.jsp';
  const LIB_URL = 'frontlib/filerobot-image-editor/build/4.x/filerobot-image-editor.min.js';
  const LIB_TRANSLATIONS_URL = 'js/jalios/core/components/imageEditor/jalios-image-editor-translations.jsp';

  let imageEditorLoaded = false;
  let activeImageEditor;

  const DEFAULT_CONFIG = {
    language: document.documentElement.lang,
    annotationsCommon: {
      fill: '#ff0000'
    },
    savingPixelRatio: 2,
    useBackendTranslations: false
  };

  const triggerImageEditorEvent = function (eventType, data) {
    var event = $.Event('jalios:imageEditor');
    event.imageEditor = {};
    event.imageEditor.type = eventType;
    event.imageEditor.editor = activeImageEditor;
    event.imageEditor.data = data;
    $(document).trigger(event);
    return event;
  };


  const handleComplete = function (url, dataId) {
    let absoluteUrl = JcmsJsContext.getBaseUrl() + url;

    // Invalidate cache for original image
    $.ajax({
      url: absoluteUrl,
      type: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    }).done(function (infos) {
      $('img[data-jalios-data-id=' + activeImageEditor.editorContext.dataId + ']').each(function (idx, element) {
        // Replace image reference in the image element data to handle the case where image could be edited multiple times on same page
        let lightboxOptions = $(element).data("jalios-lightbox-options");
        if (lightboxOptions) {
          if (lightboxOptions.imageEditorOption) {
            lightboxOptions.imageEditorOption.filePath = url;
          }
        }

        //Replace image in DOM
        setTimeout(() => {
          element.src = url;
        }, 500);

        if (!$(element).closest('.wysiwyg').exists()) {
          $(element).css('max-height', $(element).outerHeight()).css('max-width', $(element).outerWidth());
        }

        $(element).css('height', 'initial').css('width', 'initial');
        $(element).removeClass('lightbox-initialized');

        // Reset lightbox
        if (lightboxOptions && lightboxOptions.thumb) {
          lightboxOptions.thumb = url;
          // Update element data for lightbox / image editor
          $(element).data('jalios-lightbox-options', lightboxOptions);

          let gallery = $.jalios.Lightbox.getGallery(element);

          if (gallery) {
            // Remove backdrop
            $(gallery.$backdrop.selector).closest(".lg-container.lg-show-in").removeClass("lg-show-in").removeClass("lg-show");
            // Destroy gallery
            gallery && gallery.destroy();
          }

          // Remove initialized lightGallery plugin
          $(element).removeData('lightGallery');
        }
      });

      // Also replace all elements that might target the old url (Usually, link or button that triggers the image editor)
      $("[data-jalios-image-editor-context]").each(function (idx, element) {
        let imageEditorContext = $(element).data("jalios-image-editor-context");
        if (imageEditorContext.dataId === dataId) {
          imageEditorContext.filePath = url;
          $(element).data("jalios-image-editor-context", imageEditorContext);
        }
      });

    });
  };

  const closeImageEditor = function () {
    showLightBox();
    $('#image-editor-wrapper').remove();
    activeImageEditor.terminate();
  };

  const getImageEditorWrapperDiv = function () {
    if ($('#image-editor-wrapper').exists()) {
      return $('#image-editor-wrapper');
    }

    let div = jQuery('<div>', {
      id: 'image-editor-wrapper',
      class: 'image-editor-wrapper'
    }).appendTo('body');

    return $(div);
  };

  const getImageEditorBackdrop = function () {
    if ($(".image-editor-inline").exists()) {
      return;
    }

    if (!$('#image-editor-backdrop').exists()) {
      jQuery('<div>', {
        id: 'image-editor-backdrop',
        class: 'image-editor-backdrop'
      }).appendTo('body');

      $('#image-editor-backdrop').on('click', function (_event) {
        closeImageEditor();
      });
    }

    return {
      show: function () {
        $('#image-editor-backdrop').show();
      },
      hide: function () {
        $('#image-editor-backdrop').hide();
      }
    };
  };

  const saveImage = function (imageData, imageDesignState, editorContext) {
    triggerImageEditorEvent($.jalios.ImageEditor.EditorEventType.BEFORE_COMPLETE);

    imageData.imageCanvas.toBlob((blob) => {
      const file = new File([blob], editorContext.filePath.split(/[\\\/]/).pop());
      var formData = new FormData();
      formData.append('filename', file);
      formData.append('id', activeImageEditor.editorContext.dataId);
      formData.append('opUpload', 'true');
      formData.append('removeFile', 'true');

      triggerImageEditorEvent($.jalios.ImageEditor.EditorEventType.SAVE, {
        file: file
      });

      $.ajax({
        type: 'POST',
        url: ACTION_URL,
        data: formData,
        processData: false,
        contentType: false
      })
        .done(function (infos) {
          handleComplete(infos.data.filename, infos.data.dataId);
          triggerImageEditorEvent($.jalios.ImageEditor.EditorEventType.AFTER_IMAGE_REFRESHED, {
            file: file
          });
          closeImageEditor();
        })
        .fail(function (_infos) {
          triggerImageEditorEvent($.jalios.ImageEditor.EditorEventType.ERROR);
        });
    });
    return false;
  };

  const hideLightBox = function () {
    if ($('.lg-container.lg-show-in').length > 0) {
      $('.lg-container.lg-show-in').removeClass("lg-show");
    }
    getImageEditorBackdrop().show();
  };
  const showLightBox = function () {
    if ($('.lg-container.lg-show-in').length > 0) {
      $('.lg-container.lg-show-in').addClass("lg-show");
    }
    getImageEditorBackdrop().hide();
  };

  const getImageType = function (filename) {
    let extension = filename.substring(filename.lastIndexOf('.') + 1, filename.length) || filename;

    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return "jpg";
      case 'webp':
        return 'webp';
      case 'png':
        return "png";
      default:
        return "jpg";
    };
  }

  $.jalios.ImageEditor = {
    EditorEventType: {
      OPEN: 'open',
      ERROR: 'error',
      BEFORE_COMPLETE: 'before',
      SAVE: 'save',
      AFTER_IMAGE_REFRESHED: 'after',
      CLOSE: 'closed'
    },

    launchImageEditor: function (editorContext, config) {
      try {
        let callback = function () {
          imageEditorLoaded = true;

          let extendedConfig = $.extend({}, DEFAULT_CONFIG, config);

          extendedConfig = $.extend({}, extendedConfig, {
            translations: Object.fromEntries(FILE_ROBOT_IMAGE_EDITOR_TRANSLATIONS),
            defaultSavedImageName: editorContext.filePath.split(/[\\\/]/).pop(),
            defaultSavedImageType: getImageType(editorContext.filePath)
          });

          extendedConfig = $.extend({}, extendedConfig, {
            tabsIds: [
              window.FilerobotImageEditor.TABS.ADJUST,
              window.FilerobotImageEditor.TABS.FINETUNE,
              window.FilerobotImageEditor.TABS.ANNOTATE,
              window.FilerobotImageEditor.TABS.RESIZE
            ], // or ['Adjust', 'Annotate', 'Watermark']
            defaultTabId: window.FilerobotImageEditor.TABS.RESIZE, // or 'Annotate'
            defaultToolId: window.FilerobotImageEditor.TOOLS.TEXT, // or 'Text'
            source: editorContext.filePath
          });

          if (editorContext.options) {
            extendedConfig = $.extend({}, extendedConfig, editorContext.options);
          }

          // Use timeout since in some cases, file editor js is not loaded yet through getScript
          setTimeout(() => {
            let editorContainer = editorContext.container
              ? jQuery(editorContext.container)[0]
              : getImageEditorWrapperDiv()[0];
            activeImageEditor = new window.FilerobotImageEditor(editorContainer, extendedConfig);

            activeImageEditor.editorContext = editorContext;
            activeImageEditor.render({
              onBeforeSave: function (_imageFileInfo) {
                if (_imageFileInfo) {
                  _imageFileInfo.quality = 0.80;
                }
                return false;
              },
              onSave: function (imageData, imageDesignState) {
                saveImage(imageData, imageDesignState, editorContext);
              },
              onClose: function (closingReason) {
                triggerImageEditorEvent($.jalios.ImageEditor.EditorEventType.CLOSE, {
                  closingReason: closingReason
                });
                closeImageEditor();
              }
            });
          }, 0);
        };
        if (imageEditorLoaded) {
          callback();
        } else {
          loadScripts([
            LIB_TRANSLATIONS_URL,
            LIB_URL
          ]).then(callback);
        }
        hideLightBox();

        triggerImageEditorEvent($.jalios.ImageEditor.EditorEventType.OPEN);
      } catch (err) {
        $.console.log(err);
        triggerImageEditorEvent($.jalios.ImageEditor.EditorEventType.ERROR);
      }
    }
  };

  function loadScripts(urls, path) {
    return new Promise(function (resolve) {
      urls.forEach(function (src, i) {

        let script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = (path || "") + src;
        script.async = false;

        // If last script, bind the callback event to resolve
        if (i == urls.length - 1) {
          // Multiple binding for browser compatibility
          script.onreadystatechange = resolve;
          script.onload = resolve;
        }

        // Fire the loading
        document.body.appendChild(script);
      });
    });
  }

  $(document).ready(function () {

    $(document).on('click', '.js-image-editor', function (event) {
      event.preventDefault();

      let editorContext = $(event.currentTarget).data('jalios-image-editor-context');
      $.jalios.ImageEditor.launchImageEditor(editorContext);
    });
  });
})(window.jQuery);
