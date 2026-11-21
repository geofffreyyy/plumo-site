#!/usr/bin/env python3
"""The day Plumo is on the App Store: switch the page from "Coming soon" to the store link.

    python3 tools/launch.py https://apps.apple.com/app/id6837795742

Run it from the repository root, once, after checking that the address opens the app's
page. It edits index.html only (the App Store button styles are already in styles.css):
the Smart App Banner, the App Store button in the opening and in the status band, the
status band text, the FAQ entry and the link-preview descriptions. Every replacement is
checked before anything is written, so a page that has changed since this script was
written is left untouched and the script says what it missed. Then preview the page,
update the README's status line, commit and push.
"""
import pathlib
import re
import sys

if len(sys.argv) != 2 or not re.fullmatch(r"https://apps\.apple\.com/(?:[a-z]{2}/)?app/(?:[^/]+/)?id\d+", sys.argv[1]):
    sys.exit(__doc__)
URL = sys.argv[1]
APP_ID = re.search(r"id(\d+)$", URL).group(1)


def button(indent):
    pad = " " * indent
    return f"""<a class="appstore" href="{URL}">
{pad}  <svg class="apple" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.5 1.3 0 1.7-.8 3.3-.8 1.5 0 1.9.8 3.3.8 1.4 0 2.2-1.2 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.2zM13.9 5.3c.7-.8 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z"/></svg>
{pad}  <span class="appstore-text">
{pad}    <span lang="en"><small>Download on the</small> <strong>App Store</strong></span>
{pad}    <span lang="fr"><small>Télécharger dans l’</small><strong>App Store</strong></span>
{pad}    <span lang="es"><small>Descárgalo en el</small> <strong>App Store</strong></span>
{pad}  </span>
{pad}</a>"""


EDITS = [
    # (what it is, text to find, how many times, replacement)
    ("Smart App Banner",
     """  <!-- TODO: once Plumo is on the App Store, run tools/launch.py (Smart App Banner and store links). -->
""", 1, f"""  <meta name="apple-itunes-app" content="app-id={APP_ID}">
"""),
    ("page description",
     "and your photos stay on your iPhone. Coming soon to the App Store. Help, contact and privacy policy.", 1,
     "and your photos stay on your iPhone. On the App Store. Help, contact and privacy policy."),
    ("link-preview descriptions",
     "Your photos stay on your iPhone. Coming soon to the App Store.", 2,
     "Your photos stay on your iPhone. On the App Store."),
    ("button in the opening",
     """<p class="soon"><span lang="en">Coming soon to the App Store</span><span lang="fr">Bientôt sur l’App Store</span><span lang="es">Próximamente en el App Store</span></p>""", 1,
     button(12)),
    ("status band, title",
     """<span lang="en">Plumo is on its way to the App Store.</span><span lang="fr">Plumo arrive bientôt sur l’App Store.</span><span lang="es">Plumo llega pronto al App Store.</span>""", 1,
     """<span lang="en">Plumo is on the App Store.</span><span lang="fr">Plumo est sur l’App Store.</span><span lang="es">Plumo ya está en el App Store.</span>"""),
    ("status band, text",
     """            <p lang="en">It isn’t available yet. When it is, this page will link to it.</p>
            <p lang="fr">L’app n’est pas encore disponible. Dès qu’elle le sera, cette page renverra vers elle.</p>
            <p lang="es">La app aún no está disponible. Cuando lo esté, esta página enlazará a ella.</p>
""", 1,
     """            <p lang="en">Free to download, for iPhone with iOS 18 or later.</p>
            <p lang="fr">Gratuite à télécharger, pour iPhone avec iOS&nbsp;18 ou ultérieur.</p>
            <p lang="es">Gratis para descargar, para iPhone con iOS 18 o posterior.</p>
"""),
    ("status band, button",
     """<p class="soon"><span lang="en">Coming soon</span><span lang="fr">Bientôt</span><span lang="es">Próximamente</span></p>""", 1,
     button(10)),
    ("FAQ, question",
     """<span lang="en">When can I download it?</span><span lang="fr">Quand pourrai-je la télécharger&nbsp;?</span><span lang="es">¿Cuándo podré descargarla?</span>""", 1,
     """<span lang="en">Where can I download it?</span><span lang="fr">Où la télécharger&nbsp;?</span><span lang="es">¿Dónde puedo descargarla?</span>"""),
    ("FAQ, answer (English)",
     """<p lang="en">Plumo is not on the App Store yet. This page will link to it as soon as it is out.</p>""", 1,
     f"""<p lang="en">On the App Store: <a href="{URL}">Plumo on the App Store</a>. It needs an iPhone with iOS 18 or later.</p>"""),
    ("FAQ, answer (French)",
     """<p lang="fr">Plumo n’est pas encore sur l’App Store. Cette page renverra vers lui dès sa sortie.</p>""", 1,
     f"""<p lang="fr">Sur l’App Store&nbsp;: <a href="{URL}">Plumo sur l’App Store</a>. Il faut un iPhone avec iOS&nbsp;18 ou ultérieur.</p>"""),
    ("FAQ, answer (Spanish)",
     """<p lang="es">Plumo aún no está en el App Store. Esta página enlazará a él en cuanto salga.</p>""", 1,
     f"""<p lang="es">En el App Store: <a href="{URL}">Plumo en el App Store</a>. Necesita un iPhone con iOS 18 o posterior.</p>"""),
]

root = pathlib.Path(__file__).resolve().parent.parent
page = root / "index.html"
text = page.read_text(encoding="utf-8")

missed = [name for name, old, count, _ in EDITS if text.count(old) != count]
if missed:
    sys.exit("Nothing written. These parts of index.html no longer match:\n- " + "\n- ".join(missed))

for _, old, _, new in EDITS:
    text = text.replace(old, new)
page.write_text(text, encoding="utf-8")
print(f"index.html switched to {URL} (app id {APP_ID}). Preview it, update the README status line, commit and push.")
