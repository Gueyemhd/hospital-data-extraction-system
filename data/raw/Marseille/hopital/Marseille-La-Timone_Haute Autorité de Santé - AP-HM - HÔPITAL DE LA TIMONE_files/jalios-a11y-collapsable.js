/*
From https://github.com/paypal/bootstrap-accessibility-plugin 1.0.6
Copyright (c) 2014, PayPal All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

Neither the name of the PayPal nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
(function ($) {
    "use strict";

    // ===============================
    // Collapse Extension
    // ===============================

    var $colltabs = $('[data-toggle="collapse"]')
    $colltabs.each(function (index) {
        var colltab = $(this)
            , collpanel = (colltab.attr('data-target')) ? $(colltab.attr('data-target')) : $(colltab.attr('href'))
            , parent = colltab.attr('data-parent')
            , collparent = parent && $(parent)
            , collid = colltab.attr('id') || $.jalios.a11y.uniqueId('ui-collapse')

        colltab.attr('id', collid)

        if (collparent) {
            colltab.attr({ 'role': 'tab', 'aria-selected': 'false', 'aria-expanded': 'false' })
            $(collparent).find('div:not(.collapse,.panel-body), h4').attr('role', 'presentation')
            collparent.attr({ 'role': 'tablist', 'aria-multiselectable': 'true' })

            if (collpanel.hasClass('in')) {
                colltab.attr({ 'aria-controls': collpanel.attr('id'), 'aria-selected': 'true', 'aria-expanded': 'true', 'tabindex': '0' })
                collpanel.attr({ 'role': 'tabpanel', 'tabindex': '0', 'aria-labelledby': collid, 'aria-hidden': 'false' })
            } else {
                colltab.attr({ 'aria-controls': collpanel.attr('id'), 'tabindex': '-1' })
                collpanel.attr({ 'role': 'tabpanel', 'tabindex': '-1', 'aria-labelledby': collid, 'aria-hidden': 'true' })
            }
        }
    })

    var collToggle = $.fn.collapse.Constructor.prototype.toggle
    $.fn.collapse.Constructor.prototype.toggle = function () {
        var prevTab = this.$parent && this.$parent.find('[aria-expanded="true"]'), href

        if (prevTab) {
            var prevPanel = prevTab.attr('data-target') || (href = prevTab.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')
                , $prevPanel = $(prevPanel)
                , $curPanel = this.$element
                , par = this.$parent
                , curTab

            if (this.$parent) curTab = this.$parent.find('[data-toggle=collapse][href="#' + this.$element.attr('id') + '"]')

            collToggle.apply(this, arguments)

            if ($.support.transition) {
                this.$element.one($.support.transition.end, function () {

                    prevTab.attr({ 'aria-selected': 'false', 'aria-expanded': 'false', 'tabIndex': '-1' })
                    $prevPanel.attr({ 'aria-hidden': 'true', 'tabIndex': '-1' })

                    curTab.attr({ 'aria-selected': 'true', 'aria-expanded': 'true', 'tabIndex': '0' })

                    if ($curPanel.hasClass('in')) {
                        $curPanel.attr({ 'aria-hidden': 'false', 'tabIndex': '0' })
                    } else {
                        curTab.attr({ 'aria-selected': 'false', 'aria-expanded': 'false' })
                        $curPanel.attr({ 'aria-hidden': 'true', 'tabIndex': '-1' })
                    }
                })
            }
        } else {
            collToggle.apply(this, arguments)
        }
    }

    $.fn.collapse.Constructor.prototype.keydown = function (e) {
        var $this = $(this)
            , $items
            , $tablist = $this.closest('div[role=tablist] ')
            , index
            , k = e.which || e.keyCode

        $this = $(this)
        if (!/(32|37|38|39|40)/.test(k)) return
        if (k == 32) $this.click()

        $items = $tablist.find('[role=tab]')
        index = $items.index($items.filter(':focus'))

        if (k == 38 || k == 37) index--                                        // up & left
        if (k == 39 || k == 40) index++                        // down & right
        if (index < 0) index = $items.length - 1
        if (index == $items.length) index = 0

        $items.eq(index).focus()

        e.preventDefault()
        e.stopPropagation()

    }

    $(document).on('keydown.collapse.data-api', '[data-toggle="collapse"]', $.fn.collapse.Constructor.prototype.keydown);

})(jQuery);