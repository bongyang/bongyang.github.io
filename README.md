# Dr Yang Bong — personal academic website

A single-page site built with plain HTML, CSS and a little JavaScript. There is
no build step. It is designed to be published with GitHub Pages at
<https://bongyang.github.io>.

## What is where

| File | What it is |
| --- | --- |
| `content.json` | **All the text on the site**: bio, research themes, impact, teaching, service, links, contact. |
| `publications.bib` | The source of truth for publications. |
| `publications.json` | Generated from the `.bib`. Do not edit by hand. |
| `scripts/bib_to_json.py` | Regenerates `publications.json` from `publications.bib`. |
| `index.html`, `research.html`, `publications.html`, `impact.html`, `teaching.html`, `citizenship.html` | One page each (home plus five sections). Generated: do not edit by hand. |
| `scripts/make_pages.py`, `scripts/page.template.html` | Rebuild the six page files: `python3 scripts/make_pages.py`. |
| `assets/css/style.css` | All styling. Colours and fonts are set at the top. |
| `assets/js/main.js` | Reads the two JSON files and builds the page. |
| `assets/fonts/`, `assets/img/` | Self-hosted fonts, favicon, sharing image, headshot. |

## Preview the site on your computer

The page loads its text from `content.json`, so opening `index.html` by
double-clicking will not work. Instead, in a terminal in this folder:

```
python3 -m http.server
```

Then open <http://localhost:8000>.

## Add a publication

1. Add the entry to `publications.bib` (copy an existing entry as a pattern).
   Include a `doi` if there is one.
2. Run `python3 scripts/bib_to_json.py`.
3. Commit both `publications.bib` and `publications.json`.

The entry type decides the group: `@article` goes under Journal articles,
`@inproceedings` under Conference papers, `@phdthesis` under Doctoral thesis,
anything else under Reports & book chapters. Entries are sorted newest first.

To show the new paper under a research theme, add its key (the word after
`@article{`) to that theme's `publications` list in `content.json`.

## Edit the bio or any other text

Open `content.json` and change the text. The short bio is `hero.bio`; the
longer one is `about.paragraphs`. To put a link inside text, write
`[link text](https://example.org)`.

Each section page's short description is `pages.<section>.teaser`; its photo is
`pages.<section>.image`. The home-page cover photo, tagline and featured
project are under `home`. After changing a teaser or photo, run
`python3 scripts/make_pages.py` so the page titles and link previews match.
Each section page's description for Google and link previews is
`pages.<section>.description` (falls back to the teaser). The home-page
description lives in `scripts/make_pages.py`.

## Change the photo

1. Crop the photo to a 4:5 portrait, about 800 × 1000 pixels.
2. Save two copies, each under 200 KB: `assets/img/headshot.webp` and
   `assets/img/headshot.jpg`. [Squoosh](https://squoosh.app) does this in the
   browser.
3. In `content.json`, set:

   ```
   "photo": {
     "webp": "assets/img/headshot.webp",
     "jpg": "assets/img/headshot.jpg",
     "alt": "Portrait of Dr Yang Bong"
   }
   ```

While both paths are empty, the site shows a green "YB" monogram instead.


## Photos

Photos are listed in `content.json`:

- **Gallery** (`gallery.items`): the photo grid on the home page. Each item has
  `src` (path without the size and extension), `widths`, `width`/`height` (the
  original's size), `position` (which part to keep in view when a tile crops
  the photo, e.g. `50% 30%` keeps the upper part), `caption`, `place`, `date`,
  `alt`, an optional `credit`, and an optional `size`: `"lg"` (big square) or
  `"wide"`. Places in the strip above the grid come from `place`.
- **Page photos** (`pages.<section>.image`) and the **cover** (`home.heroImage`;
  `positionMobile` sets the crop on phones).
- **Field photos** (`impact.project.photos`): the Long Semadoh photos on the
  Impact page.

To add a photo:

1. For a good original (camera or event photographer), run
   `python3 scripts/enhance_photos.py --light assets/img/banner photo.jpg 2027-some-event --sizes 800,1600,2400`.
   It only resizes (never crops or recolours), skips widths bigger than the
   original, and writes `.webp` and `.jpg` versions.
   For a small or re-compressed copy (e.g. saved from LinkedIn), leave out
   `--light`: it then also cleans up compression artefacts.
   On a computer without Python, make those files with e.g.
   [Squoosh](https://squoosh.app), keeping the same names.
2. Add an entry to `gallery.items` with a short `alt` describing the picture.

## Connect a custom domain later (e.g. yangbong.com)

1. Buy the domain from a registrar.
2. In the registrar's DNS settings add a `CNAME` record for `www` pointing to
   `bongyang.github.io`, and four `A` records for the bare domain pointing to
   GitHub Pages' addresses (listed in GitHub's "Managing a custom domain"
   guide).
3. On GitHub, go to the repository's Settings → Pages, enter the domain under
   "Custom domain", and tick "Enforce HTTPS" once it becomes available.
4. In `scripts/make_pages.py` and `scripts/page.template.html`, replace
   `https://bongyang.github.io` with the new address, then run
   `python3 scripts/make_pages.py`.

## The impact map and timeline

The Long Semadoh project in the Impact section is set in `content.json` under
`impact.project` (story, tagline, outputs, timeline) and `impact.map` (places).

- **Add a place to the map:** add an entry to `impact.map.places` with a
  `lon` and `lat` (decimal degrees, e.g. from Wikipedia), a `label`, a short
  `note`, and `labelSide` (`left` or `right`, whichever avoids overlaps).
- **Link a timeline entry to a place:** give the entry a `place` that matches
  the place's `id`. Hovering the entry then highlights that place on the map.
- **What the map shows:** `impact.map.bounds` is the area shown
  (`[west, south, east, north]`; `boundsMobile` for phones).
  `impact.map.labels` are the country, sea and state names, each with a
  `lon`/`lat` for where the text sits.
- **Redraw the base map** (only if `impact.map.projection` changes):

  ```
  npm i world-atlas@2 topojson-client
  node scripts/make_map.mjs ./node_modules
  ```

## Citations and search engines

Each publication has a **Cite** panel with an APA reference and the original
BibTeX entry, both copyable. The full `.bib` file can be downloaded from the
Publications section. The page also includes schema.org structured data (built
automatically from the JSON files) so search engines can read your profile and
publication list.

## Fonts

Newsreader (headings) and Instrument Sans (body) are self-hosted from
`assets/fonts/` under the SIL Open Font License; the licence files sit beside
them. Nothing is loaded from an external CDN.
