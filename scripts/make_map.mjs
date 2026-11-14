// Regenerates assets/img/map-region.svg, the quiet base map used in the
// Impact section. Only needed if you change the map's extent.
//
//   npm i world-atlas@2 topojson-client      (once, in any scratch folder)
//   node scripts/make_map.mjs path/to/node_modules
//
// The extent and size below must match "impact.map.bounds" and
// "impact.map.size" in content.json, because main.js uses the same
// equirectangular projection to place the markers.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const modules = path.resolve(process.argv[2] || 'node_modules');
const require = createRequire(path.join(modules, 'x.js'));
const { feature } = require('topojson-client');
const topo = JSON.parse(readFileSync(path.join(modules, 'world-atlas/countries-50m.json'), 'utf8'));
const content = JSON.parse(readFileSync(new URL('../content.json', import.meta.url), 'utf8'));
const [W, H] = content.impact.map.size;
const [lon0, lat0, lon1, lat1] = content.impact.map.bounds;

const kx = W / (lon1 - lon0), ky = H / (lat1 - lat0);
const px = (lon, lat) => [((lon - lon0) * kx).toFixed(1), ((lat1 - lat) * ky).toFixed(1)];

const countries = feature(topo, topo.objects.countries).features;
// Borneo is split between Malaysia, Brunei and Indonesia; pick out its rings by position.
const inBorneo = (ring) => {
  const [lon, lat] = ring.reduce((a, p) => [a[0] + p[0] / ring.length, a[1] + p[1] / ring.length], [0, 0]);
  return lon > 108.5 && lon < 119.5 && lat > -4.5 && lat < 7.5 && ring.length > 200;
};
let land = '', borneo = '';
for (const f of countries) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) {
    const ring = poly[0];
    const xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
    if (Math.max(...xs) < lon0 - 1 || Math.min(...xs) > lon1 + 1 || Math.max(...ys) < lat0 - 1 || Math.min(...ys) > lat1 + 1) continue;
    const d = 'M' + ring.map((p) => px(p[0], p[1]).join(' ')).join('L') + 'Z';
    if (inBorneo(ring)) borneo += d; else land += d;
  }
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<path d="${land}" fill="#EEEBE1" stroke="#CFC9B9" stroke-width="0.8" stroke-linejoin="round"/>
<path d="${borneo}" fill="#E3EAE2" stroke="#1E4D3B" stroke-opacity="0.55" stroke-width="1" stroke-linejoin="round"/>
</svg>
`;
writeFileSync(new URL('../assets/img/map-region.svg', import.meta.url), svg);
console.log(`map-region.svg: ${(svg.length / 1024).toFixed(1)} KB`);
