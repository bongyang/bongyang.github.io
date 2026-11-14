# Handover for AI sessions

Personal academic site for Dr Yang Bong. Single page, plain HTML/CSS/vanilla
JS, no build step, hosted on GitHub Pages (user site `yg21-uon.github.io`).

## Hard rules

- **Never invent publications, roles, numbers, dates or claims.** The CV and
  `publications.bib` are the source of truth. If something is missing, add a
  marked TODO to the `todos` array in `content.json` and tell the user.
- **Never publish the phone number.** Contact is email only.
- Use DOIs exactly as given in the `.bib`.
- Do not push to `main` or change GitHub Pages settings unless asked. Review
  work goes on the `preview` branch; the owner merges.
- First person, warm and confident, British English. "Indigenous" is
  capitalised.

## Structure

- `content.json` — all visible text. `todos` is never rendered.
  Inline links use `[label](https://url)` (see `rich()` in `main.js`).
- `publications.bib` → `python3 scripts/bib_to_json.py` → `publications.json`.
  Never hand-edit the JSON. Commit both. Groups: `article` → journal,
  `inproceedings` → conference, everything else → report.
- `index.html` — empty `<section>` shells with ids matching `content.json`
  `nav[].id`; static `<head>` meta/Open Graph (the one place text is
  duplicated, keep in step with `hero.bio`).
- `assets/js/main.js` — fetches both JSON files, renders each section, runs the
  nav scroll-spy. No dependencies. Escape everything with `esc()`.
- `assets/css/style.css` — mobile-first; one breakpoint at 48rem (two-column
  layout with sticky section labels), a small one at 64rem.
- Research themes link to publications by BibTeX key
  (`research.themes[].publications`), rendered as `#pub-<key>` anchors.
- Headshot: `hero.photo.webp` / `.jpg`; empty means the monogram placeholder.
- Icons are inline SVG in `main.js`, keyed by `links[].id`.

## Design tokens (`:root` in style.css)

- Paper `#FBF9F4`, deep paper `#F3F0E7`, ink `#1B2420`, muted `#56615B`,
  rule `#DDD8CB`.
- One accent: forest green `#1E4D3B` (soft tint `#E7EDE6`). Do not add a
  second accent colour.
- Headings: Newsreader (variable, self-hosted). Body: Instrument Sans
  (variable, self-hosted). No external CDNs.
- Light mode only. Borneo nod: the thin woven-diamond band (`.motif`) and the
  green; keep it quiet.
- Small uppercase letter-spaced labels in green or muted; hairline rules;
  generous whitespace; corners 2px, pills for chips only.

## Checking changes

Serve with `python3 -m http.server` and check at 390px and 1280px: no console
errors, no horizontal scroll, all `#` anchors resolve.
