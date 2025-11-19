// PATCH x/ Prototype
// http://www.softec.lu/site/DevelopersCorner/BootstrapPrototypeConflict
if (Prototype.BrowserFeatures.ElementExtensions) {
  var disablePrototypeJS = function (method, pluginsToDisable) {
      var handler = function (event) {
        event.target[method] = undefined;
        setTimeout(function () {
          delete event.target[method];
        }, 0);
      };
      pluginsToDisable.each(function (plugin) {
        jQuery(window).on(method + '.bs.' + plugin, handler);
        jQuery(window).on(method + '.spectrum.' + plugin, handler);
      });
    },
    pluginsToDisable = ['collapse', 'dropdown', 'modal', 'tooltip', 'popover', 'tab'];
  disablePrototypeJS('show', pluginsToDisable);
  disablePrototypeJS('hide', pluginsToDisable);
}
