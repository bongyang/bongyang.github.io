"""Writes the HTML shell for each page from one template.
Run after changing page titles/teasers: python3 scripts/make_pages.py
The <head> text is the only text outside content.json (search engines and
social previews read it before any script runs)."""
import json, html, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
c = json.loads((root / 'content.json').read_text(encoding='utf-8'))
SITE = 'https://bongyang.github.io/'
NAME = c['hero']['name']
home_desc = ('Dr Yang Bong is a Senior Lecturer at Birmingham Newman University researching digital inclusion, '
             'rural and Indigenous entrepreneurship, subsistence marketplaces, platform economies and AI for sustainable development.')
pages = [('home', 'index.html', f"{NAME} · Senior Lecturer, Birmingham Newman University", home_desc, c['home']['heroImage'])]
for n in c['nav']:
    if n['id'] in c['pages']:
        pages.append((n['id'], n['href'], f"{c[n['id']]['heading']} · {NAME}", c['pages'][n['id']]['teaser'], c['pages'][n['id']]['image']))

def preload(im):
    if im.get('widths'):
        ss = ', '.join(f"{im['src']}-{w}.webp {w}w" for w in im['widths'])
        return f'<link rel="preload" as="image" type="image/webp" imagesrcset="{ss}" imagesizes="{"100vw" if pages[0][4] is im else "(min-width: 48rem) 45vw, 100vw"}" fetchpriority="high">'
    return f'<link rel="preload" as="image" type="image/webp" href="{im["src"]}.webp" fetchpriority="high">'

T = open(root / 'scripts' / 'page.template.html', encoding='utf-8').read()
for pid, file, title, desc, im in pages:
    url = SITE + ('' if file == 'index.html' else file)
    out = (T.replace('{{TITLE}}', html.escape(title)).replace('{{DESC}}', html.escape(desc))
            .replace('{{URL}}', url).replace('{{PAGE}}', pid).replace('{{PRELOAD}}', preload(im))
            .replace('{{OGTYPE}}', 'profile' if pid == 'home' else 'website'))
    (root / file).write_text(out, encoding='utf-8')
    print('wrote', file)
