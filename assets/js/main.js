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

  /* ---------- impact map: zoomable world map ----------
     Base map: assets/img/map-world.svg (made by scripts/make_map.mjs), loaded
     inline so it stays sharp at every zoom. Markers and labels are HTML laid
     over it with the same equirectangular projection, so they keep their size.
     Views: preset buttons, +/- buttons, drag, pinch, Ctrl/⌘ + scroll,
     double-click, and the keyboard (+, -, arrows) when the map has focus. */
  var mapHtml = function (m) {
    var C = m.controls;
    var places = m.places.map(function (pl) {
      return '<div class="mk' + (pl.primary ? ' mk--primary' : '') + (pl.home ? ' mk--home' : '') + (pl.labelSide === 'left' ? ' mk--left' : '') +
        '" data-place="' + esc(pl.id) + '"><span class="mk__dot"></span><span class="mk__text"><span class="mk__label">' + esc(pl.label) + '</span>' +
        '<span class="mk__note">' + esc(pl.note) + '</span></span></div>';
    }).join('');
    var labels = m.labels.map(function (l, i) {
      return '<span class="gl gl--' + esc(l.kind || 'country') + '" data-label="' + i + '">' + esc(l.text) + '</span>';
    }).join('');
    var btn = function (cls, label, txt) { return '<button type="button" class="map__btn ' + cls + '" aria-label="' + esc(label) + '">' + txt + '</button>'; };
    return '<figure class="map"><div class="map__frame" tabindex="0" role="region" aria-label="' + esc(m.alt) + '">' +
        '<div class="map__svg" aria-hidden="true"></div>' +
        '<div class="map__layer" aria-hidden="true">' + labels + places + '</div>' +
        '<div class="map__zoom">' + btn('map__in', C.zoomIn, '+') + btn('map__out', C.zoomOut, '−') + '</div>' +
        '<div class="map__views" role="group" aria-label="' + esc(C.views) + '">' + m.views.map(function (v) {
          return '<button type="button" data-view="' + esc(v.id) + '" aria-pressed="false">' + esc(v.label) + '</button>';
        }).join('') + '</div>' +
      '</div><figcaption>' + esc(m.caption) + ' <span class="map__hint">' + esc(C.hint) + '</span></figcaption></figure>';
  };

  function initMap(m) {
    var frame = document.querySelector('.map__frame');
    if (!frame) return;
    var P = m.projection, MW = 360 * P.scale, MH = (P.lat1 - P.latMin) * P.scale;
    var proj = function (lon, lat) { return [(lon - P.lon0) * P.scale, (P.lat1 - lat) * P.scale]; };
    var byId = {}; m.places.forEach(function (pl) { byId[pl.id] = pl; });
    var marks = [].slice.call(frame.querySelectorAll('.mk')), labels = [].slice.call(frame.querySelectorAll('.gl'));
    var svg = null, cam = { x: 0, y: 0, z: 1 }, W = 0, H = 0, zMin = 0.1, zMax = 10, anim = null;
    var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    var fit = function (b) {
      var p0 = proj(b[0], b[3]), p1 = proj(b[2], b[1]);
      return { x: (p0[0] + p1[0]) / 2, y: (p0[1] + p1[1]) / 2, z: Math.min(W / (p1[0] - p0[0]), H / (p1[1] - p0[1])) };
    };
    var clamp = function (c) {
      var z = Math.max(zMin, Math.min(zMax, c.z)), hw = W / z / 2, hh = H / z / 2;
      var x = hw * 2 >= MW ? MW / 2 : Math.max(hw, Math.min(MW - hw, c.x));
      var y = hh * 2 >= MH ? MH / 2 : Math.max(hh, Math.min(MH - hh, c.y));
      return { x: x, y: y, z: z };
    };
    var draw = function () {
      var vx = cam.x - W / cam.z / 2, vy = cam.y - H / cam.z / 2;
      if (svg) svg.setAttribute('viewBox', vx.toFixed(2) + ' ' + vy.toFixed(2) + ' ' + (W / cam.z).toFixed(2) + ' ' + (H / cam.z).toFixed(2));
      var span = W / cam.z / P.scale;
      var at = function (el, lon, lat) {
        var p = proj(lon, lat), x = (p[0] - vx) * cam.z, y = (p[1] - vy) * cam.z;
        el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
        return x > -40 && x < W + 40 && y > -40 && y < H + 40;
      };
      labels.forEach(function (el) {
        var l = m.labels[+el.getAttribute('data-label')];
        var on = span >= (l.minSpan || 0) && span < (l.maxSpan || 1e9);
        el.hidden = !(at(el, l.lon, l.lat) && on);
      });
      marks.forEach(function (el) {
        var pl = byId[el.getAttribute('data-place')];
        var on = pl.home ? span >= 40 : (pl.primary || span < 35);
        el.hidden = !(at(el, pl.lon, pl.lat) && on);
        if (pl.labelWide) el.querySelector('.mk__label').textContent = span > 25 ? pl.labelWide : pl.label;
      });
      frame.classList.toggle('is-wide', span >= 40);
      frame.querySelector('.map__in').disabled = cam.z >= zMax - 1e-6;
      frame.querySelector('.map__out').disabled = cam.z <= zMin + 1e-6;
    };
    var setView = function (id) {
      frame.querySelectorAll('.map__views button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === id)); });
    };
    var flyTo = function (t) {
      t = clamp(t);
      cancelAnimationFrame(anim);
      if (reduced) { cam = t; draw(); return; }
      var s = { x: cam.x, y: cam.y, z: cam.z }, t0 = performance.now(), D = 700;
      var step = function (now) {
        var k = Math.min(1, (now - t0) / D), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        var z = Math.exp(Math.log(s.z) + (Math.log(t.z) - Math.log(s.z)) * e);
        cam = { x: s.x + (t.x - s.x) * e, y: s.y + (t.y - s.y) * e, z: z };
        draw();
        if (k < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    };
    /* Zoom by factor f keeping the screen point (px, py) fixed. */
    var zoomAt = function (f, px, py, smooth) {
      var z = Math.max(zMin, Math.min(zMax, cam.z * f));
      var mx = cam.x + (px - W / 2) / cam.z, my = cam.y + (py - H / 2) / cam.z;
      var t = { x: mx - (px - W / 2) / z, y: my - (py - H / 2) / z, z: z };
      setView('');
      if (smooth) flyTo(t); else { cancelAnimationFrame(anim); cam = clamp(t); draw(); }
    };
    var size = function () {
      var r = frame.getBoundingClientRect(), span = W ? W / cam.z : 0;
      W = r.width; H = r.height;
      zMin = Math.max(W / MW, H / MH);
      zMax = fit(m.views[0].bounds).z * 2.5;
      if (span) cam.z = W / span;
      cam = clamp(cam); draw();
    };

    size();
    cam = clamp(fit(m.views[0].bounds)); setView(m.views[0].id); draw();
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(frame);

    fetch('assets/img/map-world.svg').then(function (r) { return r.text(); }).then(function (t) {
      var box = frame.querySelector('.map__svg');
      box.innerHTML = t;
      svg = box.querySelector('svg');
      svg.removeAttribute('width'); svg.removeAttribute('height');
      svg.setAttribute('preserveAspectRatio', 'none');
      var a = proj(byId[m.routeFrom].lon, byId[m.routeFrom].lat), b = proj(byId[m.routeTo].lon, byId[m.routeTo].lat);
      var route = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      route.setAttribute('class', 'route');
      route.setAttribute('d', 'M' + a + 'Q' + ((a[0] + b[0]) / 2) + ',' + (Math.min(a[1], b[1]) - 260) + ' ' + b);
      svg.appendChild(route);
      draw();
    });

    frame.querySelectorAll('.map__views button').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = m.views.filter(function (x) { return x.id === b.getAttribute('data-view'); })[0];
        setView(v.id); flyTo(fit(v.bounds));
      });
    });
    frame.querySelector('.map__in').addEventListener('click', function () { zoomAt(2, W / 2, H / 2, true); });
    frame.querySelector('.map__out').addEventListener('click', function () { zoomAt(0.5, W / 2, H / 2, true); });

    /* Drag with one pointer, pinch with two. */
    var pts = {}, last = null, pinch = null;
    var local = function (e) { var r = frame.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    var layerTarget = function (e) { return !e.target.closest('button'); };
    frame.addEventListener('pointerdown', function (e) {
      if (!layerTarget(e)) return;
      pts[e.pointerId] = local(e); frame.setPointerCapture(e.pointerId);
      cancelAnimationFrame(anim); last = local(e); frame.classList.add('is-dragging');
    });
    frame.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return;
      pts[e.pointerId] = local(e);
      var ids = Object.keys(pts);
      if (ids.length === 2) {
        var p = pts[ids[0]], q = pts[ids[1]], d = Math.hypot(p[0] - q[0], p[1] - q[1]);
        var mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        if (pinch) { zoomAt(d / pinch.d, mid[0], mid[1]); cam = clamp({ x: cam.x - (mid[0] - pinch.m[0]) / cam.z, y: cam.y - (mid[1] - pinch.m[1]) / cam.z, z: cam.z }); draw(); }
        pinch = { d: d, m: mid };
      } else if (last) {
        var c = local(e);
        cam = clamp({ x: cam.x - (c[0] - last[0]) / cam.z, y: cam.y - (c[1] - last[1]) / cam.z, z: cam.z });
        last = c; setView(''); draw();
      }
    });
    var end = function (e) {
      delete pts[e.pointerId]; pinch = null;
      var ids = Object.keys(pts); last = ids.length ? pts[ids[0]] : null;
      if (!ids.length) frame.classList.remove('is-dragging');
    };
    frame.addEventListener('pointerup', end); frame.addEventListener('pointercancel', end);
    frame.addEventListener('dblclick', function (e) { if (layerTarget(e)) { var c = local(e); zoomAt(2, c[0], c[1], true); } });
    /* Plain scrolling keeps scrolling the page; Ctrl/⌘ + scroll (and trackpad pinch) zooms. */
    frame.addEventListener('wheel', function (e) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      var c = local(e); zoomAt(Math.exp(-e.deltaY * 0.01), c[0], c[1]);
    }, { passive: false });
    frame.addEventListener('keydown', function (e) {
      if (e.target !== frame) return;
      var k = e.key, step = 80 / cam.z;
      if (k === '+' || k === '=') zoomAt(2, W / 2, H / 2, true);
      else if (k === '-' || k === '_') zoomAt(0.5, W / 2, H / 2, true);
      else if (/^Arrow/.test(k)) {
        cam = clamp({ x: cam.x + (k === 'ArrowLeft' ? -step : k === 'ArrowRight' ? step : 0), y: cam.y + (k === 'ArrowUp' ? -step : k === 'ArrowDown' ? step : 0), z: cam.z });
        setView(''); draw();
      } else return;
      e.preventDefault();
    });
  }

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

  var srcset = function (it, ext) {
    return (it.widths || []).map(function (w) { return esc(it.src) + '-' + w + '.' + ext + ' ' + w + 'w'; }).join(', ');
  };

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
      (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async" style="--pos:' + esc(im.position || '50% 50%') + (im.positionMobile ? ';--pos-m:' + esc(im.positionMobile) : '') + '"></picture>';
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

      galleryHtml(c.gallery) +

      '<section class="recent wrap" aria-labelledby="recent-h"><div class="bandhead"><h2 id="recent-h" class="display">' + esc(H.recentHeading) + '</h2>' +
        '<a class="more" href="publications.html">' + esc(H.allPubs) + icon('arrow') + '</a></div>' +
        '<ol class="recent__list">' + recent.map(function (p) {
          return '<li><p class="pub__year">' + esc(p.year) + '</p><div><h3 class="pub__title"><a href="publications.html#pub-' + esc(p.key) + '">' + esc(p.title) + '</a></h3>' +
            '<p class="pub__venue">' + venueHtml(p) + '</p></div></li>';
        }).join('') + '</ol></section>';
  }

  /* Photo grid: the breadth of talks, panels and fieldwork at a glance.
     item.size: "lg" (2x2), "wide" (2x1) or nothing (1x1). */
  function galleryHtml(g) {
    var places = [];
    g.items.forEach(function (it) { var p = it.place.split(',')[0]; if (places.indexOf(p) < 0) places.push(p); });
    return '<section class="gallery wrap" aria-labelledby="gallery-h"><div class="bandhead"><h2 id="gallery-h" class="display">' + esc(g.heading) + '</h2>' +
        '<p class="gallery__intro">' + esc(g.intro) + '</p></div>' +
      '<ul class="places" aria-label="Places">' + places.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
      '<ul class="mosaic">' + g.items.map(function (it) {
        var sizes = it.size === 'lg' ? '(min-width: 48rem) 50vw, 100vw' : (it.size === 'wide' ? '(min-width: 48rem) 50vw, 100vw' : '(min-width: 48rem) 25vw, 50vw');
        return '<li class="tile' + (it.size ? ' tile--' + esc(it.size) : '') + '"><figure>' + pic(it, sizes) +
          '<figcaption><span class="tile__place">' + esc(it.place) + ' · ' + esc(it.date) + '</span>' +
          '<span class="tile__cap">' + esc(it.caption) + '</span>' +
          (it.credit ? '<span class="tile__credit">' + esc(it.credit) + '</span>' : '') + '</figcaption></figure></li>';
      }).join('') + '</ul></section>';
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
      overCover();
    }
    if (page === 'publications') {
      document.querySelectorAll('.filter button').forEach(function (b) {
        b.addEventListener('click', function () { filterPubs(b.getAttribute('data-theme')); });
      });
      filterPubs('');
      wireCopy(c.labels);
    }
    if (page === 'impact') { linkTimeline(); initMap(c.impact.map); }
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
