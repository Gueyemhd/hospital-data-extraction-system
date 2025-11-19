/**
 * Gloassaire
 */

const sgpAbecedaire = window.sgpAbecedaire || {};

(function ($) {
    'use strict';

    sgpAbecedaire.bodyClass = 'sgpAbecedaire-behaviorOn';
    sgpAbecedaire.alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    Drupal.behaviors.sgpAbecedaire = {
        attach: function (context, settings) {
            sgpAbecedaire.launch(context);
        }
    };

    /**
     * Attach default handler.
     */
    sgpAbecedaire.launch = function (context) {

            const $this = $('.sgpAbecedaire-toggle');
            sgpAbecedaire.api.init($this);

            new ResizeSensor(this, function (e) {
                sgpAbecedaire.api.onResize('init');
            })
    };

    sgpAbecedaire.api = {
        isOverflowing: false,
        el: {
            container : $(),
            wrapper : $(),
            list: {}
        },
        /**
         * List generator
         *
         * @returns {{
         * template: (*|jQuery|void),
         * el: {
         *   scrollDown: (*|jQuery),
         *   listHolder: (*|jQuery),
         *   list: (*|jQuery|void),
         *   scrollUp: (*|jQuery)}}}
         */
        generateListAlphabet: function () {
            const template = $('<div />').addClass('abecedaire-list-wrapper');
            const scrollUp = $('<div class="scroll-controller scroll-up" />')
                .append($('<button class="btn btn-icon"><i class="asip-icon icon-right" aria-hidden="true"></i><span class="sr-only">Précédent</span></button>'));
            const scrollDown = $('<div class="scroll-controller scroll-down" />')
                .append($('<button class="btn btn-icon"><i class="asip-icon icon-right" aria-hidden="true"></i><span class="sr-only">Suivant</span></button>'));

            const list = $('<ul />').addClass('abecedaire-list-alphabet');
            for (let i = 0; i < sgpAbecedaire.alphabet.length; i++) {
                list.append($('<li aria-hidden="true"><a ' +
                  'href="#" ' +
                  'disabled ' +
                  'tabindex="-1" ' +
                  'data-toggle="abecedaireCtrl" ' +
                  'data-charAt="' + i + '">' + sgpAbecedaire.alphabet.charAt(i).toUpperCase() + '</a></li>'));
            }
            const listHolder = $('<div />').addClass('abecedaire-list-alphabet-wrapper').append(list);

            template
                .append(scrollUp)
                .append(listHolder)
                .append(scrollDown);

            return {
                template: template,
                el: {
                    scrollUp: scrollUp,
                    scrollDown: scrollDown,
                    listHolder: listHolder,
                    list: list
                }
            };
        },
        isElementInView: function (element, container, fullyInView) {
            const pageTop = container.scrollTop();
            const pageBottom = pageTop + container.height();
            const elementTop = $(element).offset().top - container.offset().top + container[0].scrollTop;
            const elementBottom = elementTop + $(element).height();

            if (fullyInView === true) {
                return ((pageTop < elementTop) && (pageBottom > elementBottom));
            } else {
                return ((elementTop <= pageBottom) && (elementBottom >= pageTop));
            }
        },
        onResizeLock: null,
        onResize: function (command) {
            const _ = this;
            if (_.el.wrapper.length && _.el.container.length) {
                // Limit number of function call to prevent over usage of CPU and JS heap
                if (_.onResizeLock !== null) {
                    clearTimeout(_.onResizeLock);
                    _.onResizeLock = null;
                }

                _.onResizeLock = setTimeout(function () {
                    const containerH = _.el.container.height();
                    _.el.wrapper.css({'height': containerH});

                    _.onResizeLock = setTimeout(function () {
                        const scrollH = _.el.list.el.list.prop('scrollHeight');
                        const scTop = _.el.list.el.list.scrollTop();
                        const maxScTop = _.el.list.el.list.prop('scrollHeight') - _.el.list.el.listHolder.outerHeight();

                        _.isOverflowing = scrollH > _.el.list.el.list[0].clientHeight;
                        _.el.wrapper.toggleClass('isOverflowing', _.isOverflowing);

                        // Scroll Controller handler
                        _.el.wrapper.toggleClass('topped', scTop === 0);
                        _.el.wrapper.toggleClass('bottomed', scTop >= maxScTop);

                        if (_.el.wrapper.hasClass('bottomed')) {
                          _.el.wrapper.find('.scroll-down button').attr('disabled',true);
                        } else if (_.el.wrapper.hasClass('topped')) {
                          _.el.wrapper.find('.scroll-up button').attr('disabled',true);
                        } else {
                          _.el.wrapper.find('.scroll-up button').removeAttr('disabled');
                          _.el.wrapper.find('.scroll-down button').removeAttr('disabled');
                        }

                        // DOM Modification function
                        if (command === 'focusOnActiveLetter' || command === 'init') {
                            _.onResizeLock = setTimeout(function () {
                                _.focusOnActiveLetter();
                            }, 50);
                        }
                    }, 50);
                }, 50);
            }
        },
        focusOnActiveLetter: function () {
            const
              _ = this,
              list = _.el.container.find('> .resultList-container > .resultList-list'),
              listEl = list.find('*[data-alphabetIndex]'),
              prepareForRedraw = [];

            listEl.each(function (i, el) {
                const $el = $(el);
                if (prepareForRedraw[$el.attr('data-alphabetIndex')] === true) {
                  return;
                }
                prepareForRedraw[$el.attr('data-alphabetIndex')] = _.isElementInView($el, list, false);
            });

            for (const charIndex in prepareForRedraw) {
                _.el.list.el.list.find('*[data-charat="' + charIndex + '"]:not([disabled])')
                  .toggleClass('presentInList', prepareForRedraw[charIndex]);
            }
        },
        eventRegister: function () {
            const _ = this;

            _.el.list.el.scrollDown.on('click', 'button', function () {
                $(document).triggerHandler('sgpAbecedaire::clickScrollDown');
                _.el.list.el.list.animate({
                    scrollTop: _.el.list.el.list.scrollTop() + _.el.list.el.listHolder.outerHeight() - (_.el.list.el.listHolder.outerHeight() % 21)
                }, 250);
            });
            _.el.list.el.scrollUp.on('click', 'button', function () {
                $(document).triggerHandler('sgpAbecedaire::clickScrollUp');
                _.el.list.el.list.animate({
                    scrollTop: _.el.list.el.list.scrollTop() - _.el.list.el.listHolder.outerHeight() + (_.el.list.el.listHolder.outerHeight() % 21)
                }, 250);
            });
            _.el.list.el.list.on('scroll', function () {
                _.onResize();
            });
            _.el.container.find('> .resultList-container > .resultList-list').on('scroll', function () {
                _.onResize('focusOnActiveLetter');
            });
            _.el.list.el.list.on('click', '*[data-toggle="abecedaireCtrl"]:not([disabled])', function (e) {
                e.preventDefault();
                const $this = $(this);

                const charAt = $this.attr('data-charAt');
                $(document).triggerHandler('sgpAbecedaire::clickLetter', [sgpAbecedaire.alphabet[charAt]]);
                const list = _.el.container.find('> .resultList-container > .resultList-list');
                const targets = _.el.container.find('*[data-alphabetIndex="' + charAt + '"]');
                const target = targets.first();

                _.el.container.find('.pulse').removeClass('pulse');
                targets.addClass('pulse');
                setTimeout(function () {
                    _.el.container.find('> .resultList-container > .resultList-list').animate({
                        scrollTop: target.offset().top - list.offset().top + list[0].scrollTop
                    }, 200);

                    setTimeout(function () {
                        targets.removeClass('pulse');
                    }, 3000);
                }, 0);
            });

            const items = _.el.container.find('> .resultList-container > .resultList-list > li');
            items.each(function (i, item) {
                const $item = $(item);

                const text = $item.text().trim().toUpperCase();

                if (text.length !== 0) {
                    const indexAlphabet = sgpAbecedaire.alphabet.indexOf(text.charAt(0));

                    if (indexAlphabet !== -1) {
                        $item.attr({
                            'data-toggle': 'abecedaireItem',
                            'data-alphabetIndex': indexAlphabet
                        });

                        // active abecedaire item
                        $('*[data-charAt="' + indexAlphabet +'"]', _.el.list.el.list)
                        .removeAttr('tabindex')
                        .removeAttr('disabled')
                        .parent('li').removeAttr('aria-hidden');
                    }
                }
            });
        },
        init: function (container) {
            const _ = this;

            // Fix bad config
            sgpAbecedaire.alphabet = sgpAbecedaire.alphabet.toUpperCase();

            if (container.length) {
                _.el.container = container;
                let abecedaireWrapperHeight = "109";
                const resultsBlock = document.querySelector('.resultList-container');
                if(resultsBlock) abecedaireWrapperHeight = resultsBlock.style.height;
                _.el.wrapper = $(`<div class="abecedaire-wrapper" style="height: ${abecedaireWrapperHeight}px;"/>)`);
                _.el.list = _.generateListAlphabet();
                _.eventRegister();

                _.el.container.find('.abecedaire-wrapper').remove();
                _.el.container.append(_.el.wrapper);

                _.el.wrapper.append(_.el.list.template);
                _.onResize();
            }
        }
    };
})(jQuery);
