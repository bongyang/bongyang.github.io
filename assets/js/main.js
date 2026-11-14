/* Dr Yang Bong — personal site.
   Reads content.json and publications.json and renders the page.
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
  var pubHtml = function (p, c) {
    var url = pubUrl(p);
    var title = esc(p.title);
    var html = '<li class="pub" id="pub-' + esc(p.key) + '">' +
      '<p class="pub__year">' + esc(p.year || '') + '</p><div class="pub__body">' +
      '<h4 class="pub__title">' + (url ? link(url, title) : title) + '</h4>' +
      '<p class="pub__authors">' + authorsHtml(p.authors, c.publications.highlightAuthor) + '</p>' +
      '<p class="pub__venue">' + venueHtml(p) + '</p>';
    if (p.doi) {
      html += '<p class="pub__doi"><span>' + esc(c.labels.doi) + '</span> ' +
        link('https://doi.org/' + p.doi, esc(p.doi)) + '</p>';
    }
    return html + '</div></li>';
  };

  /* ---------- render ---------- */
  function render(c, pubs) {
    var byKey = {};
    pubs.forEach(function (p) { byKey[p.key] = p; });

    document.querySelectorAll('[data-text]').forEach(function (el) {
      var v = el.getAttribute('data-text').split('.').reduce(function (o, k) { return o && o[k]; }, c);
      if (v) el.textContent = v;
    });

    $('nav').innerHTML = c.nav.map(function (n) {
      return '<li><a href="#' + esc(n.id) + '">' + esc(n.label) + '</a></li>';
    }).join('');
    var label = {};
    c.nav.forEach(function (n, i) { label[n.id] = i + 1; });

    /* Home */
    var h = c.hero, ph = h.photo || {};
    var photo = (ph.jpg || ph.webp)
      ? '<picture>' + (ph.webp ? '<source srcset="' + esc(ph.webp) + '" type="image/webp">' : '') +
        '<img src="' + esc(ph.jpg || ph.webp) + '" alt="' + esc(ph.alt) + '" width="640" height="800" decoding="async"></picture>'
      : '<div class="portrait__placeholder" role="img" aria-label="' + esc(h.name) + '"><span>' + esc(h.monogram) + '</span></div>';
    var links = c.links.map(function (l) {
      return '<li>' + link(l.url, icon(l.id) + '<span>' + esc(l.label) + '</span>') + '</li>';
    }).join('') +
      '<li>' + link('mailto:' + c.contact.email, icon('email') + '<span>' + esc(c.labels.email) + '</span>') + '</li>';

    $('home').innerHTML =
      '<div class="hero__text">' +
        '<p class="eyebrow">' + esc(h.credentials) + '</p>' +
        '<h1 id="hero-name">' + esc(h.name) + '</h1>' +
        '<p class="hero__role">' + esc(h.role) + '<br><span>' + esc(h.affiliation) + '</span></p>' +
        '<p class="hero__bio">' + rich(h.bio) + '</p>' +
        '<ul class="links">' + links + '</ul>' +
      '</div>' +
      '<figure class="portrait">' + photo + '</figure>' +
      '<div class="about"><h2 class="about__h">' + esc(c.about.heading) + '</h2><div class="about__body">' +
        c.about.paragraphs.map(function (p) { return '<p>' + rich(p) + '</p>'; }).join('') +
      '</div></div>';

    /* Research */
    $('research').innerHTML = sectionHead(label.research, 'research', c.research.heading) +
      '<div class="section__body"><p class="lede">' + rich(c.research.intro) + '</p><ol class="themes">' +
      c.research.themes.map(function (t, i) {
        var rel = t.publications.filter(function (k) { return byKey[k]; }).map(function (k) {
          var p = byKey[k];
          return '<li><a href="#pub-' + esc(k) + '">' + esc(p.title) + '</a> <span class="muted">' + esc(p.year) + '</span></li>';
        }).join('');
        return '<li class="theme"><p class="theme__no" aria-hidden="true">' + 'i'.repeat(i + 1) + '</p>' +
          '<div><h3>' + esc(t.title) + '</h3><p>' + rich(t.description) + '</p>' +
          (rel ? '<p class="label">' + esc(c.research.relatedLabel) + '</p><ul class="related">' + rel + '</ul>' : '') +
          '</div></li>';
      }).join('') + '</ol></div>';

    /* Publications */
    $('publications').innerHTML = sectionHead(label.publications, 'publications', c.publications.heading) +
      '<div class="section__body"><p class="lede">' + rich(c.publications.intro) + '</p>' +
      c.publications.groups.map(function (g) {
        var items = pubs.filter(function (p) { return p.group === g.id; });
        if (!items.length) return '';
        return '<h3 class="group">' + esc(g.label) + '</h3><ol class="pubs">' +
          items.map(function (p) { return pubHtml(p, c); }).join('') + '</ol>';
      }).join('') + '</div>';

    /* Impact */
    $('impact').innerHTML = sectionHead(label.impact, 'impact', c.impact.heading) +
      '<div class="section__body impact">' + c.impact.items.map(function (it, i) {
        return '<article class="impact__item' + (i === 0 ? ' impact__item--lead' : '') + '">' +
          '<p class="label">' + esc(it.meta) + '</p><h3>' + esc(it.title) + '</h3><p>' + rich(it.text) + '</p>' +
          (it.link && it.link.url ? '<p>' + link(it.link.url, esc(it.link.label) + icon('arrow'), 'more') + '</p>' : '') +
          '</article>';
      }).join('') + '</div>';

    /* Teaching */
    $('teaching').innerHTML = sectionHead(label.teaching, 'teaching', c.teaching.heading) +
      '<div class="section__body"><p class="lede">' + rich(c.teaching.intro) + '</p><div class="rows">' +
      c.teaching.items.map(function (it) {
        return '<div class="row"><h3>' + esc(it.place) + '</h3><div><p>' + rich(it.text) + '</p>' +
          (it.topics && it.topics.length ? '<ul class="tags">' + it.topics.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '') +
          '</div></div>';
      }).join('') + '</div></div>';

    /* Service */
    $('service').innerHTML = sectionHead(label.service, 'service', c.service.heading) +
      '<div class="section__body"><ul class="service">' + c.service.items.map(function (it) {
        var org = esc(it.org) + (it.year ? ' ' + esc(it.year) : '');
        return '<li><span class="service__role">' + esc(it.role) + '</span><span class="service__org">' +
          (it.url ? link(it.url, org) : org) + '</span></li>';
      }).join('') + '</ul></div>';

    /* Contact */
    var ct = c.contact;
    $('contact').innerHTML = sectionHead(label.contact, 'contact', ct.heading) +
      '<div class="section__body contact"><p class="lede">' + rich(ct.text) + '</p>' +
      '<p class="contact__email">' + link('mailto:' + ct.email, esc(ct.email)) + '</p>' +
      '<address>' + ct.address.map(esc).join('<br>') + '</address></div>';

    $('footer').innerHTML = '<p>' + esc(c.footer.text) + ' ' + new Date().getFullYear() + '</p>' +
      '<p><a href="#home">' + esc(c.footer.backToTop) + '</a></p>';

    spy();
    if (location.hash) {
      var target = document.querySelector(location.hash);
      if (target) target.scrollIntoView();
    }
  }

  /* Highlights the nav item for the section in view. */
  function spy() {
    var items = {};
    document.querySelectorAll('#nav a').forEach(function (a) { items[a.getAttribute('href').slice(1)] = a; });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(items).forEach(function (id) {
          var on = id === e.target.id;
          items[id].classList.toggle('is-active', on);
          if (on) items[id].setAttribute('aria-current', 'true'); else items[id].removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-30% 0px -65% 0px' });
    Object.keys(items).forEach(function (id) { var s = $(id); if (s) io.observe(s); });
  }

  var getJson = function (url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' ' + r.status);
      return r.json();
    });
  };
  Promise.all([getJson('content.json'), getJson('publications.json')])
    .then(function (d) { render(d[0], d[1]); document.documentElement.classList.add('is-ready'); })
    .catch(function (err) {
      console.error(err);
      $('home').innerHTML = '<p class="lede">Sorry, the content failed to load. If you are viewing the file directly, serve the folder instead: python3 -m http.server</p>';
    });
})();
