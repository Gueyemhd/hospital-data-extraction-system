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
    // Tab Extension
    // ===============================

    var $tablist = $('.nav-tabs:not(.is-navigation), .nav-pills:not(.is-navigation)')
        , $lis = $tablist.children('li')
        , $tabs = $tablist.find('[data-toggle="tab"], [data-toggle="pill"]')

    if ($tabs.exists()) {
        $tablist.attr('role', 'tablist')
        $lis.attr('role', 'presentation')
        $tabs.attr('role', 'tab')
    }

    $tabs.each(function (index) {
       let tabTargetSelector = $(this).attr('href') ? $(this).attr('href') : $(this).data("target");
       let tabTarget = tabTargetSelector.substring(tabTargetSelector.indexOf("#"));
    
        var tabpanel = $(tabTarget)
            , tab = $(this)
            , tabid = tab.attr('id') || $.jalios.a11y.uniqueId('ui-tab')

        tab.attr('id', tabid)
        let tabAriaControls = tab.attr('href') ? tab.attr('href').substr(1) : $(tab).data("target").substr(1);
        if (tab.parent().hasClass('active')) {
            tab.attr({ 'tabIndex': '0', 'aria-selected': 'true', 'aria-controls': tabAriaControls })
            tabpanel.attr({ 'role': 'tabpanel', 'tabIndex': '0', 'aria-hidden': 'false', 'aria-labelledby': tabid })
        } else {
            tab.attr({ 'tabIndex': '-1', 'aria-selected': 'false', 'aria-controls': tabAriaControls })
            tabpanel.attr({ 'role': 'tabpanel', 'tabIndex': '-1', 'aria-hidden': 'true', 'aria-labelledby': tabid })
        }
    })

    $.fn.tab.Constructor.prototype.keydown = function (e) {
        var $this = $(this)
            , $items
            , $ul = $this.closest('ul[role=tablist] ')
            , index
            , k = e.which || e.keyCode

        $this = $(this)
        if (!/(37|38|39|40)/.test(k)) return

        $items = $ul.find('[role=tab]:visible')
        index = $items.index($items.filter(':focus'))

        if (k == 38 || k == 37) index--                         // up & left
        if (k == 39 || k == 40) index++                        // down & right


        if (index < 0) index = $items.length - 1
        if (index == $items.length) index = 0

        var nextTab = $items.eq(index)
        if (nextTab.attr('role') === 'tab') {

            nextTab.tab('show')      //Comment this line for dynamically loaded tabPabels, to save Ajax requests on arrow key navigation
                .focus()
        }
        // nextTab.focus()

        e.preventDefault()
        e.stopPropagation()
    }

    $(document).on('keydown.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', $.fn.tab.Constructor.prototype.keydown)

    var tabactivate = $.fn.tab.Constructor.prototype.activate;
    $.fn.tab.Constructor.prototype.activate = function (element, container, callback) {
        var $active = container.find('> .active')
        $active.find('[data-toggle=tab], [data-toggle=pill]').attr({ 'tabIndex': '-1', 'aria-selected': false })
        $active.filter('.tab-pane').attr({ 'aria-hidden': true, 'tabIndex': '-1' })

        tabactivate.apply(this, arguments)

        element.addClass('active')
        element.find('[data-toggle=tab], [data-toggle=pill]').attr({ 'tabIndex': '0', 'aria-selected': true })
        element.filter('.tab-pane').attr({ 'aria-hidden': false, 'tabIndex': '0' })
    }
})(jQuery);