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
    var modalhide = $.fn.modal.Constructor.prototype.hide
    $.fn.modal.Constructor.prototype.hide = function () {
        modalhide.apply(this, arguments)
        $(document).off('keydown.bs.modal')
    }

    var modalfocus = $.fn.modal.Constructor.prototype.enforceFocus
    $.fn.modal.Constructor.prototype.enforceFocus = function () {
        var $content = this.$element.find(".modal-content")
        this.$element.show()

        var focEls = $content.find(":tabbable")
            , $lastEl = $(focEls[focEls.length - 1])
            , $firstEl = $(focEls[0])
            
        $lastEl.on('keydown.bs.modal', $.proxy(function (ev) {
            if (ev.keyCode === 9 && !(ev.shiftKey | ev.ctrlKey | ev.metaKey | ev.altKey)) { // TAB pressed
                ev.preventDefault();
                $firstEl.focus();
            }
        }, this))
        $firstEl.on('keydown.bs.modal', $.proxy(function (ev) {
            if (ev.keyCode === 9 && ev.shiftKey) { // SHIFT-TAB pressed
                ev.preventDefault();
                $lastEl.focus();
            }
        }, this))
        modalfocus.apply(this, arguments)
    }
})(jQuery);