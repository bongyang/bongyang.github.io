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
| `index.html` | Page skeleton, plus the title and social-sharing tags. |
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
`@inproceedings` under Conference papers, anything else under Reports & book
chapters. Entries are sorted newest first.

To show the new paper under a research theme, add its key (the word after
`@article{`) to that theme's `publications` list in `content.json`.

## Edit the bio or any other text

Open `content.json` and change the text. The short bio is `hero.bio`; the
longer one is `about.paragraphs`. To put a link inside text, write
`[link text](https://example.org)`.

If you change the short bio, also update the `description` and
`og:description` lines near the top of `index.html`. Those are what Google and
link previews show.

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
If you rename the photo, also update the `preload` line for it near the top
of `index.html`.

## Photos in the About slideshow

The slideshow beside the About text reads `gallery.items` in `content.json`
(newest first). Each item has `src` (path without the extension), `width`,
`height`, `caption`, `date`, `alt` and an optional `credit`.

To add a photo:

1. Run `python3 scripts/enhance_photos.py photo.jpg 2027-some-event`. It lightly
   cleans up compression artefacts and sharpens, without cropping or
   recolouring, and writes `assets/img/gallery/2027-some-event.webp` and `.jpg`.
   On a computer without Python, save a `.webp` and a `.jpg` copy yourself
   (e.g. with [Squoosh](https://squoosh.app)), each ideally under 200 KB.
2. Add an entry to `gallery.items` with the photo's pixel width and height and a
   short `alt` describing what is in the picture.

To remove one, delete its entry (and its two files). The slideshow plays on its
own, pauses on hover and has a pause button; visitors who ask their system for
reduced motion get it paused.

## Connect a custom domain later (e.g. yangbong.com)

1. Buy the domain from a registrar.
2. In the registrar's DNS settings add a `CNAME` record for `www` pointing to
   `bongyang.github.io`, and four `A` records for the bare domain pointing to
   GitHub Pages' addresses (listed in GitHub's "Managing a custom domain"
   guide).
3. On GitHub, go to the repository's Settings → Pages, enter the domain under
   "Custom domain", and tick "Enforce HTTPS" once it becomes available.
4. In `index.html`, replace `https://bongyang.github.io` with the new address
   in the `canonical`, `og:url` and `og:image` lines.

## The impact map and timeline

The Long Semadoh project in the Impact section is set in `content.json` under
`impact.project` (story, tagline, outputs, timeline) and `impact.map` (places).

- **Add a place to the map:** add an entry to `impact.map.places` with a
  `lon` and `lat` (decimal degrees, e.g. from Wikipedia), a `label`, a short
  `note`, and `labelSide` (`left` or `right`, whichever avoids overlaps).
- **Link a timeline entry to a place:** give the entry a `place` that matches
  the place's `id`. Hovering the entry then highlights that place on the map.
- **Change what the map covers:** edit `impact.map.bounds`
  (`[west, south, east, north]`), keep `impact.map.size` in the same
  proportion, then redraw the base map:

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
