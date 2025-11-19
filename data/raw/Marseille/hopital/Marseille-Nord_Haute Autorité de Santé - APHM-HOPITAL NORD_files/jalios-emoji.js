(function ( $ ) {

  if (!$.jalios) { $.jalios = {}; }
  
  $.jalios.Emoji = {
    parse: function(html, options){
      return parseWithTwemoji(html, options);
    },
  
    defaults : {
      base: $.jalios.Properties.get('twemoji.base') || ($.jalios.Properties.get('twemoji.use-cdn') ? null : (JcmsJsContext.getBaseUrl() + 'js/lib/twemoji/')),
      attributes: $.jalios.Properties.get('twemoji.attributes'),
      ext: $.jalios.Properties.get('twemoji.ext') || twemoji.ext,
      className: $.jalios.Properties.get('twemoji.className') || twemoji.className,
      size: $.jalios.Properties.get('twemoji.size') || twemoji.size,
      folder: $.jalios.Properties.get('twemoji.folder'),
      callback: $.jalios.Properties.get('twemoji.callback') || function(icon, options, variant) {
        var excludedIconRegExp = $.jalios.Properties.get('twemoji.excludedIconRegExp') || /^(a9|ae|2122)$/;
        if (excludedIconRegExp instanceof RegExp && excludedIconRegExp.exec(icon)) {
           return false;
        }
        return ''.concat(options.base, options.size, '/', icon, options.ext);
      }
    }
  };
  
  var parseWithTwemoji = function(elm, options) {
    if (typeof twemoji == 'undefined') {
      return;
    }

    var options = $.extend({}, $.jalios.Emoji.defaults, options);
    
    return twemoji.parse(elm, options);
  }
  
  var registerTwemoji = function() {
    if (typeof twemoji == 'undefined') {
      return;
    }

    parseWithTwemoji(document.body);

    $(document).on('jalios:refresh', function(event) {
      var refresh = $.jalios.Event.match(event, 'refresh', 'after');
      if (!refresh || !refresh.target){ return; }
      var $refreshElm = $(refresh.target);
      parseWithTwemoji($refreshElm[0]);
    });
  }
  
  // Register all 
  
  $(document).ready(function(){
    registerTwemoji();
  });

}( jQuery ));

