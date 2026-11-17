/* Dr Yang Bong — personal site.
   Reads content.json and publications.json and renders the page named in
   <body data-page>: home, research, publications, impact, teaching or service.
   No dependencies, no build step. Text never lives in this file. */
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var isExternal = function (url) { return /^https?:\/\//.test(url); };
  var link = function (url, html, cls) {
    return '<a' + (cls ? ' class="' + cls + '"' : '') + ' href="' + esc(url) + '"' +
      (isExternal(url) ? ' rel="noopener"' : '') + '>' + html + '</a>';
  };
  /* Escapes text, then turns [label](https://url) into a link. */
  var rich = function (s) {
    return esc(s).replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, function (_, label, url) {
      return '<a href="' + url + '" rel="noopener">' + label + '</a>';
    });
  };
  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  /* Icons for the link row, keyed by links[].id in content.json. */
  var ICONS = {
    scholar: '<path d="M12 4 2 9.5l10 5.5 10-5.5L12 4Z"/><path d="M6.5 12.2V16c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-3.8"/><path d="M22 9.5V15"/>',
    researchgate: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 16V8.5h2.2a2 2 0 0 1 0 4H8m2.2 0L12 16"/><path d="M17 11.8h-1.6m1.6 0v1.4a1.9 1.9 0 0 1-3.6-.9v-1.9a1.9 1.9 0 0 1 3.5-.9"/>',
    linkedin: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 10.5V16M8 7.9v.1M11.5 16v-5.5m0 2.4c0-1.4 1-2.4 2.3-2.4s2.2 1 2.2 2.4V16"/>',
    orcid: '<circle cx="12" cy="12" r="8.5"/><path d="M8.6 10.2V16M8.6 7.9v.1M11.6 16V9.9h1.9a3 3 0 0 1 0 6.1h-1.9Z"/>',
    staff: '<path d="M4 20V9l8-5 8 5v11"/><path d="M2.5 20h19M9.5 20v-5h5v5M9 11h.01M15 11h.01"/>',
    ae4ai: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5s-1.200 6.100-3.800 8.500c-2.600-2.400-3.800-5.200-3.800-8.500S9.400 5.900 12 3.500Z"/>',
    email: '<rect x="3" y="5.500" width="18" height="13" rx="2"/><path d="m3.500 7.500 8.500 6 8.500-6"/>',
    arrow: '<path d="M7 17 17 7M9 7h8v8"/>'
  };
  var icon = function (id) {
    return '<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.500" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      (ICONS[id] || ICONS.arrow) + '</svg>';
  };

  var sectionHead = function (n, id, heading) {
    return '<header class="section__head"><p class="section__no" aria-hidden="true">' + pad(n) +
      '</p><h2 id="' + id + '-h">' + esc(heading) + '</h2></header>';
  };

  /* ---------- publications ---------- */
  var authorsHtml = function (authors, me) {
    var names = authors.map(function (a) {
      var name = esc((a.given + ' ' + a.family).trim());
      var mine = me && a.family === me.family && a.given.indexOf(me.given) === 0;
      return mine ? '<strong>' + name + '</strong>' : name;
    });
    if (names.length < 2) return names.join('');
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  };
  var venueHtml = function (p) {
    var out = '<cite>' + esc(p.venue) + '</cite>';
    if (p.volume) out += ', ' + esc(p.volume) + (p.number ? '(' + esc(p.number) + ')' : '');
    if (p.pages) out += ', ' + (p.volume ? '' : 'pp. ') + esc(p.pages);
    return out;
  };
  var pubUrl = function (p) { return p.doi ? 'https://doi.org/' + p.doi : p.url; };
  /* Site-hosted files (e.g. assets/papers/*.pdf) as a full address, for citations. */
  var absUrl = function (u) { try { return new URL(u, location.href).href; } catch (e) { return u; } };
  var isPdf = function (u) { return /\.pdf$/i.test(u || ''); };

  /* APA 7th-style reference, built from publications.json. */
  var initials = function (given) {
    return given.split(/\s+/).filter(Boolean).map(function (g) {
      return g.split('-').map(function (h) { return h.charAt(0).toUpperCase() + '.'; }).join('-');
    }).join(' ');
  };
  var apa = function (p) {
    var names = p.authors.map(function (a) { return a.family + ', ' + initials(a.given); });
    var who = names.length < 2 ? names.join('') :
      names.slice(0, -1).join(', ') + ', & ' + names[names.length - 1];
    var out = who + ' (' + p.year + '). ' + p.title.replace(/[.?!]?$/, function (m) { return m || '.'; }) + ' ';
    if (p.group === 'journal') {
      out += p.venue + (p.volume ? ', ' + p.volume + (p.number ? '(' + p.number + ')' : '') : '') +
        (p.pages ? ', ' + p.pages : '') + '.';
    } else if (p.type === 'techreport') {
      out += p.venue + '.';
    } else {
      out += 'In ' + p.venue + (p.pages ? ' (pp. ' + p.pages + ')' : '') + '.' + (p.publisher ? ' ' + p.publisher + '.' : '');
    }
    var url = pubUrl(p);
    return out + (url ? ' ' + absUrl(url) : '');
  };

  var citeHtml = function (p, L) {
    return '<details class="cite"><summary>' + esc(L.cite) + '</summary><div class="cite__panel">' +
      '<div class="cite__row"><p class="cite__label">' + esc(L.apa) + '</p>' +
        '<p class="cite__text">' + esc(apa(p)) + '</p>' +
        '<button type="button" class="copy" data-copy="apa">' + esc(L.copy) + '</button></div>' +
      '<div class="cite__row"><p class="cite__label">' + esc(L.bibtex) + '</p>' +
        '<pre class="cite__bib">' + esc(p.url && !isExternal(p.url) ? p.bibtex.replace(p.url, absUrl(p.url)) : p.bibtex) + '</pre>' +
        '<button type="button" class="copy" data-copy="bib">' + esc(L.copy) + '</button></div>' +
      '</div></details>';
  };

  var pubHtml = function (p, c, themes) {
    var url = pubUrl(p);
    var title = esc(p.title);
    var html = '<li class="pub" id="pub-' + esc(p.key) + '" data-themes="' + esc((themes || []).join(' ')) + '">' +
      '<p class="pub__year">' + esc(p.year || '') + '</p><div class="pub__body">' +
      '<h3 class="pub__title">' + (url ? link(url, title) : title) + '</h3>' +
      '<p class="pub__authors">' + authorsHtml(p.authors, c.publications.highlightAuthor) + '</p>' +
      '<p class="pub__venue">' + venueHtml(p) + '</p>';
    html += '<div class="pub__meta">';
    if (p.doi) {
      html += '<p class="pub__doi"><span>' + esc(c.labels.doi) + '</span> ' +
        link('https://doi.org/' + p.doi, esc(p.doi)) + '</p>';
    }
    if (isPdf(p.url)) {
      html += '<p class="pub__doi"><a href="' + esc(p.url) + '" type="application/pdf">' + esc(c.labels.pdf) + '</a></p>';
    }
    return html + citeHtml(p, c.labels) + '</div></div></li>';
  };

  /* ---------- impact map (equirectangular, matches scripts/make_map.mjs) ---------- */
  var mapHtml = function (m, timeline) {
    var W = m.size[0], H = m.size[1], b = m.bounds;
    var kx = W / (b[2] - b[0]), ky = H / (b[3] - b[1]);
    var marks = m.places.map(function (pl) {
      var x = ((pl.lon - b[0]) * kx).toFixed(1), y = ((b[3] - pl.lat) * ky).toFixed(1);
      var left = pl.labelSide === 'left', dx = left ? -12 : 12, anchor = left ? 'end' : 'start';
      var r = pl.primary ? 7 : 5;
      return '<g class="mark' + (pl.primary ? ' mark--primary' : '') + '" data-place="' + esc(pl.id) + '" transform="translate(' + x + ' ' + y + ')">' +
        (pl.primary ? '<circle class="mark__halo" r="18"/>' : '') +
        '<circle class="mark__dot" r="' + r + '"/>' +
        '<text class="mark__label" x="' + dx + '" y="-1" text-anchor="' + anchor + '">' + esc(pl.label) + '</text>' +
        '<text class="mark__note" x="' + dx + '" y="1.15em" text-anchor="' + anchor + '">' + esc(pl.note) + '</text></g>';
    }).join('');
    return '<figure class="map"><div class="map__frame" role="img" aria-label="' + esc(m.alt) + '">' +
      '<img src="assets/img/map-region.svg" alt="" width="' + W + '" height="' + H + '" decoding="async">' +
      '<svg class="map__marks" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true" focusable="false">' + marks + '</svg></div>' +
      '<figcaption>' + esc(m.caption) + '</figcaption></figure>';
  };

  var projectHtml = function (pr, m) {
    return '<div class="project">' +
      mapHtml(m) +
      '<div class="project__story"><h3>' + esc(pr.heading) + '</h3><p>' + rich(pr.summary) + '</p>' +
        '<blockquote class="tagline"><p>' + esc(pr.quote) + '</p><footer>' + esc(pr.quoteNote) + '</footer></blockquote></div>' +
      '<div class="project__outputs"><p class="label">' + esc(pr.outputsHeading) + '</p><ul class="outputs">' +
        pr.outputs.map(function (o) { return '<li>' + rich(o) + '</li>'; }).join('') + '</ul></div>' +
      (pr.photos && pr.photos.length ? '<div class="field"><p class="label">' + esc(pr.photosHeading) + '</p><ul class="field__list">' +
        pr.photos.map(function (ph) {
          return '<li><figure><picture><source srcset="' + esc(ph.src) + '.webp" type="image/webp">' +
            '<img src="' + esc(ph.src) + '.jpg" alt="' + esc(ph.alt) + '" width="' + ph.width + '" height="' + ph.height + '" loading="lazy" decoding="async"></picture>' +
            '<figcaption>' + esc(ph.caption) + '</figcaption></figure></li>';
        }).join('') + '</ul></div>' : '') +
      '<div class="timeline"><p class="label">' + esc(pr.timelineHeading) + '</p><ol>' +
        pr.timeline.map(function (t) {
          return '<li' + (t.place ? ' data-place="' + esc(t.place) + '" tabindex="0"' : '') + '>' +
            '<p class="timeline__date">' + esc(t.date) + '</p><p>' + rich(t.text) + '</p></li>';
        }).join('') + '</ol></div>' +
    '</div>';
  };

  /* Links timeline entries to map markers on hover and keyboard focus. */
  function linkTimeline() {
    var set = function (id, on) {
      document.querySelectorAll('[data-place="' + id + '"]').forEach(function (el) { el.classList.toggle('is-lit', on); });
    };
    document.querySelectorAll('.timeline li[data-place]').forEach(function (li) {
      var id = li.getAttribute('data-place');
      ['mouseenter', 'focus'].forEach(function (e) { li.addEventListener(e, function () { set(id, true); }); });
      ['mouseleave', 'blur'].forEach(function (e) { li.addEventListener(e, function () { set(id, false); }); });
    });
  }

  /* Theme filter for the publication list. */
  function filterPubs(theme) {
    document.querySelectorAll('.filter button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-theme') === theme));
    });
    var shown = 0;
    document.querySelectorAll('.pubs').forEach(function (list) {
      var visible = 0;
      list.querySelectorAll('.pub').forEach(function (li) {
        var on = !theme || (' ' + li.getAttribute('data-themes') + ' ').indexOf(' ' + theme + ' ') > -1;
        li.hidden = !on; if (on) visible++;
      });
      list.hidden = !visible; list.previousElementSibling.hidden = !visible;
      shown += visible;
    });
    var status = $('pub-status');
    if (status) status.textContent = status.getAttribute('data-template').replace('{n}', shown);
  }

  /* Copy buttons in the citation panels. */
  function wireCopy(L) {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.copy');
      if (!btn) return;
      var row = btn.parentNode;
      var text = (row.querySelector('.cite__text') || row.querySelector('.cite__bib')).textContent;
      var done = function () {
        btn.textContent = L.copied; btn.classList.add('is-done');
        setTimeout(function () { btn.textContent = L.copy; btn.classList.remove('is-done'); }, 1800);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
      } else { fallbackCopy(text); done(); }
    });
  }
  function fallbackCopy(text) {
    var t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } catch (err) { /* nothing more to try */ }
    document.body.removeChild(t);
  }

  /* schema.org structured data so search engines and Google Scholar-style
     indexers can read the profile and publication list. */
  function structuredData(c, pubs) {
    var site = location.origin + location.pathname.replace(/index\.html$/, '');
    var person = {
      '@type': 'Person', '@id': site + '#person', name: 'Yang Bong', honorificPrefix: 'Dr',
      jobTitle: c.hero.role, url: site, email: 'mailto:' + c.contact.email,
      worksFor: { '@type': 'CollegeOrUniversity', name: c.hero.affiliation },
      alumniOf: { '@type': 'CollegeOrUniversity', name: 'University of Nottingham' },
      knowsAbout: c.research.themes.map(function (t) { return t.title; }),
      sameAs: c.links.filter(function (l) { return l.id !== 'ae4ai'; }).map(function (l) { return l.url; })
    };
    if (c.hero.photo && c.hero.photo.jpg) person.image = site + c.hero.photo.jpg;
    var works = pubs.map(function (p) {
      var w = {
        '@type': p.group === 'journal' ? 'ScholarlyArticle' : (p.type === 'incollection' ? 'Chapter' : (p.type === 'techreport' ? 'Report' : 'ScholarlyArticle')),
        headline: p.title, name: p.title, datePublished: String(p.year),
        author: p.authors.map(function (a) {
          return a.family === 'Bong' && a.given.indexOf('Yang') === 0 ? { '@id': site + '#person' } : { '@type': 'Person', name: a.given + ' ' + a.family };
        }),
        isPartOf: { '@type': p.group === 'journal' ? 'Periodical' : 'CreativeWork', name: p.venue }
      };
      if (p.doi) { w.sameAs = 'https://doi.org/' + p.doi; w.identifier = { '@type': 'PropertyValue', propertyID: 'DOI', value: p.doi }; }
      if (isPdf(p.url)) w.url = absUrl(p.url);
      if (p.publisher) w.publisher = { '@type': 'Organization', name: p.publisher };
      return w;
    });
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': [person].concat(works) });
    document.head.appendChild(s);
  }

  /* ---------- full-width photo banner (between About and Research) ----------
     Crossfading slideshow. Images load only when their slide is next up; it
     autoplays unless the visitor prefers reduced motion, pauses on hover,
     focus, when off screen or when the tab is hidden, and has a pause button
     (WCAG 2.2.2). */
  var GI = {
    prev: '<path d="M15 5 8 12l7 7"/>',
    next: '<path d="m9 5 7 7-7 7"/>',
    pause: '<path d="M9 6v12M15 6v12"/>',
    play: '<path d="M8 5.5v13l10.5-6.5L8 5.5Z"/>'
  };
  var gicon = function (k) {
    return '<svg class="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + GI[k] + '</svg>';
  };
  var srcset = function (it, ext) {
    return (it.widths || []).map(function (w) { return esc(it.src) + '-' + w + '.' + ext + ' ' + w + 'w'; }).join(', ');
  };
  function bannerHtml(g) {
    if (!g || !g.items || !g.items.length) return '';
    var n = g.items.length;
    var slides = g.items.map(function (it, i) {
      var meta = [it.date, it.credit].filter(Boolean).map(esc).join(' · ');
      var big = it.widths[it.widths.length - 1];
      return '<li class="banner__slide" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' ' + esc(g.of) + ' ' + n + '">' +
        '<figure><picture>' +
          '<source data-srcset="' + srcset(it, 'webp') + '" sizes="100vw" type="image/webp">' +
          '<img data-srcset="' + srcset(it, 'jpg') + '" data-src="' + esc(it.src) + '-' + big + '.jpg" sizes="100vw" alt="' + esc(it.alt) + '"' +
          ' width="' + it.width + '" height="' + it.height + '" decoding="async" style="--pos:' + esc(it.position || '50% 50%') + '">' +
        '</picture><figcaption class="banner__caption"><span class="banner__text">' + esc(it.caption) + '</span>' +
          (meta ? '<span class="banner__meta">' + meta + '</span>' : '') + '</figcaption></figure></li>';
    }).join('');
    var btn = function (cls, label, ic) {
      return '<button type="button" class="banner__btn ' + cls + '" aria-label="' + esc(label) + '">' + gicon(ic) + '</button>';
    };
    return '<section class="banner" aria-roledescription="carousel" aria-label="' + esc(g.label) + '">' +
      '<ul class="banner__slides" aria-live="off">' + slides + '</ul>' +
      '<div class="banner__bar"><div class="banner__controls">' +
        '<span class="banner__count" aria-hidden="true"><span class="banner__now">1</span> / ' + n + '</span>' +
        btn('banner__toggle', g.pause, 'pause') + btn('banner__prev', g.prev, 'prev') + btn('banner__next', g.next, 'next') +
      '</div></div></section>';
  }
  function banner(g) {
    var root = document.querySelector('.banner');
    if (!root) return;
    var list = root.querySelector('.banner__slides');
    var slides = [].slice.call(root.querySelectorAll('.banner__slide'));
    var toggle = root.querySelector('.banner__toggle');
    var now = root.querySelector('.banner__now');
    var n = slides.length, i = 0, timer = null;
    var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var playing = !reduced && n > 1, hovered = false, focused = false, visible = false;

    var load = function (k) {
      var s = slides[(k + n) % n];
      s.querySelectorAll('[data-srcset]').forEach(function (e) { e.srcset = e.getAttribute('data-srcset'); e.removeAttribute('data-srcset'); });
      s.querySelectorAll('[data-src]').forEach(function (e) { e.src = e.getAttribute('data-src'); e.removeAttribute('data-src'); });
    };
    var show = function (k) {
      i = (k + n) % n;
      slides.forEach(function (s, j) {
        var on = j === i;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        if (on) s.removeAttribute('inert'); else s.setAttribute('inert', '');
      });
      now.textContent = i + 1;
      if (visible) { load(i); load(i + 1); }
    };
    var stop = function () { clearInterval(timer); timer = null; };
    var sync = function () {
      var run = playing && !hovered && !focused && visible && !document.hidden;
      if (run && !timer) timer = setInterval(function () { show(i + 1); }, g.interval || 7000);
      if (!run) stop();
      list.setAttribute('aria-live', playing ? 'off' : 'polite');
    };
    var setPlaying = function (on) {
      playing = on;
      toggle.setAttribute('aria-label', on ? g.pause : g.play);
      toggle.innerHTML = gicon(on ? 'pause' : 'play');
      sync();
    };
    var go = function (d) { show(i + d); stop(); sync(); };

    root.querySelector('.banner__prev').addEventListener('click', function () { go(-1); });
    root.querySelector('.banner__next').addEventListener('click', function () { go(1); });
    toggle.addEventListener('click', function () { setPlaying(!playing); });
    root.addEventListener('mouseenter', function () { hovered = true; sync(); });
    root.addEventListener('mouseleave', function () { hovered = false; sync(); });
    root.addEventListener('focusin', function () { focused = true; sync(); });
    root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) { focused = false; sync(); } });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { go(1); e.preventDefault(); }
    });
    document.addEventListener('visibilitychange', sync);

    /* Swipe on touch screens; vertical scrolling stays with the page. */
    var x0 = null;
    list.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    list.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    });
    list.addEventListener('pointercancel', function () { x0 = null; });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible) { load(i); load(i + 1); }
        sync();
      }, { rootMargin: '300px 0px' }).observe(root);
    } else { visible = true; load(0); load(1); }
    if (n < 2) root.querySelector('.banner__controls').hidden = true;
    show(0);
    setPlaying(playing);
  }

  /* ---------- shared pieces ---------- */
  /* <picture> for a photo object from content.json. With `widths` the files are
     NAME-800/NAME-1600 (.webp + .jpg); without, NAME.webp + NAME.jpg. */
  var pic = function (im, sizes, eager) {
    var webp, jpg, src;
    if (im.widths) {
      webp = srcset(im, 'webp'); jpg = srcset(im, 'jpg');
      src = esc(im.src) + '-' + im.widths[im.widths.length - 1] + '.jpg';
    } else { webp = esc(im.src) + '.webp'; jpg = ''; src = esc(im.src) + '.jpg'; }
    return '<picture><source srcset="' + webp + '"' + (im.widths ? ' sizes="' + sizes + '"' : '') + ' type="image/webp">' +
      '<img src="' + src + '"' + (jpg ? ' srcset="' + jpg + '" sizes="' + sizes + '"' : '') +
      ' alt="' + esc(im.alt) + '" width="' + im.width + '" height="' + im.height + '"' +
      (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async" style="--pos:' + esc(im.position || '50% 50%') + '"></picture>';
  };
  var pages = function (c) { return c.nav.filter(function (n) { return c.pages[n.id]; }); };
  var arrowRow = function (left, right, href) {
    var inner = '<span class="metarow__l">' + esc(left) + '</span><span class="metarow__line" aria-hidden="true"></span>' +
      '<span class="metarow__r">' + esc(right) + '</span>';
    return href ? '<a class="metarow" href="' + esc(href) + '">' + inner + '</a>' : '<p class="metarow">' + inner + '</p>';
  };
  var linksHtml = function (c) {
    return '<ul class="links">' + c.links.map(function (l) {
      return '<li>' + link(l.url, icon(l.id) + '<span>' + esc(l.label) + '</span>') + '</li>';
    }).join('') + '</ul>';
  };

  /* ---------- section bodies (used on their own pages) ---------- */
  var body = {};
  body.research = function (c, byKey) {
    return '<ol class="themes">' + c.research.themes.map(function (t, i) {
      var rel = t.publications.filter(function (k) { return byKey[k]; }).map(function (k) {
        var p = byKey[k];
        return '<li><a href="publications.html#pub-' + esc(k) + '">' + esc(p.title) + '</a> <span class="muted">' + esc(p.year) + '</span></li>';
      }).join('');
      return '<li class="theme"><p class="theme__no" aria-hidden="true">' + pad(i + 1) + '</p>' +
        '<div><h2>' + esc(t.title) + '</h2><p>' + rich(t.description) + '</p>' +
        (rel ? '<p class="label">' + esc(c.research.relatedLabel) + '</p><ul class="related">' + rel + '</ul>' : '') +
        '</div></li>';
    }).join('') + '</ol>';
  };
  body.publications = function (c, byKey, pubs) {
    var C = c.publications, themesOf = {};
    c.research.themes.forEach(function (t, i) {
      t.publications.forEach(function (k) { (themesOf[k] = themesOf[k] || []).push('t' + (i + 1)); });
    });
    var filter = '<div class="filter" role="group" aria-label="' + esc(C.filterLabel) + '">' +
      '<button type="button" data-theme="" aria-pressed="true">' + esc(C.filterAll) + '</button>' +
      c.research.themes.map(function (t, i) {
        return '<button type="button" data-theme="t' + (i + 1) + '" aria-pressed="false">' + esc(t.short || t.title) + '</button>';
      }).join('') + '</div>' +
      '<p class="filter__status" id="pub-status" role="status" aria-live="polite" data-template="{n} of ' + pubs.length + ' shown"></p>';
    return '<div class="pubtools">' + filter +
        '<a class="pubtools__bib" href="publications.bib" download>' + esc(C.downloadBib) + '</a></div>' +
      C.groups.map(function (g) {
        var items = pubs.filter(function (p) { return p.group === g.id; });
        if (!items.length) return '';
        return '<h2 class="group">' + esc(g.label) + '</h2><ol class="pubs">' +
          items.map(function (p) { return pubHtml(p, c, themesOf[p.key]); }).join('') + '</ol>';
      }).join('');
  };
  body.impact = function (c) {
    return '<div class="impact">' + c.impact.items.map(function (it, i) {
      return '<article class="impact__item' + (i === 0 ? ' impact__item--lead' : '') + '">' +
        '<p class="label">' + esc(it.meta) + '</p><h2>' + esc(it.title) + '</h2><p>' + rich(it.text) + '</p>' +
        (it.link && it.link.url ? '<p>' + link(it.link.url, esc(it.link.label) + icon('arrow'), 'more') + '</p>' : '') +
        '</article>' + (i === 0 && c.impact.project ? projectHtml(c.impact.project, c.impact.map) : '');
    }).join('') + '</div>';
  };
  body.teaching = function (c) {
    return '<div class="rows">' + c.teaching.items.map(function (it) {
      return '<div class="row"><h2>' + esc(it.place) + '</h2><div><p>' + rich(it.text) + '</p>' +
        (it.topics && it.topics.length ? '<ul class="tags">' + it.topics.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '') +
        '</div></div>';
    }).join('') + '</div>';
  };
  body.service = function (c) {
    return '<ul class="service">' + c.service.items.map(function (it) {
      var org = esc(it.org) + (it.year ? ' ' + esc(it.year) : '');
      return '<li><span class="service__role">' + esc(it.role) + '</span><span class="service__org">' +
        (it.url ? link(it.url, org) : org) + '</span></li>';
    }).join('') + '</ul>';
  };
  var ledeOf = function (c, id) { return (c[id] && c[id].intro) || c.pages[id].teaser; };

  /* ---------- home ---------- */
  function renderHome(c, pubs) {
    var h = c.hero, H = c.home, ph = h.photo || {};
    var cards = pages(c).map(function (n, i) {
      var pg = c.pages[n.id];
      return '<li class="card' + (i === 0 ? ' card--wide' : '') + '"><a href="' + esc(n.href) + '">' +
        '<div class="card__img">' + pic(pg.image, i === 0 ? '(min-width: 64rem) 66vw, 100vw' : '(min-width: 64rem) 33vw, (min-width: 48rem) 50vw, 100vw') + '</div>' +
        '<div class="card__text"><p class="card__no" aria-hidden="true">' + pad(i + 1) + '</p>' +
        '<h3>' + esc(n.label) + '</h3><p>' + esc(pg.teaser) + '</p></div>' +
        '<span class="card__go" aria-hidden="true">' + icon('arrow') + '</span></a></li>';
    }).join('');
    var recent = pubs.slice().sort(function (a, b) { return (b.year || 0) - (a.year || 0); }).slice(0, 3);
    var f = H.feature;
    return '<section class="cover" aria-labelledby="hero-name">' +
        '<div class="cover__img">' + pic(H.heroImage, '100vw', true) + '</div>' +
        '<div class="cover__inner wrap">' +
          '<h1 id="hero-name" class="cover__name"><span>' + esc(h.name.replace(/\s\S+$/, '')) + '</span> <span>' + esc(h.name.replace(/^.*\s/, '')) + '</span></h1>' +
          '<p class="cover__role">' + esc(h.role) + ' · ' + esc(h.affiliation) + '</p>' +
          '<p class="cover__tag">' + esc(H.tagline) + '</p>' +
        '</div></section>' +

      '<section class="intro wrap" aria-labelledby="intro-h">' +
        '<p class="eyebrow">' + esc(c.about.heading) + ' · ' + esc(h.credentials) + '</p>' +
        '<h2 id="intro-h" class="display">' + esc(H.statement) + '</h2>' +
        '<div class="intro__cols"><figure class="intro__photo"><picture>' +
          (ph.webp ? '<source srcset="' + esc(ph.webp) + '" type="image/webp">' : '') +
          '<img src="' + esc(ph.jpg) + '" alt="' + esc(ph.alt) + '" width="640" height="800" loading="lazy" decoding="async"></picture></figure>' +
          '<div class="intro__text"><p>' + rich(h.bio) + '</p>' + c.about.paragraphs.map(function (p) { return '<p>' + rich(p) + '</p>'; }).join('') +
          linksHtml(c) + '</div></div>' +
      '</section>' +

      '<section class="explore wrap" aria-labelledby="explore-h">' +
        '<div class="bandhead"><h2 id="explore-h" class="display">' + esc(H.explore) + '</h2></div>' +
        '<ul class="cards">' + cards + '</ul></section>' +

      '<section class="band band--dark" aria-labelledby="feature-h"><div class="wrap">' +
        '<div class="feature"><div><p class="eyebrow">' + esc(f.label) + '</p><h2 id="feature-h" class="display">' + esc(f.heading) + '</h2></div>' +
        '<ul class="feature__points">' + f.points.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></div>' +
        '</div>' + '<div class="band__rule">' + '<div class="wrap">' + arrowRow(f.meta, f.metaEnd, f.link) + '</div></div></section>' +

      '<section class="gallery" aria-labelledby="gallery-h"><div class="wrap"><div class="bandhead"><h2 id="gallery-h" class="display">' + esc(H.galleryHeading) + '</h2></div></div>' +
        '<div id="banner"></div></section>' +

      '<section class="recent wrap" aria-labelledby="recent-h"><div class="bandhead"><h2 id="recent-h" class="display">' + esc(H.recentHeading) + '</h2>' +
        '<a class="more" href="publications.html">' + esc(H.allPubs) + icon('arrow') + '</a></div>' +
        '<ol class="recent__list">' + recent.map(function (p) {
          return '<li><p class="pub__year">' + esc(p.year) + '</p><div><h3 class="pub__title"><a href="publications.html#pub-' + esc(p.key) + '">' + esc(p.title) + '</a></h3>' +
            '<p class="pub__venue">' + venueHtml(p) + '</p></div></li>';
        }).join('') + '</ol></section>';
  }

  /* ---------- inner pages ---------- */
  function renderPage(c, id, byKey, pubs) {
    var list = pages(c), i = 0;
    list.forEach(function (n, k) { if (n.id === id) i = k; });
    var me = list[i], next = list[(i + 1) % list.length], pg = c.pages[id];
    return '<header class="phero wrap">' +
        '<div class="phero__text"><p class="eyebrow">' + pad(i + 1) + ' / ' + pad(list.length) + '</p>' +
          '<h1 class="phero__title">' + esc(c[id].heading) + '</h1>' +
          '<p class="lede">' + rich(ledeOf(c, id)) + '</p></div>' +
        '<figure class="phero__img">' + pic(pg.image, '(min-width: 48rem) 45vw, 100vw', true) +
          '<figcaption>' + esc(pg.image.caption) + '</figcaption></figure>' +
      '</header>' +
      '<div class="motif" aria-hidden="true"></div>' +
      '<div class="page wrap page--' + esc(id) + '">' + body[id](c, byKey, pubs) + '</div>' +
      '<nav class="next" aria-label="' + esc(c.labels.next) + '"><div class="wrap">' +
        '<a href="' + esc(next.href) + '"><span class="eyebrow">' + esc(c.labels.next) + '</span>' +
        '<span class="next__title">' + esc(next.label) + '</span>' +
        '<span class="next__teaser">' + esc(c.pages[next.id].teaser) + '</span></a></div></nav>';
  }

  /* ---------- render ---------- */
  function render(c, pubs) {
    var page = document.body.getAttribute('data-page') || 'home';
    var byKey = {};
    pubs.forEach(function (p) { byKey[p.key] = p; });

    /* Old one-page links (/#research) go to the new pages. */
    if (page === 'home' && location.hash) {
      var old = c.nav.filter(function (n) { return '#' + n.id === location.hash && /\.html$/.test(n.href); })[0];
      if (old) { location.replace(old.href); return; }
    }

    document.querySelectorAll('[data-text]').forEach(function (el) {
      var v = el.getAttribute('data-text').split('.').reduce(function (o, k) { return o && o[k]; }, c);
      if (v) el.textContent = v;
    });

    $('nav').innerHTML = c.nav.map(function (n) {
      var cur = n.id === page;
      return '<li' + (n.id === 'contact' ? ' class="nav__contact"' : '') + '><a href="' + esc(n.href) + '"' +
        (cur ? ' class="is-active" aria-current="page"' : '') + '>' + esc(n.label) + '</a></li>';
    }).join('');

    $('page').innerHTML = page === 'home' ? renderHome(c, pubs) : renderPage(c, page, byKey, pubs);

    var ct = c.contact;
    $('contact').innerHTML = '<div class="wrap contact">' +
      '<div><p class="eyebrow">' + esc(ct.heading) + '</p><h2 id="contact-h" class="display">' + rich(ct.text) + '</h2></div>' +
      '<div class="contact__side"><p class="contact__email">' + link('mailto:' + ct.email, esc(ct.email)) + '</p>' +
      '<address>' + ct.address.map(esc).join('<br>') + '</address>' + linksHtml(c) + '</div></div>';

    $('footer').innerHTML = '<p>' + esc(c.footer.text) + ' ' + new Date().getFullYear() + '</p>' +
      '<p><a href="#top">' + esc(c.footer.backToTop) + '</a></p>';

    if (page === 'home') {
      $('banner').innerHTML = bannerHtml(c.banner);
      banner(c.banner);
      overCover();
    }
    if (page === 'publications') {
      document.querySelectorAll('.filter button').forEach(function (b) {
        b.addEventListener('click', function () { filterPubs(b.getAttribute('data-theme')); });
      });
      filterPubs('');
      wireCopy(c.labels);
    }
    if (page === 'impact') linkTimeline();
    if (page === 'home' || page === 'publications') structuredData(c, page === 'publications' ? pubs : []);
    if (location.hash) {
      var target = document.querySelector(location.hash);
      if (target) target.scrollIntoView();
    }
  }

  /* On the home page the masthead sits over the cover photo until it scrolls past. */
  function overCover() {
    var m = document.querySelector('.masthead'), cover = document.querySelector('.cover');
    if (!m || !cover || !('IntersectionObserver' in window)) return;
    m.classList.add('is-over');
    new IntersectionObserver(function (en) {
      m.classList.toggle('is-over', en[0].isIntersecting);
    }, { rootMargin: '-64px 0px 0px 0px', threshold: 0 }).observe(cover.querySelector('.cover__inner'));
  }

  var getJson = function (url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + ' ' + r.status);
      return r.json();
    });
  };
  Promise.all([getJson('content.json'), getJson('publications.json')])
    .then(function (d) { render(d[0], d[1]); document.documentElement.classList.add('is-ready'); })
    .catch(function (err) {
      console.error(err);
      document.documentElement.classList.add('is-ready');
      $('page').innerHTML = '<p class="lede wrap">Sorry, the content failed to load. If you are viewing the file directly, serve the folder instead: python3 -m http.server</p>';
    });
})();
