!function ($) {

    function initAllPub() {
        // recherche par theme
        $('#pub-multi a.pub-level1').on('click', function (e) {
            e.preventDefault();
            jQuery.get("plugins/ModuleHAS2019/jsp/ajax/load-cat.jsp?level=2&id=" + $(this).data('cat'), function (data) {
                $('#pub-niv2').html(data);
                initAllPub();
                $('html, body').scrollTop(0);
                $('#pub-wrapper').scrollTop(0).scrollTo($('#pub-niv2'), 'fast');
            });
        });
        $('#pub-multi a.pub-level2').on('click', function (e) {
            e.preventDefault();
            jQuery.get("plugins/ModuleHAS2019/jsp/ajax/load-cat.jsp?level=3&id=" + $(this).data('cat'), function (data) {
                $('#pub-niv3').html(data);
                initAllPub();
                $('html, body').scrollTop(0);
                $('#pub-wrapper').scrollTop(0).scrollTo($('#pub-niv3'), 'fast');
            });
        });
        $('#pub-multi a.back-level1').on('click', function (e) {
            e.preventDefault();
            $('#pub-wrapper').scrollTo($('#pub-niv1'), 'fast');
        });
        $('#pub-multi a.back-level2').on('click', function (e) {
            e.preventDefault();
            $('#pub-wrapper').scrollTo($('#pub-niv2'), 'fast');
        });
    }

    /**
     * Controleur de la telecommande
     * @type {{init: init, obj: {}, start: start, config: {classes: {container: string, itemOpen: string, containerOpen: string, item: string, toggler: string}}}}
     */
    var remoteHandler = {
        config: {
            classes: {
                container: 'quick-access-links-site',
                containerOpen: 'item-menu--open open-full',
                containerOpenInminimalMode: 'open-minimal-ui',
                item: 'remote-tools',
                itemForceInminimalMode: 'minimal-ui',
                itemOpen: 'open',
                toggler: 'remote-tools--toggle'
            },
            events: {
                open: 'remote-tools.open',
                close: 'remote-tools.close',
                update: 'remote-tools.update'
            }
        },
        obj: {},
        init: function () {
            this.obj.container = $('.' + this.config.classes.container);

            if (this.obj.container.length) {
                this.obj.items = this.obj.container.find('.' + this.config.classes.item);
                this.start();
            }
        },
        start: function () {
            var _this = this;

            var delegateStr = '.' + this.config.classes.item + ' .' + this.config.classes.toggler + ', .close-icone';

            this.obj.container.on('click', delegateStr, function (e) {
                var $toggleItem = $(e.target).closest('.' + _this.config.classes.item),
                    $parent = $(e.delegateTarget),
                    $items;
                if ($parent.length) {
                    // Si la telecommande est deja ouverte
                    if ($(e.target).hasClass('icon-has-plus')){
                        $items = $parent.find('.' + _this.config.classes.item);
                        $items.removeClass(_this.config.classes.itemOpen);
                        $parent.removeClass(_this.config.classes.containerOpen);
                        $parent.removeClass(_this.config.classes.containerOpenInminimalMode);
                        $toggleItem.removeClass(_this.config.classes.itemOpen);
                        $('body').removeClass('remote-isOpen');
                        $(document).trigger(_this.config.events.close, $toggleItem);
                        return;
                    }

                    // At this point the remote we can assume that the menu is open
                    $('body').addClass('remote-isOpen');

                    if ($parent.hasClass(_this.config.classes.containerOpen)) {
                        // Si le menu choisi est deja ouvert
                        if ($toggleItem.hasClass(_this.config.classes.itemOpen)) {
                            $parent.removeClass(_this.config.classes.containerOpen);
                            $parent.removeClass(_this.config.classes.containerOpenInminimalMode);
                            $toggleItem.removeClass(_this.config.classes.itemOpen);
                            $('body').removeClass('remote-isOpen');
                            $(document).trigger(_this.config.events.close, $toggleItem);
                        } else {
                            $items = $parent.find('.' + _this.config.classes.item);
                            $items.removeClass(_this.config.classes.itemOpen);
                            $toggleItem.addClass(_this.config.classes.itemOpen);
                            $parent.toggleClass(_this.config.classes.containerOpenInminimalMode, $toggleItem.hasClass(_this.config.classes.itemForceInminimalMode));
                            $(document).trigger(_this.config.events.update, $toggleItem);
                        }
                    } else {
                        $items = $parent.find('.' + _this.config.classes.item);
                        $items.removeClass(_this.config.classes.itemOpen);
                        $toggleItem.addClass(_this.config.classes.itemOpen);
                        $parent.addClass(_this.config.classes.containerOpen);
                        $parent.toggleClass(_this.config.classes.containerOpenInminimalMode, $toggleItem.hasClass(_this.config.classes.itemForceInminimalMode));
                        $(document).trigger(_this.config.events.open, $toggleItem);
                    }
                }
            });
        }
    };

    /**
     * Facette controller
     * @type {{init: init, obj: {}, start: start, config: {classes: {container: string, dropdownWrapper: string, item: string}}}}
     */
    var resFacetteHandler = {
        config: {
            classes: {
                container: 'facette-container',
                dropdownWrapper: 'facette--item-wrapper',
                item: 'facette--item'
            }
        },
        obj: {},
        init: function () {
            this.obj.container = $('.' + this.config.classes.container);

            if (this.obj.container.length) {
                this.obj.items = this.obj.container.find('.' + this.config.classes.item);
                this.start();
            }
            $('#linkToPlusFilter').on('click', function (e) {
	            e.preventDefault();
	           	$('#facettePlus').fadeIn();
	           	$('#linkToPlusFilter').hide();
	           	
	        });
        },
        start: function () {
            var _ = this;
            _.obj.items.on('show.bs.dropdown hide.bs.dropdown', function (e) {
                var $RTarget = $(e.relatedTarget);

                if (e.type === 'show') $RTarget.addClass('active');
                else $RTarget.parent('.' + _.config.classes.item).find('.active').removeClass('active');
            });
        }
    };

    /**
     * Gestion du bouton pour ajouter un mot clé de recherche
     * @type {{init: init, obj: {}, start: start, config: {classes: {container: string, form: string, buttonsContainer: string, inputContainer: string}}, toggleFormState: toggleFormState}}
     */
    var resAddFilterHandler = {
        config: {
            classes: {
                container: 'filter-action-add',
                form: 'filter-action-add--form',
                inputContainer: 'add-search-input',
                buttonsContainer: 'add-search-actions'
            }
        },
        obj: {},
        init: function () {
            this.obj.container = $('.' + this.config.classes.container);
            this.obj.form = this.obj.container.find('.' + this.config.classes.form);
            this.obj.inputContainer = this.obj.container.find('.' + this.config.classes.inputContainer);
            this.obj.buttonsContainer = this.obj.container.find('.' + this.config.classes.buttonsContainer);

            // Check les pre-requis pour continuer
            if (this.obj.form.length && this.obj.inputContainer.length && this.obj.buttonsContainer.length) {
                this.start();
            }
        },
        start: function () {
            var _ = this;

            // Toggle formulaire
            _.obj.buttonsContainer.on('click', '.toggle', function (e) {
                _.toggleFormState();
            });

            // intercept form submit
            _.obj.form.submit(function (e) {
                // Si le champ est vide alors refermer le champ
                if (_.obj.inputContainer.find('.form-control').val() === "") {
                    e.preventDefault();
                    // Arret des event jQuery liee au submit
                    e.stopPropagation();
                    _.toggleFormState();
                }
            })
        },
        toggleFormState: function () {
            this.obj.buttonsContainer.find('.search, .toggle').toggleClass('hide');
            this.obj.inputContainer.toggleClass('custom-hide');
            this.obj.container.toggleClass('open');

            // Focus après ouverture
            if (!this.obj.inputContainer.hasClass('custom-hide')) {
                this.obj.inputContainer.find('input').first().focus();
            }
        }
    };

    /**
     * Custom form confirm Handler
     */
    var formToggleComfirm = {
        config: {
            classes: {
                form: 'form-js--toggle-confirm',
                toggle: 'form-confirm',
                toToggle: 'form-to-show',
                activeJS: 'formToggleComfirm-registered'
            }
        },
        obj: {},
        init: function () {
            this.obj.form = $('.' + this.config.classes.form).filter(':not(.' + this.config.classes.activeJS + ')');

            // console.log('1', this.obj.form );
            if (this.obj.form.length) {
                this.obj.form.addClass(this.config.classes.activeJS);
                this.start();
            }
        },
        start: function () {
            var _this = this;

            this.obj.toggle = this.obj.form.find('.' + this.config.classes.toggle);
            this.obj.toToggle = this.obj.form.find('.' + this.config.classes.toToggle);

            console.log('2', this.obj.toggle, this.obj.toToggle);
            if (this.obj.toggle.length && this.obj.toToggle.length) {
                this.obj.toToggle.slideUp(400, function() {
                    // Fin de l'animation
                    $(this).addClass("form-closed");
                });

                _this.obj.toToggle.find('input').on('keyup', function(e) {
                    if(e.keyCode == 13) {
                        _this.obj.form.find('[type="submit"]').click();
                    }
                });
                _this.obj.toToggle.find('button').on('click', function (e) {
                    _this.obj.form.find('[type="submit"]').click();
                })

                this.obj.toggle.on('click', 'button', function (e) {
                    var $this = $(this);

                    if (!$this.hasClass('toConfirm')) {
                        e.preventDefault();
                        e.stopPropagation();

                        _this.obj.toToggle.slideDown(400, function() {
                            // Fin de l'animation
                            $this.addClass('toConfirm');
                            $(this).removeClass("form-closed");
                            $(this).find('input').first().focus();
                        });
                        _this.obj.toggle.slideUp(400);
                    } else if (_this.obj.toToggle.find('input').first().val() == '') {
                        e.preventDefault();
                        e.stopPropagation();

                        _this.obj.toToggle.slideUp(400, function() {
                            // Fin de l'animation
                            $this.removeClass('toConfirm');
                            $(this).addClass("form-closed");
                        });
                        _this.obj.toggle.slideDown(400);
                    }
                })
            }
        }
    }

    /**
     * Search result favoris
     * W/v Ajax refresh
     * @type {{init: init, start: start, config: {classes: {searchItem: string, searchAction: string}}}}
     */
    var searchResultRefreshHandler = {
        config: {
            classes: {
                searchItem: 'itResultat',
                searchAction: 'action-item'
            }
        },
        init: function () {
            this.start();
        },
        start: function () {
            var _this = this;

            $(document).on('jalios:refresh', function (e) {
                var _target = e.refresh.target;

                if (_target && _target.length) {
                    if (_target.hasClass(_this.config.classes.searchAction)) {
                        // Debug consoles
                        // console.log('Target:', _target);
                        // console.log('Target state:', _target.find('> .active').length);
                        // console.log('Debug Parent:', _target.closest('.' + _this.config.classes.searchItem));
                        // console.log('Debug child:', _target.find('> .active'));

                        _target.closest('.' + _this.config.classes.searchItem).toggleClass('active', _target.find('> .active').length !== 0);
                    }
                }
                //console.log(e.refresh.target);
            });
        }
    };

    /**
     * Custom forms handler
     * @type {{init: init, getUrlParams: (function(): Array), obj: {}, start: start, config: {classes: {allowDuplicationOfName: string, custom: string}}}}
     */
    var customFormsHandler = {
        config: {
            classes: {
                custom: 'form--keep-request',
                allowDuplicationOfName: 'form--allowMore'
            }
        },
        obj: {},
        init: function () {
            // get URL params
            this.obj.params = this.getUrlParams();

            // Get all forms with custom class
            this.obj.forms = $('form.' + this.config.classes.custom);
            if (this.obj.forms.length) {
                this.start();
            }
        },
        start: function () {
            var _this = this;

            _this.obj.forms.each(function (i, el) {
                var $el = $(el);
                $inputNames = [];
                $el.find('input:not([type=hidden])').each(function (i, input) {
                    var $input = $(input);

                    // ignorer si l'input a une classe custom qui indique que l'input peut avoir des doublons d'attribut name
                    if (!$input.hasClass(_this.config.classes.allowDuplicationOfName))
                        $inputNames.push($input.attr('name'));
                });

                Object.keys( _this.obj.params).forEach(function (k) {
                    // Ajout d'un champ hidden uniquement si un autre input avec le même name n'hesiste pas
                    if ($inputNames.indexOf(k) === -1) {
                        $('<input>').attr({
                            type: 'hidden',
                            name: _this.obj.params[k].key,
                            value: _this.obj.params[k].val.replace(/\+/g,' ')
                        }).appendTo($el);
                        // Debug 0011416 + en " "
                    }
                });
            })
        },
        getUrlParams: function () {
            var vars = [], hash;
            var decodeUnicode = decodeURI(window.location.search);
            var hashes = decodeUnicode.slice(window.location.search.indexOf('?') + 1).split('&');
            for (var i = 0; i < hashes.length; i++) {
                hash = hashes[i].split('=');
                vars.push({
                    key: hash[0],
                    val: hash[1]
                });
            }
            return vars;
        }
    };

    /**
     * A11Y Handler
     * @type {{init: init, obj: {}, start: start, update: update, setCookie: (function(*=): (jQuery|*|*)), config: {classes: {wrapper: string, toggle: string}, cookieName: string}, getCookie: (function(): (jQuery|*|*))}}
     */
    var a11ySwitchHandler = {
        config: {
            classes: {
                wrapper: 'a11y-fieldset',
                toggle: 'a11y-enhanced'
            },
            cookieName: 'a11y-enhanced'
        },
        obj: {},
        init: function () {
            this.obj.wrapper = $('.' + this.config.classes.wrapper);

            if (this.obj.wrapper.length) {
                this.start();
            }
        },
        start: function () {
            var _this = this;
            var cookieVal = _this.getCookie();

            if (!cookieVal) {
                _this.update(_this.setCookie(_this.obj.wrapper.find('input:checked').value) === true);
            } else {
                _this.obj.wrapper.find('input[value="' + cookieVal + '"]').prop("checked", true).click();
                _this.update(cookieVal === true);
            }

            this.obj.wrapper.find('input').on('change', function (e) {
                _this.update(e.currentTarget.value === 'true' && e.currentTarget.checked);
            });
        },
        update: function (state) {
            // Update body
            this.setCookie(state);
            $('body').toggleClass(this.config.classes.toggle, state);
        },
        setCookie: function (value) {
            return $.cookie(this.config.cookieName, value, {path:'/'});
        },
        getCookie: function () {
            return $.cookie(this.config.cookieName);
        }
    };

    /**
     * Custom remote Handler
     * Specifique
     */
    var customRemoteHandler = {
        init: function () {
            $(document).on('remote-tools.open remote-tools.close remote-tools.update', function(e, toggler) {
                //console.log('Test ' + e.namespace + ' event', e, toggler);

                if (toggler) {
                    var $toggler = $(toggler);

                    // Tous
                    if ($toggler && $toggler.length) {
                        console.log('Remote update detected', $toggler);

                        if (e.namespace === 'open') {
                            formToggleComfirm.init();
                            var simplebarEl = $toggler.find('*[data-simplebar]');

                            if (simplebarEl.length) {
                                simplebarEl.each(function (index, element) { 
                                        new SimpleBar(element, { autoHide: false }); 
                                    });
                            }
                        }
                    }

                    // Mon Compte
                    //var $monCompte = $toggler ? $toggler.length ? $toggler.hasClass('monCompte') ? $toggler : $toggler.parent().parent().find('.monCompte').length ? $toggler.parent().parent().find('.monCompte') : false : false : false;
                    //if ($monCompte && $monCompte.length) {
                    //    console.log('Menu update detected', $toggler);
                    //    if (e.namespace === 'open') {
                    //    }
                    //}
                }
            });
        }

    }

    /**
     * Advanced search checkbox handler
     */
    var advancedSearchHandler = {
        config: {
            classes: {
                section: 'section--advanced-search-antidot',
                wrapper: 'content-page-recherche',
                item: 'treeview-close',
                toggle: 'entete-accordeon'
            }
        },
        obj: {},
        init: function () {
            this.obj.wrapper = $('.' + this.config.classes.section + ' .' + this.config.classes.wrapper);
            this.obj.allToggle = $('.' + this.config.classes.toggle, this.obj.wrapper);
            this.obj.items = $('.' + this.config.classes.item + ':not(.no-child)', this.obj.wrapper);

            if (this.obj.items.length) {
                this.start();
            }
        },
        start: function () {
            var _ = this;
            var checkboxes = this.obj.items.find('> .container-button > input[type="checkbox"]');

            function parentStateHandler(parentWrapper, children) {
                var parentCheckbox = parentWrapper.find('> .container-button > input[type="checkbox"]');

                if (children.not(':checked').length === children.length) {
                    parentWrapper.removeClass('half-checked');
                    if (parentCheckbox.prop('checked')) {
                        parentCheckbox.prop('checked', false);
                    }
                } else if (children.not(':checked').length > 0) {
                    parentWrapper.addClass('half-checked');
                    if (!parentCheckbox.prop('checked')) {
                    	// debug 0011436. On ne coche pas le père quand on coche une fille
                        // parentCheckbox.prop('checked', true);
                    }
                } else {
                    parentWrapper.removeClass('half-checked');
                    if (!parentCheckbox.prop('checked')) {
                        parentCheckbox.prop('checked', true);
                    }
                }
            }

            function setChildrenState(triggerWrapper, val) {
                var children = triggerWrapper.find('> ul .' + _.config.classes.item + ' > .container-button > input[type="checkbox"]');
                if (children.length) {
                    children.prop('checked', val);

                    // Teste si le handler est deja set
                    if (!children.hasClass('registered-handler')) {
                        children.addClass('registered-handler');
                        children.on('change', function() {
                            parentStateHandler(triggerWrapper, children);
                        })
                    }
                }
            }

            this.obj.allToggle.on('click', function() {
                var $this = $(this);
                var $wrapper = $this.parent().parent();
                var $checkbox = $wrapper.find('> .container-button > input[type="checkbox"]');

                if ($checkbox.length) {
                    if ($wrapper.find('> ul.collapse').length) {
                        if (!($wrapper.hasClass('sous-onglet-active') && $checkbox[0].checked)) {
                        	//alert ("toto");
                            //$checkbox.prop('checked', !$checkbox[0].checked);
                            //$checkbox.trigger('change');
                        }
                    } else {
                        $checkbox.prop('checked', !$checkbox[0].checked);
                        $checkbox.trigger('change');
                    }
                }

                _.obj.wrapper.find('.level-1.active-onglet').trigger('refresh-size');
            });

            checkboxes.each(function (i) {
                var $el = $(this);
                var $wrapper = $el.parent().parent('.' + _.config.classes.item);

                $el.on('change', function(e) {
                    if ($wrapper.hasClass('half-checked') && this.checked === true) {
                        setChildrenState($wrapper, false);
                    } else if (this.checked === true) {
                        $wrapper.not('.sous-onglet-active').find('>.card-header>.entete-accordeon').trigger('click');
                        setChildrenState($wrapper, true);
                    } else {
                        $wrapper.removeClass('half-checked');
                        setChildrenState($wrapper, false);
                    }
                });

                $el.trigger('change');
            });
        }
    }

    /**
     * Checkbox proxy
     */
    var checkboxProxyHandler = {
        init: function() {
            $(document).on('click', '*[data-toggle="checkbox-proxy"]', function () {
                var $this = $(this);

                var checkboxes = $this.find('input[type="checkbox"]');
                console.log(checkboxes);
                if (checkboxes.length) {
                    checkboxes.prop("checked", !checkboxes.prop("checked"));
                    checkboxes.trigger('change');
                }
            });
        }
    }

    /**
     * Smooth scrolling to page anchor on click
     **/
    var headerOffset = 120;
    var ajusterAncre = function(e, command) {
        if ($(this).hasClass("sr-only")){
			return;
		}
		if (window.location.hash == "#maincontent"){
			return;
		}
        if (command === 'force') {
            var anchor = $(':target');
            if (anchor.length && anchor.next().length) {
                $('html, body')
                    .stop()
                    .animate({
                        scrollTop: anchor.next().offset().top - headerOffset + 30
                    }, 200);

            }
        } else {
            if ( location.hostname === this.hostname
                && this.pathname.replace(/^\//,"") === location.pathname.replace(/^\//,"")) {
                var anchor = $(this.hash);
                anchor = anchor.length ? anchor : $("[name=" + this.hash.slice(1) +"]");
                
                //alert(anchor.next().offset().top - headerOffset + 30);
                if (anchor.length && anchor.next().length) {
                    //alert('test ok');
                	setTimeout(function () {
                        $("html, body")
                            .stop()
                            .animate({
                                scrollTop: anchor.next().offset().top - headerOffset + 35 - ($('body').hasClass('header-main-fixed') ? 0 : 100)
                            }, 600);
                	},0)
                }
            }
        }
    };

    var scrollCtrl = {
        init: function () {
            if ($('#retourHaut').length == 0) {
                $('body').append('<div id="retourHaut">' +
                    '<a href="#" onclick="return false;">&nbsp;</a>' +
                    '</div>');
            }
            if ($('#scrollAvailable').length == 0) {
                $('body').append('<div id="scrollAvailable">' +
                    '<a href="#" onclick="return false;">&nbsp;</a>' +
                    '</div>');
            }
        }
    };


    /**
     * When dom is ready
     * Function
     */
    $(document).ready(function () {
        if ($('#retourHaut').length == 0) {
            $('body').append('<div id="retourHaut">' +
                '<a href="#" onclick="return false;">&nbsp;</a>' +
                '</div>');
        }
        console.log($('body > div > .homepage'));
        if ($('body > div > .homepage #maincontent .search-large-block.overlayer--white').length && $('#scrollAvailable').length == 0) {
            $('body .homepage #maincontent .search-large-block.overlayer--white').first().append('<div id="scrollAvailable">' +
                '<a href="#maincontent" onclick="return false;"><span class="top"></span><span class="dot"></span></a>' +
                '</div>');
        }
        var visibleOptimizr = false;
        $('#retourHaut').fadeOut("fast");
        $('#scrollAvailable').fadeIn("fast");
        $(window).scroll(function () {
            if ($(window).scrollTop() == 0) {
                if (visibleOptimizr) {
                    $('#retourHaut').fadeOut("fast");
                    // Stop next fadeIn $('#scrollAvailable').fadeIn("fast");
                }
                visibleOptimizr = false;
            } else {
                if (!visibleOptimizr) {
                    $('#retourHaut').fadeIn("fast");
                    // console.log($('#scrollAvailable'));
                    $('#scrollAvailable').fadeOut("fast");
                }
                visibleOptimizr = true;
            }
        });
        $(document).on('click', '#retourHaut a', function (event) {
            event.preventDefault();
            $('html,body').animate({scrollTop: 0}, 'slow');
            return false;
        });
        initAllPub();

        // Ajuster ancre au click sur une ancre
        $(document).on('click', "a[href*='#']:not([href='#'])", ajusterAncre);

        // Ajuster ancre au chargement
        $(window).on('load', function() {
            setTimeout(function() {
            ajusterAncre(null, 'force');
            }, 0);
        });

        // launch handlers
        a11ySwitchHandler.init();
        remoteHandler.init();
        customFormsHandler.init();
        resAddFilterHandler.init();
        resFacetteHandler.init();
        searchResultRefreshHandler.init();
        customRemoteHandler.init();
        advancedSearchHandler.init();
        checkboxProxyHandler.init();
        initAccordeon.init();
    });
    $(document).ready(function(){
        $(".owl-carousel").owlCarousel({
            loop:false,
            nav:true,
            margin:50,
            responsiveClass:true,
            responsive: {
                0: {
                    items: 1
                },
                768: {
                    items: 1
                },
                1200: {
                    items: 2
                }
            }
        });
        $( "button.btn-see-all" ).click(function() {
            $( ".voirTout" ).show();
            $(this).css('display','none')

        });


        // slick on mobile
        $slick_slider = $('.dossiers-large-block .list-boxes .row');
        settings_slider = {
            dots: true,
            infinite: true,
            speed: 300,
            slidesToShow: 1,
            adaptiveHeight: true
        }
        slick_on_mobile($slick_slider, settings_slider);
            function slick_on_mobile(slider, settings){
                $(window).on('load resize', function() {
                    if ($(window).width() > 768) {
                        if (slider.hasClass('slick-initialized')) {
                            slider.slick('unslick');
                        }
                        return
                    }
                    if (!slider.hasClass('slick-initialized')) {
                        return slider.slick(settings);
                    }
                });
            };

        $('li.nav-item a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            $('#maincontent .PortletCalendar .calendarNavigationLink .content-choix .change-view .nav-tabs .nav-item a').removeClass( "selected" );
        });


    });

    $('#nav-icon4').click(function(){
        var _ = $(this);
        // Toggle menu
        $('#menu').toggleClass('show-mobile');
        // Toggle menu button
        _.toggleClass('open');
        // Toggle overlayer
        overlayer.toggleClass('show-overlayer', _.hasClass("open"));

        var menuMobile = $('.menu-mobile .header-super-transversal');
        var menuWrapper = $('.header-super-transversal');

        if (menuWrapper.length) {
            if (menuMobile.length === 0) {
                // keep last location
                var prevLocation = menuWrapper.parent();
                menuWrapper.data('prevLocation', prevLocation[0]);

                menuMobile = menuWrapper.addClass('mobile-display');

                // Append to new location
                $('.menu-mobile').append(menuWrapper);
            }

            if (_.hasClass("open")) {
                menuMobile.addClass('show-mobile');
                overlayer.data('overlayerTogglerEl', _[0]);
            } else {
                menuMobile.removeClass('mobile-display show-mobile');

                // Append to previous location
                $(menuMobile.data('prevLocation')).append(menuMobile);
            }
        }
    });

    $('#nav-icon5').click(function(){
        $(this).toggleClass('open-telecommande');
        $('.quick-access-links-site.place-right').toggle();
        $('.quick-access-links-site').addClass('open-full');
    });

    function onresize(){
        if ($(document).width() <= 1024) {
            $('.header-super-target li.active').addClass('label-menu-active');
        }
    }
    //on resize et on load
    $(document).ready(onresize);
    $(window).resize(onresize);


    $('#selectionPublicSm').on('show.bs.collapse', function () {
        $('.entete-top').addClass('isOpen').removeClass('isClose');
    });
    $('#selectionPublicSm').on('hide.bs.collapse', function () {
        $('.entete-top').removeClass('isOpen').addClass('isClose');
    });


    //for level themes
    $(document).on('click', '.level-1>.card-header>.entete-accordeon', function() {
        var $this = $(this);
        var $el = $this.parents('li.level-1');
        var $child = $el.find('> ul.collapse');

        // Reset all
        $('li.level-1.active-onglet').removeClass('active-onglet').css({'margin-bottom': ''});

        if ($($this.attr('data-target')).hasClass('in')) {
            $($this.attr('data-target')).removeClass('in');
        }
        else {
            $('.lecontent.in').removeClass('in');
            $($this.attr('data-target')).addClass('in');
            $el.addClass('active-onglet');
        }
        
        $el.on('refresh-size', function () {
            if ($el.hasClass('active-onglet') && $child.length) {
                $el.css({'margin-bottom': $child.outerHeight() + 'px'});
            } else {
                $el.css({'margin-bottom': ''});
            }
        });
        $el.trigger('refresh-size');

        return false;
    });

    function innerChildListener() {
        $('.level-2>.card-header>.entete-accordeon:not(.js-registered)').on('click', function() {
            if($($(this).attr('data-target')).hasClass('in')) {
                $($(this).attr('data-target')).removeClass('in');
                $(this).parent().parent().removeClass('sous-onglet-active');
            }
            else {
                $($(this).attr('data-target')).addClass('in');
                $(this).parents('li.level-2').addClass('sous-onglet-active');
            }
            return false;
        }).addClass('js-registered');
        $('.level-3>.card-header>.entete-accordeon:not(.js-registered)').on('click', function() {
            if($($(this).attr('data-target')).hasClass('in')) {
                $($(this).attr('data-target')).removeClass('in');
                $('li.level-3.sous-onglet-active-3').removeClass('sous-onglet-active-3');
            }
            else {
                $('li.level-3.sous-onglet-active-3').removeClass('sous-onglet-active-3');
                $('.lecontent3.in').removeClass('in');
                $($(this).attr('data-target')).addClass('in');
                $(this).parents('li.level-3').addClass('sous-onglet-active-3');
            }
            return false;
        }).addClass('js-registered');

        //for level type
        $('#accordion-types .level-1-type>.card-header>.entete-accordeon:not(.js-registered)').on('click', function() {
            var $this = $(this);
            var $el = $(this).parents('li.level-1-type');
            var $child = $el.find('> ul.collapse');
    
            $('#accordion-types li.level-1-type.active-onglet').removeClass('active-onglet').css({'margin-bottom': ''});
    
            if($($(this).attr('data-target')).hasClass('in')) {
                $($(this).attr('data-target')).removeClass('in');
                $('#accordion-types li.level-1-type.active-onglet').removeClass('active-onglet');
            }
            else {
                $('#accordion-types li.level-1-type.active-onglet').removeClass('active-onglet');
                $('#accordion-types .lecontentType.in').removeClass('in');
                $($(this).attr('data-target')).addClass('in');
                $(this).parents('li.level-1-type').addClass('active-onglet');
            }
    
            if ($el.hasClass('active-onglet') && $child.length) {
                $el.css({'margin-bottom': $child.outerHeight() + 'px'});
            } else {
                $el.css({'margin-bottom': ''});
            }
            return false;
        }).addClass('js-registered');
    }
    innerChildListener();


    $(document).on('change', '.content-step input:checkbox', function(){
        if($(this).is(":checked")) {
            $(this).parents('.checkbox').addClass("checked");
        } else {
            $(this).parents('.checkbox').removeClass("checked");
        }
    });
    $(document).on('click', '.menuPublicClose', function () {
        $('#selectionPublicSm').collapse('hide');
    });

    // create overlayer if not exist
    var overlayer = $('main-menu-overlayer');
    if (!overlayer.length) {
        overlayer = $('<div />').addClass('main-menu-overlayer');
        $('body').append(overlayer);
    }
    overlayer.on('click', function() {
        var _ = $(this);
        if (_.data('overlayerTogglerEl')) {
            var $el = $(_.data('overlayerTogglerEl'));
            $el.click();
        }
    });

    
    function setClass(els, className, fnName) {
        for (var i = 0; i < els.length; i++) {
            els[i].classList[fnName](className);
        }
    }
    function setListenerOnCheckboxes() {
        var elBody = document.getElementsByTagName('body');
        var acc = document.getElementsByClassName("panel-heading");
        var panel = document.getElementsByClassName("panel-body");
        for (var i = 0; i < acc.length; i++) {
            acc[i].onclick = function() {
                var setClasses = !this.classList.contains('active');
                setClass(acc, 'active', 'remove');
                setClass(panel, 'show', 'remove');
                setClass(elBody, 'menu-element-open', 'remove');
                console.log(elBody);
                if ( $(this).parents().hasClass("menu-mobile") ) {
                    if (setClasses) {
                        this.classList.toggle('active');
                        this.nextElementSibling.classList.toggle('show');
                        elBody[0].classList.toggle('menu-element-open');
                    }
                    console.log(elBody[0].classList.contains('menu-element-open'));
                    overlayer.toggleClass('show-overlayer', elBody[0].classList.contains('menu-element-open'));
                    overlayer.data('overlayerTogglerEl', this);
                }
                //added to accordeon wysiwyg
                if ( !$(this).parents().hasClass("menu-mobile") ) {
                    if (setClasses) {
                        this.classList.toggle('active');
                    }
                }

            }
        }
    }
    setListenerOnCheckboxes();
    $(document).ajaxComplete(function(e) {
        // refresh listener on checkboxes
        setListenerOnCheckboxes();
        innerChildListener();
        advancedSearchHandler.init();
        formToggleComfirm.init();
    });
    //menu sticky en desktop
    $(window).scroll(function (event) {
        var $body = $('body');
        var $header = $('.header-site');
        // A chaque fois que l'utilisateur va scroller (descendre la page)
        var y = $(this).scrollTop(); // On récupérer la valeur du scroll vertical
        //si cette valeur > à 200 on ajouter la class
        if (y >= $('.header-super', $header).height()) {
            if (!$body.hasClass('header-main-fixed')) {
                $body.addClass('header-main-fixed header-animation-fixed');
                setTimeout(function() {
                    $body.removeClass('header-animation-fixed');
                }, 100);
            }
        } else {
            // sinon, on l'enlève
            $body.removeClass('header-main-fixed header-animation-fixed');
        }
    });
    
    var initAccordeon = {
        init: function() {
    		if (jQuery('.wysiwyg > .panel-heading').size()>0) {
    			jQuery('.wysiwyg > .panel-heading').each(function(){
    				jQuery(this).nextUntil(".endPanel").wrapAll('<div class="collapse panel-body"/>');
    				
    				if (jQuery(this).hasClass('open')) {
    					jQuery(this).next().slideToggle('fast');
    				}
    				jQuery(this).on('click',function() {
    					(jQuery(this).hasClass('open'))?jQuery(this).removeClass('open'):jQuery(this).addClass('open');
    					jQuery(this).next().slideToggle('fast');
    				});
    				
    			});
    		}
        }
    }
    
    $(".publication-large-block .owl-carousel").owlCarousel({
        margin: 10,
        responsiveClass:true,
        responsive:{
            0:{
                items:1
            },
            1024:{
                items:3
            }
        }
    });

    $('.owl-carousel').each(function() {
        //Find each set of dots in this carousel
      $(this).find('.owl-dot').each(function(index) {
        //Add one to index so it starts from 1
        let page = index + 1;
        $(this).attr('aria-label', "Page " + page + " du carousel");
      });
    });

    $('label[for="a11y-switch-enable"], label[for="a11y-switch-disable"]').keypress(function(event){  
        if(event.code === "Enter") {
            $('#'+ $(this).attr('for')).prop("checked", true);
            $('#'+ $(this).attr('for')).trigger('change');
        }
    });

    //Scroll du glossaire avec menu sticky
    $(".glossaire a.indexLetter").on('click',function() {
        if (
            location.hostname == this.hostname
            && this.pathname.replace(/^\//,"") == location.pathname.replace(/^\//,"")
        ) {
            var anchor = $(this.hash);
            anchor = anchor.length ? anchor : $("[name=" + this.hash.slice(1) +"]");
            if ( anchor.length ) {
                $("html, body").animate( { scrollTop: anchor.offset().top - 100 }, 1500);
            }
        }
    });
    if(location.hash){
    	console.log('HASH');
    	$("html, body").animate( { scrollTop: $(location.hash).offset().top - 100 }, 1500);
    }
    
    
    
}(window.jQuery);