/**
 * @file
 * Init tarteaucitron.js script.
 */
/* global tarteaucitron */
((Drupal, drupalSettings, tarteaucitron) => {
  /**
   * Init tarteaucitron.js script.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the script.
   */
  Drupal.behaviors.tacjs = {
    attach: function attach() {
      if (window.alreadyLaunch) return;

      // Set base URL for TacJS Log
      tarteaucitron.baseUrl = drupalSettings.path.baseUrl;

      // Add custom texts to tarteaucitron.
      window.tarteaucitronCustomText = drupalSettings.tacjs.texts;

      // Add users identification to tarteaucitron.
      // Undefined user causes javascript errors #3326860 #3323411.
      tarteaucitron.user = drupalSettings.tacjs.user || {};

      // Set expiration time in day(s)
      if (drupalSettings.tacjs.expire) {
        window.tarteaucitronExpireInDay = true;
        window.tarteaucitronForceExpire = drupalSettings.tacjs.expire;
      }

      // Workaround for #3120915: convert multiplegtagUa into a Array
      // See https://www.drupal.org/project/tacjs/issues/3120915
      if (tarteaucitron.user.multiplegtagUa) {
        tarteaucitron.user.multiplegtagUa =
          tarteaucitron.user.multiplegtagUa.split(', ');
      }

      // Workaround for #3204238: convert googleFonts into a Array
      // See https://www.drupal.org/project/tacjs/issues/3204238
      if (tarteaucitron.user.googleFonts) {
        tarteaucitron.user.googleFonts =
          tarteaucitron.user.googleFonts.split(', ');
      }

      // Add enabled services to tarteaucitron services.
      Object.keys(drupalSettings.tacjs.services)
        .filter((service) => {
          // Filter enabled services.
          return drupalSettings.tacjs.services[service].status;
        })
        .forEach((service) => {
          const s = drupalSettings.tacjs.services[service];
          const lang = drupalSettings.path.currentLanguage;
          const slanguages = s.languages;
          const { needConsent } = s;
          const languages = [];

          // Check service
          if (!tarteaucitron.services[service]) return;

          // Check service languages
          if (slanguages) {
            Object.keys(slanguages)
              .filter((language) => {
                return slanguages[language];
              })
              .forEach((language) => {
                languages.push(language);
              });
          }

          // Check languages
          if (languages.length !== 0 && !languages.includes(lang)) return;

          // Set consent
          if (needConsent !== undefined) {
            tarteaucitron.services[service].needConsent = needConsent;
          }

          (tarteaucitron.job = tarteaucitron.job || []).push(service);
        });

      // Initiate tarteaucitron
      tarteaucitron.init(drupalSettings.tacjs.dialog);

      // Window onload event sometimes occurs before tacjs init is called.
      if (document.readyState === 'complete') {
        // Ressources fully loaded, load event already fired, force call.
        tarteaucitron.initEvents.loadEvent(!window.addEventListener);
      }
    },
  };
})(Drupal, drupalSettings, tarteaucitron);
