# Plumo – website

Landing, help and privacy page for **Plumo – Photo Cleaner**, the iPhone app that
sorts photos with a swipe. Static HTML/CSS with a little vanilla JS: no build step,
no framework, no cookies, no analytics, no third-party requests (system fonts,
everything self-hosted). English, French and Spanish.

**Status:** live on GitHub Pages at <https://geofffreyyy.github.io/plumo-site/>,
published from `main` (root). Plumo is not on the App Store yet, so the page says
"Coming soon to the App Store" and has no store link. The day the app is out, run
`python3 tools/launch.py <App Store address>` (see "Launch day").

## Addresses that must not change

These are already in the app and in App Store Connect. The page can change, these
addresses and anchors cannot:

- Support URL (App Store Connect): `https://geofffreyyy.github.io/plumo-site/#support`
- Privacy Policy URL (App Store Connect): `https://geofffreyyy.github.io/plumo-site/#privacy`
- The app opens `…/plumo-site/?lang=<en|fr|es>#privacy` and `…#support`
- The App Store listing links `…/plumo-site/?lang=fr#privacy`
- `#ads` is the advertising part of the privacy policy

`?lang=` wins over the saved choice, and `script.js` lets the page settle before
smooth scrolling starts, so these links land on their section at once. After any
change, open the four links above and check they land on the right section in the
right language.

The address itself is hard-coded in `index.html` (`<link rel="canonical">`,
`og:url`, `og:image`, `twitter:image`) and in `404.html` (home and icon links,
`/plumo-site/…`).

## Preview locally

```bash
cd ~/Developer/plumo-site && python3 -m http.server 8000
```

Then open <http://localhost:8000/?lang=fr> (or `en`, `es`).
`python3 -m http.server` does not serve `404.html` for missing paths; open
`/404.html` directly (its icon links only resolve on GitHub Pages).

## Files

- `index.html` – the whole page: opening (`#top`), `#film`, `#sort`, `#trash`,
  `#cleanup`, `#space`, `#private`, `#plans`, the status band, `#faq`, `#support`,
  `#privacy` (with `#ads`)
- `styles.css` – all styles; the app's colours are CSS variables at the top
- `lang.js` – picks the language before first paint (`?lang=` → saved choice →
  browser language); loaded synchronously in `<head>`
- `script.js` – EN/FR/ES buttons (remembers the choice in `localStorage`, keeps
  `?lang=` in step) and the film player in `#film`
- `films/` – the film: `<fr|en>-<landscape|portrait>.mp4`, their posters
  `<fr|en>-poster-<landscape|portrait>.jpg` and the captions `<fr|en|es>.vtt`
- `screens/` – App Store screenshots, 900 px wide, WebP with JPEG fallback,
  `<screen>-<en|fr|es>.<webp|jpg>`
- `assets/` – icon sizes made from the app icon
- `404.html` – self-contained "page not found", three languages
- `tools/launch.py` – the launch-day switch from "Coming soon" to the store link
- `robots.txt`, `.nojekyll`

The page was first laid out by a one-off script in the format of the Rarqio,
One of Us and LastHit sites (21 November 2026). That script is not kept: edit
`index.html` by hand.

## Editing text (three languages)

Every piece of text exists three times, side by side:

```html
<span lang="en">Sort</span><span lang="fr">Trier</span><span lang="es">Ordenar</span>
<p lang="en">…</p>
<p lang="fr">…</p>
<p lang="es">…</p>
```

CSS hides the languages that are not active. Without JavaScript the page shows
English. Attributes that can't hold spans (`aria-label`, `alt`) hold the English
and get `data-fr-…` and `data-es-…` twins, e.g.
`aria-label="Language" data-fr-aria-label="Langue" data-es-aria-label="Idioma"`.
Screenshots work the same way: each phone has one `<picture lang>` per language,
each with its own `alt`; the hidden ones are lazy and never downloaded.

The French page says « vous », the Spanish page « tú ». The words come from the
App Store listing (`AppStore-1.0/fiche.json` and `legendes.json` in the app
project); the screenshots are the App Store captures in
`AppStore-1.0/captures/brut/`. The photos inside them are CC0. Never put a figure
on the page that the app does not show exactly, and no AI wording.

The privacy policy text is the one Apple reviewed: change it only when the app's
data use changes, and then update the effective date in the three languages.

## Content Security Policy

`index.html` carries a strict CSP (`default-src 'self'`, no inline script, no
inline style). Keep it that way:

- no `<script>` or `<style>` blocks and no `style="…"` attributes in `index.html`
- no external URLs for scripts, styles, fonts, images or video
- `media-src 'self'` is there for the film in `films/` only

`404.html` has one inline `<style>`, allowed by its SHA-256 hash in that page's
CSP. If you edit that style, recompute the hash and paste it into the CSP:

```bash
python3 -c "import re,hashlib,base64;s=open('404.html',encoding='utf-8').read();print(base64.b64encode(hashlib.sha256(re.search(r'<style>(.*?)</style>',s,re.S).group(1).encode()).digest()).decode())"
```

## The film

`#film` plays the Plumo film made in the films workspace
(`~/Developer/2g-business-films`, film key `plumo`), copied here under the same
names as on the 2G Business site (`public/films/plumo/`). It exists in English
(0:31) and French (0:32); the Spanish page plays the English cut with
`films/es.vtt` shown from the start (same timings as `en.vtt`).

Nothing is fetched before the play button is pressed: the `<video>` has no source
until then, and `script.js` picks the cut from the page language and the screen's
orientation at that moment. The durations beside the play button are written in
`index.html`; update them, and `es.vtt`, if the film is re-cut.

## Launch day

1. Open the App Store address and check it shows Plumo.
2. `python3 tools/launch.py https://apps.apple.com/app/id6837795742` (or the
   address Apple gives). It adds the Smart App Banner and swaps the "Coming soon"
   chips for the App Store button, with the status band, the FAQ entry and the
   link-preview descriptions, in the three languages. It checks every replacement
   first and writes nothing if the page no longer matches.
3. Update the status line at the top of this file, preview, commit and push.
4. Check the live page with a cache-buster (`?v=…`) and the four links in
   "Addresses that must not change".
