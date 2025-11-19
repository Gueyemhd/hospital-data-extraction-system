/*!
 * lightgallery | 2.4.0 | January 29th 2022
 * http://www.lightgalleryjs.com/
 * Copyright (c) 2020 Sachin Neravath;
 * @license GPLv3
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.lgJPlatformAccessPub = factory());
}(this, (function () {
    'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /**
     * List of lightGallery events
     * All events should be documented here
     * Below interfaces are used to build the website documentations
     * */
    var lGEvents = {
        afterAppendSlide: 'lgAfterAppendSlide',
        init: 'lgInit',
        hasVideo: 'lgHasVideo',
        containerResize: 'lgContainerResize',
        updateSlides: 'lgUpdateSlides',
        afterAppendSubHtml: 'lgAfterAppendSubHtml',
        beforeOpen: 'lgBeforeOpen',
        afterOpen: 'lgAfterOpen',
        slideItemLoad: 'lgSlideItemLoad',
        beforeSlide: 'lgBeforeSlide',
        afterSlide: 'lgAfterSlide',
        posterClick: 'lgPosterClick',
        dragStart: 'lgDragStart',
        dragMove: 'lgDragMove',
        dragEnd: 'lgDragEnd',
        beforeNextSlide: 'lgBeforeNextSlide',
        beforePrevSlide: 'lgBeforePrevSlide',
        beforeClose: 'lgBeforeClose',
        afterClose: 'lgAfterClose',
        rotateLeft: 'lgRotateLeft',
        rotateRight: 'lgRotateRight',
        flipHorizontal: 'lgFlipHorizontal',
        flipVertical: 'lgFlipVertical',
        autoplay: 'lgAutoplay',
        autoplayStart: 'lgAutoplayStart',
        autoplayStop: 'lgAutoplayStop'
    };


    var __assign = function () {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    var accessPubSettings = {
        fullScreen: true,
        fullscreenPluginStrings: {
            toggleFullscreen: 'Toggle Fullscreen'
        }
    };

    var JPlatformAccessPub = /** @class */ (function () {
        function JPlatformAccessPub(instance, $LG) {
            // get lightGallery core plugin instance
            this.core = instance;
            this.$LG = $LG;
            // extend module default settings with lightGallery core settings
            this.settings = __assign(__assign({}, accessPubSettings), this.core.settings);
            return this;
        }
        JPlatformAccessPub.prototype.init = function () {
            var _this_ = this;

            this.core.LGel.on(lGEvents.beforeSlide, function (event) {
                jQuery(_this_.core.$toolbar.firstElement).find(".lg-access-pub").remove()
                var options = _this_.core.galleryItems[event.detail.index];
                if (options.lightboxOptions.url) {
                    let $accessPubElement = jQuery("<a>", {
                      title: jQuery.jalios.I18N.glp("lightbox.accessPub"),
                      href: options.lightboxOptions.url,
                      "aria-label":  jQuery.jalios.I18N.glp("lightbox.accessPub"),
                      role: "button",
                      "class": "lg-access-pub lg-icon lg-jplatform-action"
                    });
                    
                    let $accessPubElementIcon = jQuery("<span>", {
                      "class": "icomoon icomoon-image2"
                    });
                    
                    $accessPubElement.append($accessPubElementIcon);
                    _this_.core.$toolbar.append($accessPubElement[0]);
                }
            });
        };
        return JPlatformAccessPub;
    }());

    return JPlatformAccessPub;

})));