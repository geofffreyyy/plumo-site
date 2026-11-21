/* Plumo site – EN/FR/ES buttons and the film player.
   The language is picked before first paint by lang.js; this file wires the
   buttons, remembers the choice, swaps a few attributes and plays the film in
   the language shown. No network requests other than the film once it is
   asked for, no storage other than the language choice. */
(function () {
  'use strict';

  var root = document.documentElement;
  var STORAGE_KEY = 'plumo-lang';
  var LANGS = ['en', 'fr', 'es'];
  var TITLES = {
    en: 'Plumo – Photo Cleaner',
    fr: 'Plumo – Tri de photos',
    es: 'Plumo – Limpiar fotos'
  };

  function known(lang) {
    return LANGS.indexOf(lang) !== -1 ? lang : 'en';
  }

  // Attributes that can't hold three <span lang> children get data-fr-* and
  // data-es-* twins; the attribute itself holds the English.
  var swaps = [];
  ['aria-label', 'alt'].forEach(function (attr) {
    var nodes = document.querySelectorAll('[data-fr-' + attr + '], [data-es-' + attr + ']');
    for (var i = 0; i < nodes.length; i++) {
      swaps.push({
        el: nodes[i],
        attr: attr,
        en: nodes[i].getAttribute(attr),
        fr: nodes[i].getAttribute('data-fr-' + attr) || nodes[i].getAttribute(attr),
        es: nodes[i].getAttribute('data-es-' + attr) || nodes[i].getAttribute(attr)
      });
    }
  });

  // ---------- The film ----------
  // Never autoplayed, and nothing is fetched before the click: the video has no
  // source until then. The orientation is read at the click, so a phone turned
  // upright before pressing play gets the upright cut. The film exists in
  // English and French; the Spanish page plays the English cut with Spanish
  // captions shown from the start.
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var CAPTIONS = {
    en: { file: 'en', label: 'English' },
    fr: { file: 'fr', label: 'Français' },
    es: { file: 'es', label: 'Español' }
  };
  var film = (function () {
    var frame = document.getElementById('film-frame');
    var video = document.getElementById('film-video');
    var cover = document.getElementById('film-cover');
    var button = document.getElementById('film-play');
    if (!frame || !video || !cover || !button) {
      return { start: function () {}, setLanguage: function () {}, frame: null };
    }
    var portrait = window.matchMedia('(orientation: portrait)');
    var pageLang = 'en';
    var loaded = null;

    function cut() {
      return pageLang === 'fr' ? 'fr' : 'en';
    }

    function setState(state) {
      frame.setAttribute('data-state', state);
      var playing = state === 'playing';
      video.controls = playing;
      video.tabIndex = playing ? 0 : -1;
      video.setAttribute('aria-hidden', String(!playing));
      cover.inert = playing;
      button.tabIndex = playing ? -1 : 0;
    }

    function dropTracks() {
      var tracks = video.querySelectorAll('track');
      for (var i = 0; i < tracks.length; i++) tracks[i].remove();
    }

    function start() {
      var key = cut() + '-' + (portrait.matches ? 'portrait' : 'landscape');
      var wanted = key + '/' + pageLang;
      if (loaded !== wanted) {
        loaded = wanted;
        dropTracks();
        video.src = 'films/' + key + '.mp4';
        var captions = CAPTIONS[pageLang];
        var track = document.createElement('track');
        track.kind = pageLang === 'es' ? 'subtitles' : 'captions';
        track.src = 'films/' + captions.file + '.vtt';
        track.srclang = pageLang;
        track.label = captions.label;
        // The voice is English on the Spanish page: show the Spanish words at once.
        if (pageLang === 'es') track.default = true;
        video.appendChild(track);
        if (pageLang === 'es' && video.textTracks && video.textTracks[0]) {
          video.textTracks[0].mode = 'showing';
        }
      } else if (video.ended) {
        video.currentTime = 0;
      }
      setState('playing');
      // Called inside the click, which is what lets it play with sound.
      var attempt = video.play();
      if (attempt && attempt.catch) attempt.catch(function () { setState('idle'); });
      requestAnimationFrame(function () { video.focus({ preventScroll: true }); });
    }

    video.addEventListener('ended', function () { setState('ended'); });
    video.addEventListener('play', function () {
      if (frame.getAttribute('data-state') !== 'playing') setState('playing');
    });
    button.addEventListener('click', start);

    return {
      frame: frame,
      start: start,
      setLanguage: function (lang) {
        if (lang === pageLang) return;
        pageLang = lang;
        if (loaded) {
          // A film for another language was loaded: drop it, back to the poster.
          video.pause();
          video.removeAttribute('src');
          dropTracks();
          video.load();
          loaded = null;
          setState('idle');
        }
      }
    };
  })();

  // "Watch the film" in the opening: start it, then bring it into view.
  var playLinks = document.querySelectorAll('[data-play-film]');
  for (var p = 0; p < playLinks.length; p++) {
    playLinks[p].addEventListener('click', function (event) {
      if (!film.frame) return;
      event.preventDefault();
      film.start();
      film.frame.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
    });
  }

  // ---------- Language ----------
  var buttons = document.querySelectorAll('[data-set-lang]');

  function apply(lang) {
    root.setAttribute('data-lang', lang);
    root.lang = lang;
    document.title = TITLES[lang];
    swaps.forEach(function (s) {
      s.el.setAttribute(s.attr, s[lang]);
    });
    film.setLanguage(lang);
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', String(buttons[i].getAttribute('data-set-lang') === lang));
    }
  }

  // If the page was opened with ?lang= (as the app does), keep the address in
  // step with the choice so a reload or a shared link shows what was picked.
  function syncUrl(lang) {
    try {
      var url = new URL(window.location.href);
      if (!url.searchParams.has('lang')) return;
      url.searchParams.set('lang', lang);
      window.history.replaceState(null, '', url.toString());
    } catch (e) { /* old browser: leave the address alone */ }
  }

  for (var b = 0; b < buttons.length; b++) {
    buttons[b].addEventListener('click', function () {
      var lang = known(this.getAttribute('data-set-lang'));
      try { window.localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* storage blocked: ignore */ }
      syncUrl(lang);
      apply(lang);
    });
  }

  apply(known(root.getAttribute('data-lang')));

  // Smooth scrolling only once the page (and any #privacy / #support jump from
  // the app or the App Store) has settled, so those links land at once.
  function enableSmoothScroll() {
    setTimeout(function () { root.classList.add('smooth-scroll'); }, 0);
  }
  if (document.readyState === 'complete') {
    enableSmoothScroll();
  } else {
    window.addEventListener('load', enableSmoothScroll);
  }
})();
