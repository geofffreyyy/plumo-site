/* Plumo site – picks the page language before first paint.
   Order: ?lang= in the URL (the app opens …?lang=xx#privacy or #support),
   then the saved choice, then the browser language. Loaded synchronously
   from <head> as a file (not inline) so the Content Security Policy can
   forbid inline scripts. */
(function () {
  'use strict';

  var root = document.documentElement;
  var known = { en: true, fr: true, es: true };
  var lang = null;

  root.classList.add('js');

  try { lang = new URLSearchParams(window.location.search).get('lang'); } catch (e) { /* old browser */ }
  if (!known[lang]) {
    try { lang = window.localStorage.getItem('plumo-lang'); } catch (e) { /* storage blocked */ }
  }
  if (!known[lang]) {
    var nav = ((navigator.languages && navigator.languages[0]) || navigator.language || 'en').toLowerCase().slice(0, 2);
    lang = known[nav] ? nav : 'en';
  }

  root.setAttribute('data-lang', lang);
  root.lang = lang;
})();
