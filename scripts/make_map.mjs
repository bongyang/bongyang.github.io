// Regenerates assets/img/map-world.svg, the base map on the Impact page
// (main.js crops it to impact.map.bounds with the SVG viewBox). Only needed if you change the projection in content.json.
//
//   npm i world-atlas@2 topojson-client      (once, in any scratch folder)
//   node scripts/make_map.mjs path/to/node_modules
//
// Equirectangular: x = (lon - lon0) * scale, y = (lat1 - lat) * scale, with
// lon0/lat1/scale/latMin from "impact.map.projection" in content.json; main.js
// uses the same numbers to place markers and labels.
// Malaysian Borneo (Sarawak and Sabah) is drawn darker than the rest of Borneo.
// Detail: 50m coastlines around Southeast Asia, 110m elsewhere.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const modules = path.resolve(process.argv[2] || 'node_modules');
const require = createRequire(path.join(modules, 'x.js'));
const { feature } = require('topojson-client');
const load = (f) => { const t = JSON.parse(readFileSync(path.join(modules, 'world-atlas', f), 'utf8')); return feature(t, t.objects.countries).features; };
const content = JSON.parse(readFileSync(new URL('../content.json', import.meta.url), 'utf8'));
const { lon0, lat1, latMin, scale } = content.impact.map.projection;
const W = 360 * scale, H = (lat1 - latMin) * scale;
const DETAIL = [85, -15, 145, 28];           // lon/lat box drawn from 50m data
const inBox = (ring) => {
  const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
  return Math.max(...xs) > DETAIL[0] && Math.min(...xs) < DETAIL[2] && Math.max(...ys) > DETAIL[1] && Math.min(...ys) < DETAIL[3];
};
const isBorneo = (ring) => {
  const [lon, lat] = ring.reduce((a, p) => [a[0] + p[0] / ring.length, a[1] + p[1] / ring.length], [0, 0]);
  return lon > 108.5 && lon < 119.5 && lat > -4.5 && lat < 7.5 && ring.length > 200;
};
// Rings that cross the date line (Russia, Fiji) would draw a line across the
// whole map; shift their western half past 180 degrees instead (off the map).
const unwrap = (ring) => ring.some((p, i) => i && Math.abs(p[0] - ring[i - 1][0]) > 180)
  ? ring.map(([lon, lat]) => [lon < 0 ? lon + 360 : lon, lat]) : ring;
const pathOf = (ring0, dp) => {
  const ring = unwrap(ring0);
  let out = '', last = null;
  for (const [lon, lat] of ring) {
    const x = ((lon - lon0) * scale).toFixed(dp), y = ((lat1 - Math.max(lat, latMin)) * scale).toFixed(dp);
    const k = x + ' ' + y;
    if (k === last) continue;
    out += (out ? 'L' : 'M') + k; last = k;
  }
  return out + 'Z';
};
const rings = (f) => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).map((p) => p[0]);
let land = '', borneo = '', borneoMy = '', malaysia = '';
for (const f of load('countries-110m.json')) {
  if (f.properties.name === 'Antarctica') continue;
  for (const r of rings(f)) if (!inBox(r)) land += pathOf(r, 0);
}
for (const f of load('countries-50m.json')) {
  for (const r of rings(f)) {
    if (!inBox(r)) continue;
    const d = pathOf(r, 1);
    if (isBorneo(r)) { if (f.properties.name === 'Malaysia') borneoMy += d; else borneo += d; }
    else if (f.properties.name === 'Malaysia') malaysia += d;
    else land += d;
  }
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<path class="land" d="${land}"/>
<path class="land land--my" d="${malaysia}"/>
<path class="land land--borneo" d="${borneo}"/>
<path class="land land--sarawak" d="${borneoMy}"/>
</svg>
`;
writeFileSync(new URL('../assets/img/map-world.svg', import.meta.url), svg);
console.log(`map-world.svg: ${(svg.length / 1024).toFixed(1)} KB, ${W}x${H}`);
