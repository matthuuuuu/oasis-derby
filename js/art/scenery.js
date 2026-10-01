// Oasis Derby — scenery art (hand-written SVG strings, sticker style; see docs/ART_STYLE.md).
//
//   sceneSVG(theme)  full-screen app background · viewBox 0 0 1600 1000 · xMidYMax slice
//                    (phones see roughly the central x 570–1030 column, full height)
//   oasisSVG(theme)  centrepiece inside the race-track loop · viewBox 0 0 300 300
//
// theme: 'sand' (default, bright midday) | 'sunset' | 'night'. Every theme draws the same
// composition; colours come from a palette object `P` that is passed to each helper.
// `P.t(hex)` grades any "daylight" colour into the theme, `P.far(hex, k)` also hazes it
// towards the horizon colour for things that sit far away.

const INK = '#3b2412';
const EYE = '#2a1a10';
const BLUSH = '#f28b82';
const C = {
  blue: ['#1a9fd6', '#7fd0f0', '#0b6e9c'],
  yellow: ['#f5cf2f', '#fde88f', '#c89b0c'],
  green: ['#2a9a45', '#74cf82', '#17672c'],
  red: ['#e0344f', '#f5899a', '#a31a34'],
  purple: ['#6a45a8', '#a88ae0', '#43287a'],
};

// ---------------------------------------------------------------- numbers & colours
const f = (n) => String(Math.round(n * 10) / 10);
const rgb = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hex = (c) =>
  '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => {
  const A = rgb(a);
  const B = rgb(b);
  return hex(A.map((v, i) => v + (B[i] - v) * t));
};
/** darker, slightly warmer shade of a colour */
const dk = (h, k = 0.14) => {
  const [r, g, b] = rgb(h);
  return hex([r * (1 - k * 0.8), g * (1 - k * 1.1), b * (1 - k * 1.35)]);
};

// Colour grading per theme (applied to every character / prop colour).
const GRADE = {
  sand: null,
  sunset: { sat: 0.06, mul: [0.98, 0.8, 0.8], add: [22, 4, 24] },
  night: { sat: 0.36, mul: [0.44, 0.48, 0.66], add: [18, 20, 40] },
};
function grade(h, g) {
  let [r, gg, b] = rgb(h);
  const l = 0.2126 * r + 0.7152 * gg + 0.0722 * b;
  r += (l - r) * g.sat;
  gg += (l - gg) * g.sat;
  b += (l - b) * g.sat;
  return hex([r * g.mul[0] + g.add[0], gg * g.mul[1] + g.add[1], b * g.mul[2] + g.add[2]]);
}

// Environment colours hand-picked per theme (sky, light, far things, ground, water).
const ENV = {
  sand: {
    sky: [[0, '#fff3d4'], [0.42, '#ffebb0'], [0.8, '#f9ca74'], [1, '#efae64']],
    haze: '#fde6b4',
    orb: { x: 925, y: 168, r: 50 },
    orbC: '#ffd65a', orbHi: '#fff4c4', halo: '#fffbe8', haloOp: [0.62, 0.36, 0.18], haloK: [1.35, 1.8, 2.35],
    cloud: '#fffaf0', cloudHi: '#ffffff', cloudLo: '#fbe0ae',
    pyrLit: '#fde2a4', pyrShade: '#eaa96a', pyrLine: '#df9c5e', rim: '#fff3d4',
    cap: '#f7c64f', capShade: '#d99a1e', glint: '#fffdf2',
    duneA: '#fcdda3', duneB: '#f9d18e',
    ground: [[0, '#f9d893'], [0.3, '#f6ca80'], [0.65, '#f1b86e'], [1, '#e8a664']],
    duneShade: '#efae68', duneHi: '#fde9b4', fgDune: '#f8d690', fgDuneShade: '#eaa864',
    ripple: '#de9b5b', rippleHi: '#fef0c4',
    water: [[0, '#8fe0e6'], [0.45, '#4fc1cf'], [1, '#1f8ea3']],
    waterDeep: '#1a7f95', waterHi: '#f2fffd', waterLine: '#b5eff0',
    shadow: '#a0582a', shadowOp: 0.22, shadowLen: 1,
  },
  sunset: {
    sky: [[0, '#8a4a8c'], [0.4, '#c65f78'], [0.62, '#f0795b'], [0.86, '#ffb56b'], [1, '#ffd08a']],
    haze: '#f59a78',
    orb: { x: 912, y: 330, r: 88 },
    orbC: '#ffe69a', orbHi: '#fff7d6', halo: '#ffd48a', haloOp: [0.45, 0.26, 0.13], haloK: [1.3, 1.8, 2.6],
    cloud: '#ffa6a0', cloudHi: '#ffd6a8', cloudLo: '#d9708c',
    pyrLit: '#e98a6e', pyrShade: '#9e4d70', pyrLine: '#c46a70', rim: '#ffdba0',
    cap: '#ffcf6a', capShade: '#e0903a', glint: '#fffbe6',
    duneA: '#dc7f78', duneB: '#e88f72',
    ground: [[0, '#f7ac74'], [0.3, '#f39e66'], [0.65, '#e98a5c'], [1, '#d97552']],
    duneShade: '#cf6a5a', duneHi: '#ffd0a0', fgDune: '#f6a76f', fgDuneShade: '#d9765a',
    ripple: '#c9624e', rippleHi: '#ffc896',
    water: [[0, '#ffc98e'], [0.45, '#e98579'], [1, '#7a4588']],
    waterDeep: '#6a3a7c', waterHi: '#fff0c8', waterLine: '#ffd0a0',
    shadow: '#6a2446', shadowOp: 0.26, shadowLen: 2,
  },
  night: {
    sky: [[0, '#0d1330'], [0.6, '#18214a'], [1, '#2a3868']],
    haze: '#2c3a6a',
    orb: { x: 962, y: 160, r: 44 },
    orbC: '#fff3c4', orbHi: '#ffffff', halo: '#fff3c4', haloOp: [0.12, 0.07, 0.04], haloK: [1.6, 2.3, 3.2],
    cloud: '#253160', cloudHi: '#44538a', cloudLo: '#1b2550',
    pyrLit: '#56639a', pyrShade: '#343f70', pyrLine: '#46528a', rim: '',
    cap: '#e9c86e', capShade: '#b08c3e', glint: '#fff6d0',
    duneA: '#3a4678', duneB: '#434f84',
    ground: [[0, '#5b6594'], [0.3, '#5a6390'], [0.65, '#545c88'], [1, '#4a507c']],
    duneShade: '#454c7c', duneHi: '#7a84b4', fgDune: '#626a98', fgDuneShade: '#4c5282',
    ripple: '#454b78', rippleHi: '#7d86b6',
    water: [[0, '#3e5c98'], [0.45, '#27437c'], [1, '#172b5a']],
    waterDeep: '#132450', waterHi: '#fff3c4', waterLine: '#6f88c4',
    shadow: '#0b1030', shadowOp: 0.3, shadowLen: 1.1,
  },
};

function palette(theme) {
  const name = ENV[theme] ? theme : 'sand';
  const g = GRADE[name];
  const cache = new Map();
  const t = (h) => {
    if (!g) return h;
    let v = cache.get(h);
    if (v === undefined) {
      v = grade(h, g);
      cache.set(h, v);
    }
    return v;
  };
  const P = { ...ENV[name], name, night: name === 'night', sunset: name === 'sunset', t };
  P.ink = t(INK);
  P.far = (h, k) => mix(t(h), P.haze, k);
  /** glowing light colour: stays bright at night */
  P.glow = (h) => (P.night ? h : t(h));
  return P;
}

// ---------------------------------------------------------------- misc helpers
let SEQ = 0;
/** per-call id factory: counter + random token so several copies can share a page */
function idMaker(prefix) {
  const tok = (++SEQ).toString(36) + Math.floor(Math.random() * 1296).toString(36).padStart(2, '0');
  return (name) => `${prefix}${name}-${tok}`;
}
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const lin = (gid, x1, y1, x2, y2, stops) =>
  `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
  stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('') +
  '</linearGradient>';

/** Catmull-Rom spline through points → cubic Bézier path data */
function smooth(pts, closed = false, move = true) {
  const n = pts.length;
  const at = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = move ? `M${f(pts[0][0])},${f(pts[0][1])}` : `L${f(pts[0][0])},${f(pts[0][1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    d +=
      `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ` +
      `${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}
/** y(x) lookup along the same (open) spline */
function curveY(pts) {
  const n = pts.length;
  const at = (i) => pts[Math.max(0, Math.min(n - 1, i))];
  const dense = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    for (let k = 0; k < 16; k++) {
      const t = k / 16;
      const u = 1 - t;
      dense.push([
        u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0],
        u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1],
      ]);
    }
  }
  dense.push(pts[n - 1]);
  return (x) => {
    for (let i = 1; i < dense.length; i++) {
      if (dense[i][0] >= x) {
        const a = dense[i - 1];
        const b = dense[i];
        return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0] || 1);
      }
    }
    return dense[dense.length - 1][1];
  };
}
function blobPts(cx, cy, rx, ry, wob) {
  return wob.map((w, i) => {
    const a = (i / wob.length) * Math.PI * 2;
    return [cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w];
  });
}
function crescent(cx, cy, r, ox, oy, r2) {
  const d = Math.hypot(ox, oy);
  const a = (r * r - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r * r - a * a));
  const px = cx + (a * ox) / d;
  const py = cy + (a * oy) / d;
  const x1 = px + (h * oy) / d;
  const y1 = py - (h * ox) / d;
  const x2 = px - (h * oy) / d;
  const y2 = py + (h * ox) / d;
  return `M${f(x1)},${f(y1)}A${f(r)},${f(r)} 0 1 0 ${f(x2)},${f(y2)}A${f(r2)},${f(r2)} 0 0 1 ${f(x1)},${f(y1)}Z`;
}
/** outlined limb: thick ink stroke under a coloured stroke */
const limb = (P, d, w, c, ol = 3.5) =>
  `<path d="${d}" fill="none" stroke="${P.ink}" stroke-width="${f(w + ol * 2)}"/>` +
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
/** ground shadow; in the sunset theme it stretches away from the low sun */
function shadow(P, x, y, rx, ry, wx = x) {
  const L = P.shadowLen;
  const dx = L > 1.2 ? (wx < P.orb.x ? -1 : 1) * rx * (L - 1) * 0.75 : 0;
  return `<ellipse cx="${f(x + dx)}" cy="${f(y)}" rx="${f(rx * L)}" ry="${f(ry)}" fill="${P.shadow}" opacity="${P.shadowOp}"/>`;
}
/** union of circles with one shared outline (sticker blob) */
function blob(cs, fill, ink, sw) {
  return (
    cs.map(([x, y, r]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r + sw)}" fill="${ink}"/>`).join('') +
    cs.map(([x, y, r]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}"/>`).join('')
  );
}

// ---------------------------------------------------------------- shared defs
function crownDef(P, id, defs) {
  const ink = P.ink;
  const g = P.t('#4f9a3a');
  const gl = P.t('#78bf4c');
  const gd = P.t('#2f6b2a');
  const fr = id('fr');
  const hi = id('fh');
  const rib = id('fb');
  defs.push(
    `<path id="${fr}" d="M0,-3C28,-34 78,-38 118,4L104,16L96,-6L88,10L78,-14L70,4L60,-18L52,4L42,-17L34,2L24,-12L16,4L8,-6L0,3Z"/>` +
      `<path id="${hi}" d="M8,-9C32,-29 70,-33 100,-11C72,-25 36,-23 8,-9Z"/>` +
      `<path id="${rib}" d="M4,-3C32,-28 78,-31 114,3" fill="none" stroke="${gd}" stroke-width="2.2"/>`
  );
  const frond = (a, m, dark, sc = 1) =>
    `<g transform="${m ? 'scale(-1 1) ' : ''}rotate(${a}) scale(${sc})"><use href="#${fr}" fill="${dark ? gd : g}" stroke="${ink}"/>` +
    (dark ? '' : `<use href="#${hi}" fill="${gl}"/><use href="#${rib}"/>`) +
    '</g>';
  const date = P.t('#e08a2e');
  const dateD = P.t('#a8551c');
  const crown = id('cr');
  let s = `<g id="${crown}" stroke-width="3">`;
  for (const a of [-44, 6, 40]) s += frond(a, 0, 1, 0.9) + frond(a, 1, 1, 0.9);
  s += `<ellipse cx="0" cy="6" rx="13" ry="10" fill="${P.t('#8a5a32')}" stroke="${ink}"/>`;
  s += blob([[-9, 16, 5], [-4, 23, 5], [-12, 25, 4.5], [-6, 30, 4]], date, ink, 2.5);
  s += blob([[9, 15, 5], [13, 22, 4.5], [6, 24, 5]], dateD, ink, 2.5);
  for (const a of [-72, -24, 20, 56]) s += frond(a, 0, 0) + frond(a, 1, 0);
  s += frond(-96, 0, 0, 0.8);
  s += '</g>';
  // flat silhouette of the crown (fill inherited) — used for reflections in water
  const sil = id('cs');
  s += `<g id="${sil}">`;
  for (const a of [-70, -28, 12, 50]) s += `<use href="#${fr}" transform="rotate(${a})"/><use href="#${fr}" transform="scale(-1 1) rotate(${a})"/>`;
  s += '</g>';
  defs.push(s);
  return { crown, sil };
}
const sparkDef = (gid) => `<path id="${gid}" d="M0,-10Q1.5,-1.5 10,0Q1.5,1.5 0,10Q-1.5,1.5 -10,0Q-1.5,-1.5 0,-10Z"/>`;
function palm(P, crown, x0, y0, x1, y1, bend, k, flip = 1, rot = 0) {
  // curved, tapering trunk with chevron leaf-scars; shade & scars are inset so one outline suffices
  const cx = (x0 + x1) / 2 + bend;
  const cy = (y0 + y1) / 2;
  const Lp = [];
  const Rp = [];
  const S1 = [];
  const S2 = [];
  let chev = '';
  const M = 12;
  for (let i = 0; i <= M; i++) {
    const t = i / M;
    const u = 1 - t;
    const px = u * u * x0 + 2 * u * t * cx + t * t * x1;
    const py = u * u * y0 + 2 * u * t * cy + t * t * y1;
    const dx = 2 * u * (cx - x0) + 2 * t * (x1 - cx);
    const dy = 2 * u * (cy - y0) + 2 * t * (y1 - cy);
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = ((30 - 13 * t) / 2) * k * (i === 0 ? 1.3 : 1);
    if (i % 3 === 0) {
      Lp.push([px + nx * w, py + ny * w]);
      Rp.push([px - nx * w, py - ny * w]);
      S1.push([px - nx * w * 0.8, py - ny * w * 0.8]);
      S2.push([px - nx * w * 0.06, py - ny * w * 0.06]);
    }
    if (i > 0 && i < M) {
      const q = w * 0.8;
      chev += `M${f(px + nx * q)},${f(py + ny * q)}Q${f(px - (dx / len) * 7 * k)},${f(py - (dy / len) * 7 * k)} ${f(px - nx * q)},${f(py - ny * q)}`;
    }
  }
  return (
    shadow(P, x0, y0 + 2, 34 * k, 7 * k) +
    `<path d="${smooth(Lp)}${smooth([...Rp].reverse(), false, false)}Z" fill="${P.t('#b77a48')}" stroke="${P.ink}" stroke-width="${f(3 * k)}"/>` +
    `<path d="${smooth(S1)}${smooth([...S2].reverse(), false, false)}Z" fill="${P.t('#9a6038')}"/>` +
    `<path d="${chev}" fill="none" stroke="${P.t('#80502c')}" stroke-width="${f(2.6 * k)}"/>` +
    `<use href="#${crown}" transform="translate(${f(x1)} ${f(y1)}) rotate(${rot}) scale(${f(k * flip)} ${f(k)})"/>`
  );
}
function lilyDefs(P, id, defs) {
  const ink = P.ink;
  const pad = id('lp');
  const lotus = id('lo');
  defs.push(
    `<g id="${pad}"><path d="M0,0L9.4,-1.7A10,5 0 1 0 9.4,1.7Z" fill="${P.t('#4f9a3a')}" stroke="${ink}" stroke-width="1.6"/>` +
      `<path d="M-7,-1.5A7,3 0 0 1 5,-3" fill="none" stroke="${P.t('#8fd060')}" stroke-width="1.4"/></g>` +
      `<g id="${lotus}" stroke="${ink}" stroke-width="1.5"><path d="M-7,0C-9,-5 -7,-9 -5,-9L-2.5,-4.5L0,-11L2.5,-4.5L5,-9C7,-9 9,-5 7,0Q0,2.5 -7,0Z" fill="${P.glow('#f7a8c0')}"/>` +
      `<path d="M-2.5,-4.5L0,-11L2.5,-4.5Q0,-2 -2.5,-4.5Z" fill="${P.glow('#fde0ea')}"/></g>`
  );
  return { pad, lotus };
}
function reedDef(P, id, defs) {
  const ink = P.ink;
  const g = P.t('#5fa83e');
  const gl = P.t('#9ad35e');
  const brown = P.t('#8a5226');
  const rd = id('rd');
  const stem = (d) => `<path d="${d}" fill="none" stroke="${ink}" stroke-width="5"/><path d="${d}" fill="none" stroke="${g}" stroke-width="2"/>`;
  const umbel = (x, y, a) =>
    `<path transform="translate(${x} ${y}) rotate(${a})" d="M0,0L-12,-5L-9,-9L-5,-12L0,-13L5,-12L9,-9L12,-5Z" fill="${gl}" stroke="${ink}" stroke-width="2"/>`;
  const blade = (d) => `<path d="${d}" fill="${g}" stroke="${ink}" stroke-width="2"/>`;
  defs.push(
    `<g id="${rd}">` +
      blade('M-4,0C-10,-20 -18,-34 -26,-42C-16,-36 -8,-24 0,-4Z') +
      blade('M4,0C10,-18 18,-28 26,-34C16,-30 8,-20 0,-4Z') +
      stem('M-2,0C-4,-24 -8,-44 -12,-62') +
      stem('M1,0C2,-28 3,-52 4,-74') +
      stem('M4,0C8,-22 14,-40 20,-54') +
      `<rect x="-15" y="-80" width="7" height="18" rx="3.5" transform="rotate(-10 -12 -62)" fill="${brown}" stroke="${ink}" stroke-width="2"/>` +
      umbel(4, -74, 0) +
      umbel(20, -54, 25) +
      blade('M-2,0C-4,-10 -8,-18 -14,-22C-6,-20 0,-12 3,-2Z') +
      '</g>'
  );
  return rd;
}
/** night: glowing fireflies · day: little dragonflies (pts: [x, y, scale]) */
function critters(P, pts) {
  const ink = P.ink;
  if (P.night) {
    return pts.map(([x, y, k]) => `<circle cx="${x}" cy="${y}" r="${f(7 * k)}" fill="#f4ff9a" opacity=".22"/><circle cx="${x}" cy="${y}" r="${f(2.4 * k)}" fill="#fbffc8"/>`).join('');
  }
  const wing = P.t('#e6fbfb');
  const body = P.t('#1a9aa3');
  return pts
    .map(
      ([x, y, k], i) =>
        `<g transform="translate(${x} ${y}) rotate(${i % 2 ? 20 : -25}) scale(${k})" stroke="${ink}" stroke-width="1.4" fill="${wing}">` +
        `<ellipse cx="-7" cy="-3" rx="7" ry="2.4" transform="rotate(-12 -7 -3)"/><ellipse cx="7" cy="-3" rx="7" ry="2.4" transform="rotate(12 7 -3)"/>` +
        `<ellipse cx="-6" cy="1.5" rx="6" ry="2.2" transform="rotate(14 -6 1.5)"/><ellipse cx="6" cy="1.5" rx="6" ry="2.2" transform="rotate(-14 6 1.5)"/>` +
        `<path d="M0,-5V11" stroke-width="4.4"/><path d="M0,-5V11" stroke="${body}" stroke-width="1.8"/><circle cx="0" cy="-6" r="2.8" fill="${body}"/></g>`
    )
    .join('');
}
/** a ripple ring on the water (drawn in the clipped water layer, under pads & animals) */
const waterRing = (P, x, y, rx, ry, w, hi = true, op = 0.8) =>
  `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="${hi ? P.waterHi : P.waterLine}" stroke-width="${f(w)}" opacity="${op}"/>`;
/** the water around a peeking hippo: soft dark reflection + two rings (all under the hippo) */
const hippoWater = (P, x, y, k) =>
  `<ellipse cx="${f(x)}" cy="${f(y + 2 * k)}" rx="${f(38 * k)}" ry="${f(6 * k)}" fill="${P.waterDeep}" opacity=".35"/>` +
  waterRing(P, x, y, 64 * k, 11 * k, 3 * k, false, 0.7) +
  waterRing(P, x, y + k, 46 * k, 7 * k, 2.5 * k);
/** hippo head peeking out of the water; its waterline edge is left un-outlined (the rings sit underneath) */
function hippo(P, x, y, k) {
  const ink = P.ink;
  const b = P.t('#a58fb8');
  const bs = P.t('#8a74a0');
  const snout = P.t('#b9a5c9');
  const pink = P.t('#f5a3b5');
  const head = 'M-38,0C-40,-14 -34,-24 -24,-27A10,10 0 1 1 -5,-31Q0,-29 5,-31A10,10 0 1 1 24,-27C34,-24 40,-14 38,0';
  return (
    `<g transform="translate(${x} ${y}) scale(${k})" stroke-width="2.6">` +
    `<circle cx="-27" cy="-34" r="7" fill="${b}" stroke="${ink}"/><circle cx="27" cy="-34" r="7" fill="${b}" stroke="${ink}"/>` +
    `<circle cx="-27" cy="-34" r="3.2" fill="${pink}"/><circle cx="27" cy="-34" r="3.2" fill="${pink}"/>` +
    `<path d="${head}Z" fill="${b}"/>` +
    `<path d="M-37,-6C-30,-4 30,-4 37,-6L38,0H-38Z" fill="${bs}"/>` +
    `<ellipse cx="0" cy="-10" rx="25" ry="9" fill="${snout}"/>` +
    `<ellipse cx="-8" cy="-12" rx="2.6" ry="2" fill="${ink}"/><ellipse cx="8" cy="-12" rx="2.6" ry="2" fill="${ink}"/>` +
    `<ellipse cx="-14.5" cy="-31" rx="4" ry="5" fill="${P.t(EYE)}"/><ellipse cx="14.5" cy="-31" rx="4" ry="5" fill="${P.t(EYE)}"/>` +
    `<circle cx="-13" cy="-33" r="1.5" fill="#fff"/><circle cx="16" cy="-33" r="1.5" fill="#fff"/>` +
    `<ellipse cx="-27" cy="-15" rx="5" ry="3" fill="${P.t(BLUSH)}" opacity=".55"/><ellipse cx="27" cy="-15" rx="5" ry="3" fill="${P.t(BLUSH)}" opacity=".55"/>` +
    `<path d="${head}" fill="none" stroke="${ink}"/>` +
    '</g>'
  );
}

// ---------------------------------------------------------------- people
/**
 * A cute chibi person, feet at (0,0), ~175 units tall at scale 1.
 * o: { skin, robe, robeS?, sleeve?, style: 'robe'|'dress'|'suit', hat, hair, eyes, armL, armR,
 *      item, itemColor, sash, vest, trousers, legs, shoe, mustache, beard, kid, wx }
 */
function person(P, o) {
  const T = P.t;
  const ink = P.ink;
  const kid = !!o.kid;
  const style = o.style || 'robe';
  const top = kid ? -80 : -104;
  const hr = kid ? 27 : 29;
  const hy = top - hr + 6;
  const shW = kid ? 15 : 19;
  const hemW = kid ? 27 : style === 'dress' ? 31 : 37;
  const hemY = style === 'dress' ? -40 : style === 'suit' ? -50 : -9;
  const skin = T(o.skin);
  const robe = T(o.robe);
  const robeS = T(o.robeS || dk(o.robe, 0.22));
  const sleeve = T(o.sleeve || o.robe);
  const hairC = T(o.hairC || '#3a2416');
  const X = (side, v) => f(side * v);
  const armD = (side, pose) => {
    const sy = top + 11;
    const sx = shW - 1;
    switch (pose) {
      case 'up':
        return `M${X(side, sx)},${sy}Q${X(side, shW + 20)},${top + 2} ${X(side, shW + 18)},${top - 34}`;
      case 'front':
        return `M${X(side, sx)},${sy}Q${X(side, shW + 14)},${top + 40} ${X(side, shW - 9)},${top + 46}`;
      case 'hold':
        return `M${X(side, sx)},${sy}Q${X(side, shW + 12)},${top + 38} ${X(side, shW + 20)},${top + 40}`;
      case 'bino':
        return `M${X(side, sx)},${sy}Q${X(side, shW + 16)},${top + 12} ${X(side, 11)},${hy + 12}`;
      case 'cup':
        return `M${X(side, sx)},${sy}Q${X(side, shW + 20)},${top + 26} ${X(side, shW + 22)},${top - 6}`;
      default:
        return `M${X(side, sx)},${sy}Q${X(side, shW + 12)},${top + 30} ${X(side, shW + 8)},${top + 54}`;
    }
  };
  const handAt = (side, pose) => {
    const m = armD(side, pose).match(/(-?[\d.]+),(-?[\d.]+)$/);
    return [+m[1], +m[2]];
  };
  let s = shadow(P, 0, -1, kid ? 26 : 34, 7, o.wx ?? 0);
  const [hxR, hyR] = handAt(1, o.armR);
  const [hxL, hyL] = handAt(-1, o.armL);

  // legs & shoes
  const shoe = T(o.shoe || '#6b4226');
  if (style === 'dress') s += limb(P, `M-8,${hemY}L-9,-10`, 8, T(o.legs || o.skin)) + limb(P, `M8,${hemY}L9,-10`, 8, T(o.legs || o.skin));
  if (style === 'suit') s += limb(P, 'M-10,-54L-11,-12', 15, T(o.trousers)) + limb(P, 'M10,-54L11,-12', 15, T(o.trousers));
  s += `<ellipse cx="-11" cy="-6" rx="10" ry="6.5" fill="${shoe}" stroke="${ink}"/><ellipse cx="11" cy="-6" rx="10" ry="6.5" fill="${shoe}" stroke="${ink}"/>`;

  // body
  const bodyD =
    `M${-shW},${top}C${-shW - 11},${top + 16} ${-hemW + 2},${hemY - 30} ${-hemW},${hemY}` +
    `Q0,${hemY + 7} ${hemW},${hemY}C${hemW - 2},${hemY - 30} ${shW + 11},${top + 16} ${shW},${top}Q0,${top - 7} ${-shW},${top}Z`;
  const shadeD =
    `M${-shW},${top}C${-shW - 11},${top + 16} ${-hemW + 2},${hemY - 30} ${-hemW},${hemY}` +
    `Q${f(-hemW * 0.72)},${hemY + 4.5} ${f(-hemW * 0.45)},${hemY + 5.5}C${f(-hemW * 0.5)},${hemY - 26} ${f(-shW * 0.55)},${top + 24} ${f(-shW * 0.1)},${top - 6}Z`;
  s += `<path d="${bodyD}" fill="${robe}"/><path d="${shadeD}" fill="${robeS}"/>`;
  if (o.vest) {
    const v = T(o.vest);
    s +=
      `<path d="M${-shW + 1},${top + 1}C${-shW - 6},${top + 20} ${-shW - 8},${top + 40} ${-shW - 7},${top + 52}L-6,${top + 50}L-4,${top + 4}Z" fill="${v}" stroke="${ink}" stroke-width="2.5"/>` +
      `<path d="M${shW - 1},${top + 1}C${shW + 6},${top + 20} ${shW + 8},${top + 40} ${shW + 7},${top + 52}L6,${top + 50}L4,${top + 4}Z" fill="${v}" stroke="${ink}" stroke-width="2.5"/>` +
      `<path d="M${-shW - 2},${top + 30}L-6,${top + 34}M${shW + 2},${top + 30}L6,${top + 34}" stroke="${T('#f2b84b')}" stroke-width="2.5"/>`;
  }
  if (o.sash) {
    const y = style === 'dress' ? top + 50 : top + 46;
    const w = style === 'dress' ? 27 : 30;
    s += `<path d="M${-w},${y}Q0,${y + 6} ${w},${y}L${w + 1},${y + 9}Q0,${y + 15} ${-w - 1},${y + 9}Z" fill="${T(o.sash)}" stroke="${ink}" stroke-width="2.5"/>`;
  }
  if (style === 'suit') {
    const pk = T(dk(o.robe, 0.3));
    s +=
      `<path d="M0,${top - 4}V${hemY + 4}" stroke="${pk}" stroke-width="2.5"/>` +
      `<path d="M-6,${top - 3}L0,${top + 12}L6,${top - 3}" fill="${T('#fff3d4')}" stroke="${ink}" stroke-width="2.2"/>` +
      `<rect x="-22" y="${top + 38}" width="12" height="10" rx="2" fill="${robeS}" stroke="${ink}" stroke-width="2"/><rect x="10" y="${top + 38}" width="12" height="10" rx="2" fill="${robeS}" stroke="${ink}" stroke-width="2"/>`;
  } else if (o.trim) {
    s += `<path d="M-9,${top - 3}Q0,${top + 12} 9,${top - 3}" fill="none" stroke="${T(o.trim)}" stroke-width="3.5"/>`;
  }
  s += `<path d="${bodyD}" fill="none" stroke="${ink}"/>`;

  // arms + hands
  s += limb(P, armD(-1, o.armL), 12, sleeve) + limb(P, armD(1, o.armR), 12, sleeve);
  const hand = (x, y) => `<circle cx="${f(x)}" cy="${f(y)}" r="7" fill="${skin}" stroke="${ink}"/>`;

  // held items (behind hands)
  let front = '';
  if (o.item === 'parasol') {
    // striped lace parasol: dome + curved ribs + scalloped hem with lace
    const R = 50;
    const H = 36;
    const N = 5;
    const px = hxR + 20;
    const py = hy - 50;
    const cA = T(o.itemColor || '#7fd0f0');
    const cB = T('#fff3d4');
    const tipX = (i) => -R + (2 * R * i) / N;
    const rib = (i, rev) => (rev ? `Q${f(tipX(i) * 0.72)},${f(-H * 0.72)} 0,${-H}` : `Q${f(tipX(i) * 0.72)},${f(-H * 0.72)} ${f(tipX(i))},0`);
    let hem = '';
    for (let i = N; i > 0; i--) hem += `Q${f((tipX(i) + tipX(i - 1)) / 2)},-10 ${f(tipX(i - 1))},0`;
    let stripes = '';
    for (const i of [1, 3]) stripes += `M0,${-H}${rib(i)}Q${f((tipX(i) + tipX(i + 1)) / 2)},-10 ${f(tipX(i + 1))},0${rib(i + 1, 1)}Z`;
    let ribs = '';
    for (let i = 1; i < N; i++) ribs += `M0,${-H}${rib(i)}`;
    let lace = '';
    for (let i = 0; i < N * 2; i++) {
      const t = (i % 2) * 0.5 + 0.25;
      lace += `<circle cx="${f(tipX(Math.floor(i / 2)) + (2 * R * t) / N)}" cy="${f(-5 * (1 - (2 * t - 1) ** 2) + 1)}" r="4.2"/>`;
    }
    front +=
      limb(P, `M${f(hxR)},${f(hyR + 8)}L${f(px)},${f(py)}`, 3, T('#8a5a32'), 2.2) +
      `<g transform="translate(${f(px)} ${f(py)}) rotate(16)" stroke-width="2.8">` +
      `<g fill="${cB}" stroke="${ink}" stroke-width="2">${lace}</g>` +
      `<path d="M${-R},0A${R},${H} 0 0 1 ${R},0${hem}Z" fill="${cA}"/>` +
      `<path d="${stripes}" fill="${cB}"/>` +
      `<path d="${ribs}" fill="none" stroke="${T(dk(o.itemColor || '#7fd0f0', 0.3))}" stroke-width="1.8"/>` +
      `<path d="M${-R},0A${R},${H} 0 0 1 ${R},0${hem}Z" fill="none" stroke="${ink}"/>` +
      `<path d="M0,${-H}V${-H - 9}" stroke="${ink}" stroke-width="3.5"/><circle cx="0" cy="${-H - 10}" r="3.8" fill="${T('#f2b84b')}" stroke="${ink}" stroke-width="2"/>` +
      '</g>';
  }
  if (o.item === 'flag') {
    const fx = hxR + 2;
    const fy = hyR - 52;
    const c = C[o.itemColor || 'yellow'];
    front +=
      limb(P, `M${f(hxR + 1)},${f(hyR + 6)}L${f(fx)},${f(fy)}`, 3.2, T('#8a5a32'), 2.2) +
      `<path d="M${f(fx)},${f(fy)}C${f(fx + 14)},${f(fy - 6)} ${f(fx + 22)},${f(fy + 6)} ${f(fx + 38)},${f(fy + 2)}C${f(fx + 30)},${f(fy + 12)} ${f(fx + 26)},${f(fy + 22)} ${f(fx + 30)},${f(fy + 28)}C${f(fx + 18)},${f(fy + 30)} ${f(fx + 12)},${f(fy + 20)} ${f(fx)},${f(fy + 24)}Z" fill="${T(c[0])}" stroke="${ink}" stroke-width="3"/>` +
      `<path d="M${f(fx + 6)},${f(fy + 8)}C${f(fx + 14)},${f(fy + 5)} ${f(fx + 20)},${f(fy + 10)} ${f(fx + 26)},${f(fy + 8)}" fill="none" stroke="${T(c[1])}" stroke-width="3"/>` +
      `<circle cx="${f(fx)}" cy="${f(fy - 3)}" r="3.5" fill="${T('#f2b84b')}" stroke="${ink}" stroke-width="2"/>`;
  }
  if (o.item === 'jug') {
    // big shiny brass ewer held by its handle, and a little cup offered in the other hand
    const br = T('#eeaa2c');
    const brD = T('#c07a16');
    const brL = T('#fde7a0');
    front +=
      `<g transform="translate(${f(hxR + 4)} ${f(hyR - 6)})" stroke-width="3">` +
      `<path d="M16,4C36,2 50,20 46,40C42,56 22,60 10,56C-2,52 -8,38 -4,24C0,12 6,6 16,4Z" fill="${br}" stroke="${ink}"/>` +
      `<path d="M-4,24C-8,38 -2,52 10,56C18,58 26,58 32,55C20,54 8,46 6,32C5,22 8,12 14,6C6,8 0,14 -4,24Z" fill="${brD}"/>` +
      `<path d="M30,14C38,18 42,26 41,34" fill="none" stroke="${brL}" stroke-width="4"/>` +
      `<path d="M10,6L12,-8H24L26,5" fill="${br}" stroke="${ink}"/>` +
      `<path d="M8,-8C8,-20 28,-20 28,-8Z" fill="${br}" stroke="${ink}"/><circle cx="18" cy="-19" r="3.5" fill="${brL}" stroke="${ink}" stroke-width="2"/>` +
      `<path d="M44,28C56,22 62,8 70,-4" fill="none" stroke="${ink}" stroke-width="10"/><path d="M44,28C56,22 62,8 70,-4" fill="none" stroke="${br}" stroke-width="4.5"/>` +
      `<path d="M4,-2C-6,-2 -8,16 -2,20" fill="none" stroke="${ink}" stroke-width="9"/><path d="M4,-2C-6,-2 -8,16 -2,20" fill="none" stroke="${br}" stroke-width="3.5"/>` +
      '</g>' +
      `<path d="M${f(hxL - 9)},${f(hyL - 20)}h18l-3,14h-12Z" fill="${br}" stroke="${ink}" stroke-width="2.5"/><path d="M${f(hxL - 6)},${f(hyL - 16)}h12" stroke="${brL}" stroke-width="2.5"/>`;
  }
  s += front;
  s += hand(hxL, hyL) + hand(hxR, hyR);

  // head
  s += `<circle cx="${-hr + 1}" cy="${hy + 3}" r="6.5" fill="${skin}" stroke="${ink}"/><circle cx="${hr - 1}" cy="${hy + 3}" r="6.5" fill="${skin}" stroke="${ink}"/>`;
  if (o.hat === 'scarf') {
    s += `<path d="M${-hr - 5},${hy + 2}C${-hr - 7},${hy - hr - 10} ${hr + 7},${hy - hr - 10} ${hr + 5},${hy + 2}C${hr + 6},${hy + 20} ${hr - 2},${hy + 30} ${hr - 8},${hy + 32}H${-hr + 8}C${-hr + 2},${hy + 30} ${-hr - 6},${hy + 20} ${-hr - 5},${hy + 2}Z" fill="${T(o.hatColor)}" stroke="${ink}"/>`;
  }
  if (o.hair === 'bob') {
    s += `<path d="M${-hr - 4},${hy + 6}C${-hr - 6},${hy - 20} ${-16},${hy - hr - 4} 0,${hy - hr - 4}C16,${hy - hr - 4} ${hr + 6},${hy - 20} ${hr + 4},${hy + 6}C${hr + 4},${hy + 16} ${hr},${hy + 20} ${hr - 6},${hy + 20}H${-hr + 6}C${-hr},${hy + 20} ${-hr - 4},${hy + 16} ${-hr - 4},${hy + 6}Z" fill="${hairC}" stroke="${ink}"/>`;
  }
  s += `<circle cx="0" cy="${hy}" r="${o.hat === 'scarf' ? hr - 2 : hr}" fill="${skin}" stroke="${ink}"/>`;
  if (o.hair === 'bob') {
    s += `<path d="M${-hr + 1},${hy - 4}C${-hr + 2},${hy - hr + 2} ${hr - 2},${hy - hr + 2} ${hr - 1},${hy - 4}C${hr - 10},${hy - 14} ${hr - 18},${hy - 10} ${hr - 22},${hy - 16}C${-6},${hy - 8} ${-hr + 10},${hy - 12} ${-hr + 1},${hy - 4}Z" fill="${hairC}"/>`;
  } else if (o.hair === 'short' || o.hair === 'tuft') {
    s += `<path d="M${-hr + 1},${hy - 6}C${-hr + 2},${hy - hr - 2} ${hr - 2},${hy - hr - 2} ${hr - 1},${hy - 6}C${hr - 8},${hy - 12} ${-hr + 8},${hy - 12} ${-hr + 1},${hy - 6}Z" fill="${hairC}" stroke="${ink}" stroke-width="2.5"/>`;
  }
  // face
  const ex = hr * 0.36;
  const ey = hy + 4;
  const bino = o.armL === 'bino'; // eyes hidden behind binoculars (drawn below)
  if (!bino && o.eyes === 'happy') {
    s += `<path d="M${f(-ex - 4.5)},${ey + 1}Q${f(-ex)},${ey - 5} ${f(-ex + 4.5)},${ey + 1}M${f(ex - 4.5)},${ey + 1}Q${f(ex)},${ey - 5} ${f(ex + 4.5)},${ey + 1}" fill="none" stroke="${ink}" stroke-width="3"/>`;
  } else if (!bino) {
    s +=
      `<ellipse cx="${f(-ex)}" cy="${ey}" rx="3.8" ry="4.8" fill="${T(EYE)}"/><ellipse cx="${f(ex)}" cy="${ey}" rx="3.8" ry="4.8" fill="${T(EYE)}"/>` +
      `<circle cx="${f(-ex + 1.3)}" cy="${ey - 1.8}" r="1.4" fill="#fff"/><circle cx="${f(ex + 1.3)}" cy="${ey - 1.8}" r="1.4" fill="#fff"/>`;
  }
  s += `<ellipse cx="${f(-hr * 0.63)}" cy="${hy + 12}" rx="5.5" ry="3.4" fill="${T(BLUSH)}" opacity=".55"/><ellipse cx="${f(hr * 0.63)}" cy="${hy + 12}" rx="5.5" ry="3.4" fill="${T(BLUSH)}" opacity=".55"/>`;
  if (o.mustache) {
    s += `<path d="M0,${hy + 12}C-4,${hy + 9} -11,${hy + 9} -14,${hy + 15}C-9,${hy + 13} -4,${hy + 15} 0,${hy + 14}C4,${hy + 15} 9,${hy + 13} 14,${hy + 15}C11,${hy + 9} 4,${hy + 9} 0,${hy + 12}Z" fill="${T(o.mustache)}" stroke="${ink}" stroke-width="1.5"/>`;
    s += `<path d="M-4,${hy + 19}Q0,${hy + 21} 4,${hy + 19}" fill="none" stroke="${ink}" stroke-width="2.4"/>`;
  } else if (o.beard) {
    // full rounded beard from the sideburns, open around the smile, hanging onto the chest
    const bc = T(o.beard);
    s +=
      `<path d="M${-hr + 3},${hy + 4}C${-hr + 1},${hy + 34} -8,${hy + 46} 0,${hy + 46}C8,${hy + 46} ${hr - 1},${hy + 34} ${hr - 3},${hy + 4}C${hr - 8},${hy + 18} 10,${hy + 25} 0,${hy + 25}C-10,${hy + 25} ${-hr + 8},${hy + 18} ${-hr + 3},${hy + 4}Z" fill="${bc}" stroke="${ink}" stroke-width="2.5"/>` +
      `<path d="M0,${hy + 13}C-4,${hy + 10} -11,${hy + 10} -13,${hy + 16}C-8,${hy + 14} -4,${hy + 16} 0,${hy + 15}C4,${hy + 16} 8,${hy + 14} 13,${hy + 16}C11,${hy + 10} 4,${hy + 10} 0,${hy + 13}Z" fill="${bc}" stroke="${ink}" stroke-width="1.8"/>` +
      `<path d="M-4,${hy + 19.5}Q0,${hy + 22} 4,${hy + 19.5}" fill="none" stroke="${ink}" stroke-width="2.4"/>`;
  } else {
    s += `<path d="M-6,${hy + 13}Q0,${hy + 19} 6,${hy + 13}" fill="none" stroke="${ink}" stroke-width="2.6"/>`;
  }
  // binoculars over the eyes
  if (bino) {
    const bc = T('#3d3434');
    const br = T('#d99a1e');
    s +=
      `<rect x="-17" y="${ey - 9}" width="14" height="17" rx="4" fill="${bc}" stroke="${ink}" stroke-width="2.5"/><rect x="3" y="${ey - 9}" width="14" height="17" rx="4" fill="${bc}" stroke="${ink}" stroke-width="2.5"/>` +
      `<rect x="-5" y="${ey - 4}" width="10" height="6" fill="${bc}" stroke="${ink}" stroke-width="2"/>` +
      `<path d="M-15,${ey + 6}h10M5,${ey + 6}h10" stroke="${br}" stroke-width="3"/>`;
    s += hand(-11, hy + 12) + hand(11, hy + 12);
  }
  // hats
  const hb = hy - hr + 9;
  if (o.hat === 'fez') {
    const fz = T('#c42a30');
    s +=
      `<path d="M-16,${hb}L-13,${hb - 26}Q0,${hb - 29} 13,${hb - 26}L16,${hb}Q0,${hb + 5} -16,${hb}Z" fill="${fz}" stroke="${ink}"/>` +
      `<path d="M-16,${hb}L-13,${hb - 26}Q-8,${hb - 27.5} -4,${hb - 28}L-5,${hb + 3}Q-11,${hb + 2.5} -16,${hb}Z" fill="${T('#9a1c24')}"/>` +
      `<path d="M0,${hb - 28}C9,${hb - 28} 15,${hb - 22} 16,${hb - 11}" fill="none" stroke="${T('#2e2828')}" stroke-width="3"/>` +
      `<path d="M13,${hb - 13}L12,${hb - 3}L20,${hb - 3}L18,${hb - 13}Z" fill="${T('#2e2828')}"/>`;
  } else if (o.hat === 'turban') {
    const tc = T(o.hatColor || '#fff6e2');
    const ts = T(dk(o.hatColor || '#fff6e2', 0.16));
    s +=
      `<path d="M${-hr - 2},${hy - 4}C${-hr - 5},${hy - 36} -14,${hy - 47} 0,${hy - 47}C14,${hy - 47} ${hr + 5},${hy - 36} ${hr + 2},${hy - 4}C${hr - 10},${hy - 13} ${-hr + 10},${hy - 13} ${-hr - 2},${hy - 4}Z" fill="${tc}" stroke="${ink}"/>` +
      `<path d="M${-hr},${hy - 16}C-12,${hy - 30} 14,${hy - 32} ${hr + 1},${hy - 20}M${-hr + 3},${hy - 26}C-8,${hy - 40} 12,${hy - 42} ${hr - 2},${hy - 30}" fill="none" stroke="${ts}" stroke-width="3"/>` +
      `<circle cx="0" cy="${hy - 22}" r="4" fill="${T(o.gem || '#2ec4c6')}" stroke="${ink}" stroke-width="2"/>`;
  } else if (o.hat === 'pith') {
    const kh = T('#efdfae');
    const khS = T('#d6c08a');
    s +=
      `<ellipse cx="0" cy="${hb + 1}" rx="39" ry="8" fill="${khS}" stroke="${ink}"/>` +
      `<path d="M-25,${hb}C-26,${hb - 32} 26,${hb - 32} 25,${hb}Z" fill="${kh}" stroke="${ink}"/>` +
      `<path d="M-25,${hb - 5}Q0,${hb - 1} 25,${hb - 5}" fill="none" stroke="${T('#8a6a3a')}" stroke-width="4"/>` +
      `<circle cx="0" cy="${hb - 24}" r="3" fill="${khS}" stroke="${ink}" stroke-width="2"/>`;
  } else if (o.hat === 'sunhat') {
    const st = T('#f7e2a6');
    const rb = T(o.hatColor || '#6a45a8');
    s +=
      `<ellipse cx="0" cy="${hb + 2}" rx="47" ry="10" fill="${st}" stroke="${ink}"/>` +
      `<path d="M-22,${hb + 1}C-22,${hb - 26} 22,${hb - 26} 22,${hb + 1}Z" fill="${st}" stroke="${ink}"/>` +
      `<path d="M-22,${hb - 5}Q0,${hb - 1} 22,${hb - 5}L22,${hb + 1}Q0,${hb + 5} -22,${hb + 1}Z" fill="${rb}" stroke="${ink}" stroke-width="2.5"/>` +
      `<circle cx="16" cy="${hb - 4}" r="6" fill="${T('#e0344f')}" stroke="${ink}" stroke-width="2.5"/><circle cx="16" cy="${hb - 4}" r="2" fill="${T('#fde88f')}"/>`;
  } else if (o.hat === 'cap') {
    const cc = T(o.hatColor || '#7a8a9a');
    s +=
      `<path d="M${-hr + 1},${hy - 8}C${-hr},${hy - hr - 12} ${hr},${hy - hr - 12} ${hr - 1},${hy - 8}Q0,${hy - 14} ${-hr + 1},${hy - 8}Z" fill="${cc}" stroke="${ink}"/>` +
      `<path d="M-4,${hy - 11}C8,${hy - 14} 24,${hy - 12} 32,${hy - 6}C24,${hy - 3} 10,${hy - 5} -4,${hy - 8}Z" fill="${T(dk(o.hatColor || '#7a8a9a', 0.2))}" stroke="${ink}" stroke-width="2.5"/>` +
      `<circle cx="0" cy="${hy - hr - 4}" r="3" fill="${cc}" stroke="${ink}" stroke-width="2"/>`;
  } else if (o.hat === 'scarf') {
    s += `<path d="M${-hr + 1},${hy - 6}C${-hr + 2},${hy - hr - 6} ${hr - 2},${hy - hr - 6} ${hr - 1},${hy - 6}C${hr - 8},${hy - 16} ${-hr + 8},${hy - 16} ${-hr + 1},${hy - 6}Z" fill="${T(o.hatColor)}" stroke="${ink}" stroke-width="2.5"/>`;
  }
  return s;
}

// ---------------------------------------------------------------- camels
/** cute resting (kushed) dromedary, facing right, ground at y=0, ~260 wide */
function restingCamel(P, o) {
  const T = P.t;
  const ink = P.ink;
  const body = T('#d9a86c');
  const sh = T('#b8844a');
  const muz = T('#f0cf9c');
  const tuft = T('#c48e55');
  const [b0, , b2] = C[o.blanket].map(T);
  const stripe = T(C[o.stripe][0]);
  const pom = [T(C[o.stripe][0]), T('#fff3d4'), T(C[o.pom || 'yellow'][0])];
  const bodyD =
    'M-108,-6C-122,-26 -118,-58 -94,-66C-88,-112 -18,-122 2,-78C22,-86 40,-116 58,-142L94,-128C76,-108 64,-82 50,-52C54,-32 48,-6 30,-4Z';
  let s = shadow(P, 0, -2, 130, 12, o.wx ?? 0);
  s += `<g stroke-width="${o.sw || 3.5}">`;
  // tail
  s += limb(P, 'M-112,-42Q-128,-36 -124,-16', 4.5, body, 3) + `<path d="M-124,-20C-132,-16 -130,-4 -122,-4C-116,-8 -118,-16 -124,-20Z" fill="${tuft}" stroke="${ink}"/>`;
  // body
  s += `<path d="${bodyD}" fill="${body}"/>`;
  s += `<path d="M-111,-14C-96,-24 -40,-26 45,-22C47,-12 42,-5 30,-4L-104,-5Z" fill="${sh}"/>`;
  s += `<path d="M50,-52C62,-80 74,-106 92,-127L87,-131C70,-108 58,-82 46,-58Z" fill="${sh}" opacity=".6"/>`;
  // saddle blanket over the hump (its top edge is the hump outline, re-stroked afterwards)
  s += `<path d="M-94,-66C-88,-112 -18,-122 2,-78L7,-44L-96,-44Z" fill="${b0}"/>`;
  s += `<path d="M-96,-58C-60,-64 -20,-64 5,-60L6,-51C-20,-55 -60,-55 -96,-49Z" fill="${stripe}"/>`;
  s += `<path d="M-80,-86C-60,-104 -26,-106 -8,-88" fill="none" stroke="${T(C[o.blanket][1])}" stroke-width="5"/>`;
  s += `<path d="M-94,-66C-88,-112 -18,-122 2,-78L7,-44L-96,-44Z" fill="none" stroke="${ink}"/>`;
  // fringe
  let fr = '';
  for (let i = 0; i < 8; i++) {
    const x = 1 - i * 13;
    fr += `M${x},-44L${x - 6.5},-33L${x - 13},-44`;
  }
  s += `<path d="${fr}Z" fill="${b2}" stroke="${ink}" stroke-width="2.5"/>`;
  for (let i = 0; i < 8; i++) s += `<circle cx="${f(1 - i * 13 - 6.5)}" cy="-31" r="3.6" fill="${pom[i % 3]}" stroke="${ink}" stroke-width="2"/>`;
  s += `<path d="${bodyD}" fill="none" stroke="${ink}"/>`;
  s += `<path d="M-97,-8C-100,-34 -72,-44 -58,-26" fill="none" stroke="${ink}" stroke-width="3"/>`;
  // folded front legs
  s += `<path d="M10,-3C12,-22 50,-26 64,-12C70,-6 68,1 58,1H14C10,1 9,-1 10,-3Z" fill="${body}" stroke="${ink}"/>`;
  s += `<ellipse cx="55" cy="-9" rx="7.5" ry="5.5" fill="${sh}"/>`;
  s += `<path d="M58,1C64,1 70,-2 70,-6" fill="none" stroke="${ink}" stroke-width="3"/>`;
  // ear + head
  s += `<path d="M68,-165C58,-178 64,-192 76,-183C80,-178 79,-171 75,-166Z" fill="${body}" stroke="${ink}"/>`;
  s += `<path d="M60,-150C58,-176 92,-188 114,-176C130,-168 142,-150 138,-134C134,-118 118,-112 100,-116C80,-120 62,-130 60,-150Z" fill="${body}" stroke="${ink}"/>`;
  s += `<path d="M112,-151C124,-157 134,-149 135.5,-136C135,-124 123,-118.5 107,-120.5C102,-130 103,-144 112,-151Z" fill="${muz}"/>`;
  s += `<path d="M79,-179C76,-190 87,-194 91,-186C94,-195 105,-193 103,-182C99,-186 86,-186 79,-179Z" fill="${tuft}" stroke="${ink}" stroke-width="2.5"/>`;
  // face
  if (o.eyes === 'happy') {
    s += `<path d="M92,-154Q99.5,-163 107,-154" fill="none" stroke="${ink}" stroke-width="3.2"/>`;
    s += `<path d="M93,-156L88,-160M97,-159.5L94,-165M102,-160L101,-166" fill="none" stroke="${ink}" stroke-width="2.6"/>`;
  } else {
    s += `<ellipse cx="99" cy="-156" rx="5.2" ry="6.6" fill="${T(EYE)}"/><circle cx="100.8" cy="-158.6" r="1.9" fill="#fff"/>`;
    s += `<path d="M94,-160L88.5,-164.5M97,-162.8L94.5,-169M101.5,-163L101,-169.5" fill="none" stroke="${ink}" stroke-width="2.6"/>`;
  }
  s += `<ellipse cx="116" cy="-139" rx="7" ry="4.2" fill="${T(BLUSH)}" opacity=".6"/>`;
  s += `<path d="M128.5,-146.5q4.5,-1 6.5,3" fill="none" stroke="${ink}" stroke-width="2.6"/>`;
  s += `<path d="M120,-127q8,5 15,-1.5" fill="none" stroke="${ink}" stroke-width="2.8"/>`;
  s += '</g>';
  return s;
}

/** little walking caravan camel with a rider (defs; blanket = inherited fill, robe = currentColor) */
function caravanCamelDef(P, gid, pose, skin) {
  const ink = mix(P.ink, P.haze, 0.2);
  const k = 0.12;
  const body = P.far('#d9a86c', k);
  const sh = P.far('#b8844a', k);
  const sk = P.far(skin, k);
  const cream = P.far('#fff6e2', k);
  const L = pose
    ? [[-24, -28, -18, 1], [32, 26, 22, 1], [-14, -8, -26, 0], [22, 28, 38, 0]]
    : [[-24, -20, -30, 1], [32, 36, 42, 1], [-14, -18, -8, 0], [22, 20, 14, 0]];
  const leg = ([x0, xm, x1, far]) =>
    `<path d="M${x0},-62Q${xm},-32 ${x1},-2" fill="none" stroke="${ink}" stroke-width="14"/><path d="M${x0},-62Q${xm},-32 ${x1},-2" fill="none" stroke="${far ? sh : body}" stroke-width="7"/>`;
  return (
    `<g id="${gid}" stroke-width="4">` +
    leg(L[0]) + leg(L[1]) +
    `<path d="M-42,-86Q-54,-80 -50,-60" fill="none" stroke="${ink}" stroke-width="4"/>` +
    `<path d="M40,-96C56,-104 62,-124 70,-138L86,-130C76,-116 70,-94 52,-72Z" fill="${body}" stroke="${ink}"/>` +
    `<path d="M-42,-82C-48,-100 -32,-110 -16,-104C-6,-136 32,-136 38,-102C50,-98 58,-88 54,-76C50,-62 28,-58 4,-58C-22,-58 -38,-64 -42,-82Z" fill="${body}" stroke="${ink}"/>` +
    `<path d="M-40,-72C-24,-62 30,-60 52,-72C50,-62 28,-58 4,-58C-22,-58 -36,-62 -40,-72Z" fill="${sh}"/>` +
    `<path d="M-14,-104C-4,-132 30,-132 36,-102L38,-80L-18,-80Z" stroke="${ink}"/>` +
    `<path d="M-18,-80L38,-80" stroke="${cream}" stroke-width="4" stroke-dasharray="1 6"/>` +
    leg(L[2]) + leg(L[3]) +
    `<path d="M70,-148l-5,-9l9,4Z" fill="${body}" stroke="${ink}" stroke-width="3"/>` +
    `<path d="M64,-142C66,-156 86,-158 96,-146C102,-140 100,-130 92,-128C82,-126 70,-130 64,-142Z" fill="${body}" stroke="${ink}"/>` +
    `<circle cx="82" cy="-144" r="2.6" fill="${ink}"/>` +
    // rider
    limb({ ink }, 'M12,-112Q14,-100 22,-92', 7, 'currentColor', 3.5) +
    `<path d="M-2,-126C-4,-146 28,-146 26,-126L28,-108H-4Z" fill="currentColor" stroke="${ink}"/>` +
    limb({ ink }, 'M20,-136Q32,-128 40,-124', 6, 'currentColor', 3.5) +
    `<path d="M42,-124L94,-134" stroke="${ink}" stroke-width="1.6"/>` +
    `<circle cx="42" cy="-124" r="5" fill="${sk}" stroke="${ink}" stroke-width="3"/>` +
    `<circle cx="12" cy="-156" r="13" fill="${sk}" stroke="${ink}"/>` +
    `<path d="M-2,-158C-3,-176 27,-176 26,-158C18,-164 6,-164 -2,-158Z" fill="${cream}" stroke="${ink}"/>` +
    `<circle cx="16" cy="-154" r="2.4" fill="${ink}"/>` +
    '</g>'
  );
}

// ---------------------------------------------------------------- sky
function skyLayer(P, id, defs, spark) {
  const g = id('sky');
  defs.push(lin(g, 0, 0, 0, 470, P.sky));
  let s = `<rect width="1600" height="1000" fill="url(#${g})"/>`;
  if (P.night) s += starsLayer(P, spark);
  const { x, y, r } = P.orb;
  P.haloOp.forEach((op, i) => {
    s += `<circle cx="${x}" cy="${y}" r="${f(r * P.haloK[i])}" fill="${P.halo}" opacity="${op}"/>`;
  });
  if (P.night) {
    s += `<path d="${crescent(x, y, r, r * 0.52, -r * 0.3, r * 0.86)}" fill="${P.orbC}"/>`;
    s += `<circle cx="${f(x - r * 0.62)}" cy="${f(y + r * 0.1)}" r="${f(r * 0.1)}" fill="#e8d9a4" opacity=".7"/><circle cx="${f(x - r * 0.35)}" cy="${f(y + r * 0.55)}" r="${f(r * 0.07)}" fill="#e8d9a4" opacity=".7"/>`;
  } else {
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${P.orbC}"/>`;
    s += `<path d="M${f(x - r * 0.66)},${f(y - r * 0.12)}A${f(r * 0.68)},${f(r * 0.68)} 0 0 1 ${f(x - r * 0.12)},${f(y - r * 0.66)}" fill="none" stroke="${P.orbHi}" stroke-width="${f(r * 0.15)}"/>`;
  }
  return s;
}
function starsLayer(P, sp) {
  const rnd = rng(11);
  const lv = ['', '', ''];
  for (let i = 0; i < 90; i++) {
    const x = rnd() * 1600;
    const y = 6 + rnd() * rnd() * 400 + rnd() * 40;
    const r = 0.7 + rnd() * rnd() * 2.3;
    const o = Math.floor(rnd() * 3);
    if (Math.hypot(x - P.orb.x, y - P.orb.y) < 80) continue;
    lv[o] += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`;
  }
  let s = `<g fill="#fff6d8"><g opacity=".4">${lv[0]}</g><g opacity=".7">${lv[1]}</g>${lv[2]}`;
  const big = [
    [120, 70, 0.9], [300, 205, 0.55], [470, 58, 0.7], [612, 150, 0.5], [735, 40, 0.8], [860, 250, 0.45],
    [1090, 60, 0.75], [1185, 215, 0.5], [1330, 100, 0.9], [1470, 190, 0.6], [1560, 50, 0.7], [210, 300, 0.45],
    [1400, 300, 0.4], [545, 290, 0.45], [60, 200, 0.5], [1040, 330, 0.35], [680, 330, 0.3],
  ];
  for (const [x, y, k] of big) s += `<use href="#${sp}" transform="translate(${x} ${y}) scale(${k})"/>`;
  return s + '</g>';
}
function cloudsLayer(P, id, defs) {
  const a = id('ca');
  const b = id('cb');
  defs.push(
    `<path id="${a}" d="M-100,0A24,24 0 0 1 -80,-30A36,36 0 0 1 -28,-58A44,44 0 0 1 40,-52A28,28 0 0 1 84,-24A20,20 0 0 1 100,0Z"/>` +
      `<path id="${b}" d="M-64,0A20,20 0 0 1 -40,-26A30,30 0 0 1 10,-40A24,24 0 0 1 48,-20A16,16 0 0 1 64,0Z"/>`
  );
  const one = (ref, x, y, k, flip) =>
    `<g transform="translate(${x} ${y}) scale(${flip ? -k : k} ${k})"><use href="#${ref}" fill="${P.cloudHi}"/>` +
    `<use href="#${ref}" fill="${P.cloud}" transform="translate(5 5)"/><use href="#${ref}" fill="${P.cloudLo}" transform="translate(5 5) scale(1 .3)"/></g>`;
  return (
    one(a, 175, 222, 1, false) +
    one(b, 440, 142, 0.85, true) +
    one(b, 668, 266, 0.5, false) +
    one(a, 1290, 180, 0.9, true) +
    one(b, 1505, 276, 0.72, false)
  );
}
function birdsLayer(P, id, defs) {
  const ink = mix(P.ink, P.haze, 0.25);
  const white = P.far('#fbf7ee', 0.12);
  const black = P.far('#2e2828', 0.12);
  const ib = id('ib');
  const ib2 = id('ib2');
  const ibis = (gid, up) =>
    `<g id="${gid}" stroke-width="1.6">` +
    `<path d="M-10,1L-24,4" stroke="${black}" stroke-width="1.8"/>` +
    (up
      ? `<path d="M-6,-1C-8,-12 -2,-20 8,-24C4,-14 6,-7 5,-1Z" fill="${white}" stroke="${ink}"/><path d="M8,-24C4,-18 3,-16 2,-12L6,-14C6,-18 7,-21 8,-24Z" fill="${black}"/>`
      : `<path d="M-6,1C-8,10 -4,18 4,22C2,13 4,6 5,1Z" fill="${white}" stroke="${ink}"/><path d="M4,22C2,17 1,14 0,11L4,12C3,15 3,18 4,22Z" fill="${black}"/>`) +
    `<ellipse cx="0" cy="0" rx="12" ry="5" fill="${white}" stroke="${ink}"/>` +
    `<path d="M10,-1L20,-4" stroke="${black}" stroke-width="3"/><circle cx="21" cy="-4" r="3.3" fill="${black}"/>` +
    `<path d="M23.5,-4.5C29,-4 32,-1 33,4" fill="none" stroke="${black}" stroke-width="1.8"/>` +
    '</g>';
  defs.push(ibis(ib, 1) + ibis(ib2, 0));
  let s = '';
  // V of ibises, flying left, over the left sky
  const v = [[618, 186, 1], [660, 170, 0], [702, 154, 1], [744, 138, 0], [660, 204, 1], [702, 222, 0]];
  v.forEach(([x, y, up], i) => {
    const k = 0.8 - i * 0.02;
    s += `<use href="#${up ? ib : ib2}" transform="translate(${x} ${y}) scale(${f(-k)} ${f(k)})"/>`;
  });
  // falcon circling on the right
  const br = P.far('#8a5a32', 0.1);
  const brD = P.far('#5e3a20', 0.1);
  const belly = P.far('#f0d2a0', 0.1);
  s +=
    `<ellipse cx="1128" cy="196" rx="74" ry="22" fill="none" stroke="${P.far('#fffaf0', 0.2)}" stroke-width="2" stroke-dasharray="3 9" opacity=".7"/>` +
    `<g transform="translate(1080 200) rotate(-8)" stroke="${ink}" stroke-width="1.8">` +
    `<path d="M0,-4C-14,-12 -34,-12 -54,-4C-44,-1 -34,3 -22,6C-12,7 -6,5 0,7C6,5 12,7 22,6C34,3 44,-1 54,-4C34,-12 14,-12 0,-4Z" fill="${br}"/>` +
    `<path d="M-54,-4C-48,-3 -44,-1 -40,1L-34,-8C-40,-8 -48,-7 -54,-4ZM54,-4C48,-3 44,-1 40,1L34,-8C40,-8 48,-7 54,-4Z" fill="${brD}" stroke="none"/>` +
    `<path d="M-5,8L-8,20Q0,23 8,20L5,8Z" fill="${brD}"/>` +
    `<ellipse cx="0" cy="2" rx="6" ry="10" fill="${belly}"/>` +
    `<circle cx="0" cy="-8" r="5" fill="${br}"/>` +
    '</g>';
  return s;
}

// ---------------------------------------------------------------- far layer
function skylineLayer(P) {
  const c = P.far('#e9c48c', 0.55);
  const c2 = P.far('#d9ab72', 0.55);
  let s =
    `<g fill="${c}">` +
    `<rect x="30" y="392" width="150" height="80"/><path d="M60,394C60,350 140,350 140,394Z"/><rect x="97" y="334" width="6" height="22"/><circle cx="100" cy="332" r="4"/>` +
    `<path d="M196,470V318H214V470Z"/><path d="M189,352H221V361H189Z"/><path d="M193,318L205,288L217,318Z"/><circle cx="205" cy="285" r="3"/>` +
    `<rect x="236" y="408" width="120" height="64"/><path d="M262,410C262,374 322,374 322,410Z"/><rect x="289" y="358" width="5" height="18"/>` +
    `<path d="M380,470V352H392V470Z"/><path d="M375,370H397V377H375Z"/><path d="M380,352L386,332L392,352Z"/>` +
    '</g>' +
    `<g fill="${c2}"><path d="M100,352C120,354 138,370 140,394H100Z"/><path d="M205,318V470H214V318Z"/><path d="M292,376C308,378 320,392 322,410H292Z"/><rect x="30" y="392" width="30" height="80"/></g>`;
  if (P.night) {
    const w = '#ffd36a';
    s += `<g fill="${w}"><rect x="48" y="420" width="7" height="10" rx="3"/><rect x="150" y="416" width="7" height="10" rx="3"/><rect x="202" y="372" width="6" height="9" rx="3"/><rect x="258" y="430" width="7" height="10" rx="3"/><rect x="330" y="424" width="7" height="10" rx="3"/><rect x="118" y="440" width="7" height="10" rx="3"/></g>`;
  }
  return s;
}
function pyramid(P, cx, ay, half, by, k, lines) {
  const lit = mix(P.pyrLit, P.haze, k);
  const sh = mix(P.pyrShade, P.haze, k);
  const ln = mix(P.pyrLine, P.haze, k);
  const rx = cx + half * 0.24;
  const ry = by + 5;
  let s = `<path d="M${cx},${ay}L${cx - half},${by}L${f(rx)},${ry}Z" fill="${sh}"/><path d="M${cx},${ay}L${f(rx)},${ry}L${cx + half},${by}Z" fill="${lit}"/>`;
  if (lines) {
    let d = '';
    for (let i = 1; i <= lines; i++) {
      const t = i / (lines + 1) + 0.05;
      const y = ay + (by - ay) * t;
      const xl = cx - half * t;
      const xm = cx + (rx - cx) * t;
      const ym = ay + (ry - ay) * t;
      const xr = cx + half * t;
      d += `M${f(xl + 7)},${f(y)}L${f(xm - 5)},${f(ym)}M${f(xm + 5)},${f(ym)}L${f(xr - 7)},${f(y)}`;
    }
    s += `<path d="${d}" fill="none" stroke="${ln}" stroke-width="2.5" stroke-dasharray="20 8" opacity=".55"/>`;
  }
  return s;
}
function pyramidsLayer(P, sp) {
  let s = pyramid(P, 598, 334, 112, 458, 0.36, 0) + pyramid(P, 1010, 266, 168, 456, 0.2, 4) + pyramid(P, 770, 205, 215, 452, 0, 6);
  if (P.sunset) {
    // the low sun rims the slopes that face it
    s += `<path d="M770,205L985,452M1010,266L842,456" fill="none" stroke="${P.rim}" stroke-width="3" opacity=".75"/>`;
  } else if (P.rim) {
    // crisp light edge on the ridges
    s += `<path d="M770,205L821.6,457M1010,266L1050.3,461" fill="none" stroke="${P.rim}" stroke-width="2.5" opacity=".7"/>`;
  }
  // golden capstone with a glint
  s +=
    `<path d="M770,205L744.2,234.6L776.2,235.2Z" fill="${P.capShade}"/><path d="M770,205L776.2,235.2L795.8,234.6Z" fill="${P.cap}"/>` +
    `<path d="M770,205L776.2,235.2" stroke="${P.glint}" stroke-width="2" opacity=".8"/>` +
    `<circle cx="770" cy="206" r="15" fill="${P.glint}" opacity=".35"/>` +
    `<use href="#${sp}" transform="translate(771 205) scale(2.1)" fill="${P.glint}"/>` +
    `<use href="#${sp}" transform="translate(792 222) scale(.8)" fill="${P.glint}"/>`;
  return s;
}
function sphinx(P, x, y, k) {
  const hz = 0.3;
  const B = P.far('#f1c689', hz);
  const S = P.far('#d9a466', hz);
  const D = P.far('#7a4a2c', hz);
  const Nb = P.far('#3f8fc0', hz + 0.05);
  const Ng = P.far('#f5cf5a', hz);
  return (
    `<g transform="translate(${x} ${y}) scale(${k})">` +
    `<path d="M-80,-4C-94,-4 -98,-16 -88,-22" fill="none" stroke="${S}" stroke-width="6"/>` +
    `<path d="M-82,0C-88,-24 -78,-46 -52,-48C-28,-50 0,-48 20,-44L30,0Z" fill="${B}"/>` +
    `<path d="M-82,0C-84,-8 -82,-14 -78,-18C-44,-12 -6,-12 30,-16V0Z" fill="${S}"/>` +
    `<path d="M-64,-4C-68,-22 -58,-34 -42,-32C-32,-30 -28,-18 -32,-6" fill="none" stroke="${S}" stroke-width="3.5"/>` +
    `<path d="M10,0V-16C38,-19 68,-18 84,-15C94,-13 94,0 84,0Z" fill="${B}"/>` +
    `<path d="M10,-5C40,-7 70,-7 92,-6C91,-2 88,0 84,0H10Z" fill="${S}"/>` +
    `<path d="M76,-13V-4M83,-13V-4" stroke="${S}" stroke-width="2.5"/>` +
    `<path d="M8,-42C16,-60 44,-64 56,-48C62,-36 60,-20 54,-12H12Z" fill="${B}"/>` +
    `<path d="M28,-58C24,-86 38,-102 54,-102C70,-102 84,-86 80,-58L88,-26L68,-30L62,-54H46L40,-30L20,-26Z" fill="${Ng}"/>` +
    `<path d="M24,-44L41,-45M22,-35L41,-37M84,-44L67,-45M86,-35L67,-37M31,-80C44,-90 64,-90 77,-80M28,-68L40,-70M80,-68L68,-70" fill="none" stroke="${Nb}" stroke-width="4"/>` +
    `<ellipse cx="54" cy="-66" rx="14" ry="15" fill="${B}"/>` +
    `<path d="M45,-67Q48.5,-71 52,-67M56,-67Q59.5,-71 63,-67" fill="none" stroke="${D}" stroke-width="2.2"/>` +
    `<path d="M50,-58Q54,-55 58,-58" fill="none" stroke="${D}" stroke-width="2"/>` +
    `<ellipse cx="45" cy="-61" rx="3.5" ry="2" fill="${P.t(BLUSH)}" opacity=".4"/><ellipse cx="63" cy="-61" rx="3.5" ry="2" fill="${P.t(BLUSH)}" opacity=".4"/>` +
    `<path d="M51,-51H57L56,-40C55.5,-37 52.5,-37 52,-40Z" fill="${Nb}"/>` +
    `<circle cx="54" cy="-84" r="3" fill="${Nb}"/>` +
    '</g>'
  );
}
const DUNE_A = [[-20, 442], [160, 426], [340, 440], [520, 428], [700, 442], [900, 432], [1100, 446], [1300, 428], [1480, 440], [1620, 430]];
const DUNE_B = [[-20, 468], [200, 454], [420, 470], [640, 458], [840, 472], [1060, 460], [1280, 474], [1460, 460], [1620, 470]];
const GROUND = [[-20, 512], [150, 503], [330, 514], [500, 505], [610, 496], [700, 481], [790, 463], [870, 453], [960, 452], [1050, 466], [1150, 488], [1300, 503], [1470, 496], [1620, 506]];
const dunePath = (pts) => `${smooth(pts)}L1620,1000L-20,1000Z`;

// ---------------------------------------------------------------- middle distance
function caravanLayer(P, id, defs, crestY) {
  const A = id('cvA');
  const B = id('cvB');
  defs.push(caravanCamelDef(P, A, 0, '#a86d45') + caravanCamelDef(P, B, 1, '#e8b48a'));
  const kits = [['red', 'blue'], ['yellow', 'green'], ['blue', 'purple'], ['purple', 'red'], ['green', 'yellow']];
  let s = '';
  [748, 804, 860, 916, 972].forEach((x, i) => {
    const y = crestY(x) + 2;
    const slope = (crestY(x + 12) - crestY(x - 12)) / 24;
    const ang = (Math.atan(slope) * 180) / Math.PI;
    const bl = P.far(C[kits[i][0]][0], 0.12);
    const rb = P.far(C[kits[i][1]][0], 0.12);
    s += `<use href="#${i % 2 ? B : A}" transform="translate(${f(x)} ${f(y)}) rotate(${f(ang)}) scale(.36)" fill="${bl}" color="${rb}"/>`;
  });
  // guide on foot, leading the caravan
  const gx = 1016;
  const gy = crestY(gx) + 1;
  s +=
    `<g transform="translate(${gx} ${f(gy)}) scale(.27)">` +
    person(P, { skin: '#7a4a2c', robe: '#f6f1e7', hat: 'turban', hatColor: '#e0344f', armL: 'down', armR: 'hold', eyes: 'happy', wx: gx }) +
    '</g>' +
    `<path d="M${gx - 4},${f(gy - 26)}Q${gx - 22},${f(gy - 20)} ${gx - 38},${f(gy - 44)}" fill="none" stroke="${mix(P.ink, P.haze, 0.2)}" stroke-width="1.4"/>`;
  return s;
}
function gazelleDefs(P, id, defs) {
  const ink = mix(P.ink, P.haze, 0.15);
  const k = 0.1;
  const b = P.far('#dca062', k);
  const w = P.far('#fff3d4', k);
  const d = P.far('#7a4a2c', k);
  const legs = (arr, c) =>
    arr.map((q) => `<path d="${q}" fill="none" stroke="${ink}" stroke-width="10"/><path d="${q}" fill="none" stroke="${c}" stroke-width="4.5"/>`).join('');
  const torso =
    `<path d="M28,-62C34,-78 38,-88 42,-96L52,-92C48,-82 44,-68 40,-56Z" fill="${b}" stroke="${ink}"/>` +
    `<path d="M-36,-52C-38,-68 -18,-74 0,-72C18,-74 36,-70 40,-58C42,-46 30,-40 16,-40H-22C-32,-40 -36,-46 -36,-52Z" fill="${b}" stroke="${ink}"/>` +
    `<path d="M-32,-46C-12,-40 16,-40 36,-47C32,-40 20,-40 16,-40H-22C-28,-40 -31,-42 -32,-46Z" fill="${w}"/>` +
    `<path d="M-30,-52C-10,-47 14,-47 34,-53" fill="none" stroke="${d}" stroke-width="3"/>` +
    `<path d="M-36,-56L-44,-50" stroke="${d}" stroke-width="4"/>` +
    `<path d="M44,-104C42,-118 46,-128 52,-134M50,-104C50,-118 56,-126 62,-130" fill="none" stroke="${d}" stroke-width="3.5"/>` +
    `<path d="M40,-98L32,-106L42,-104Z" fill="${b}" stroke="${ink}" stroke-width="2.5"/>` +
    `<path d="M38,-100C40,-110 54,-110 60,-102C64,-96 60,-90 54,-90C46,-90 40,-94 38,-100Z" fill="${b}" stroke="${ink}"/>` +
    `<circle cx="49" cy="-100" r="2.4" fill="${ink}"/>`;
  const st = id('gz');
  const lp = id('gz2');
  defs.push(
    `<g id="${st}" stroke-width="3">` +
      legs(['M-26,-44Q-30,-22 -28,0', 'M30,-44Q32,-22 34,0'], dk(b, 0.15)) +
      torso +
      legs(['M-18,-44Q-16,-22 -20,0', 'M22,-44Q24,-22 22,0'], b) +
      '</g>' +
      `<g id="${lp}" stroke-width="3"><g transform="rotate(-12)">` +
      legs(['M-24,-46Q-40,-40 -60,-38', 'M30,-46Q44,-40 62,-50'], dk(b, 0.15)) +
      torso +
      legs(['M-18,-44Q-34,-34 -54,-30', 'M24,-44Q40,-34 56,-40'], b) +
      '</g></g>'
  );
  return { st, lp };
}

// ---------------------------------------------------------------- bazaar
function lanternDef(P, gid) {
  const ink = P.ink;
  return (
    `<g id="${gid}" stroke-width="2">` +
    `<path d="M0,-9V0" fill="none" stroke="${ink}"/>` +
    `<path d="M-5,0H5L7,5H-7Z" fill="${P.t('#f2b84b')}" stroke="${ink}"/>` +
    `<path d="M-7,5C-12,11 -12,19 -6,24H6C12,19 12,11 7,5Z" stroke="${ink}"/>` +
    `<path d="M-3.5,8C-6,12 -6,17 -3,21" fill="none" stroke="#fff" stroke-width="1.8" opacity=".6"/>` +
    `<path d="M-6,24H6L0,31Z" fill="${P.t('#d99a1e')}" stroke="${ink}"/>` +
    '</g>'
  );
}
function rug(P, x, y, w, h, a, b) {
  const ink = P.ink;
  const A = P.t(C[a][0]);
  const B = P.t(C[b][0]);
  const cream = P.t('#fff3d4');
  let fr = '';
  for (let i = 3; i < w; i += 5) fr += `M${x + i},${y + h}v6`;
  return (
    `<path d="${fr}" stroke="${cream}" stroke-width="2"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${A}" stroke="${ink}" stroke-width="2.2"/>` +
    `<rect x="${x + 5}" y="${y + 5}" width="${w - 10}" height="${h - 10}" fill="none" stroke="${B}" stroke-width="3"/>` +
    `<path d="M${x + w / 2},${y + 12}L${x + w - 10},${y + h / 2}L${x + w / 2},${y + h - 12}L${x + 10},${y + h / 2}Z" fill="${cream}" stroke="${B}" stroke-width="2.5"/>` +
    `<circle cx="${x + w / 2}" cy="${y + h / 2}" r="3" fill="${B}"/>`
  );
}
/** repeated bazaar props, defined once; body colours come from the <use> (fill / currentColor) */
function bazaarDefs(P, id, defs) {
  const T = P.t;
  const ink = P.ink;
  const D = { lan: id('ln'), bun: id('bn'), jar: id('jr'), bowl: id('bw'), bask: id('bk'), pot: id('tp'), amph: id('am'), sack: id('sk') };
  const wick = T('#c98a4a');
  const wickD = T('#9a5f30');
  const gold = T('#f2b84b');
  const goldD = T('#d99a1e');
  const goldL = T('#fbe08a');
  const fruit = [[-7, -12], [1, -14], [8, -11], [-2, -8]];
  defs.push(
    lanternDef(P, D.lan) +
      `<path id="${D.bun}" d="M-6.5,0H6.5L0,14Z" stroke="${ink}" stroke-width="2"/>` +
      `<g id="${D.jar}" stroke="${ink}" stroke-width="2.4"><path d="M-6,-40H6V-34C18,-28 20,-10 12,-2C8,1 -8,1 -12,-2C-20,-10 -18,-28 -6,-34Z"/>` +
      `<path d="M-15,-20C-8,-17 8,-17 15,-20" fill="none" stroke="${goldL}" stroke-width="3"/><path d="M-8,-42H8" stroke-width="4"/></g>` +
      `<g id="${D.bowl}" stroke="${ink}" stroke-width="2.2"><path d="M-11,-10C-10,-26 10,-26 11,-10Z"/><path d="M-13,-11H13L9,0H-9Z" fill="${wick}"/><path d="M-11,-6H11" stroke="${wickD}" stroke-width="2"/></g>` +
      `<g id="${D.bask}"><g fill="${ink}">${fruit.map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="7"/>`).join('')}</g>` +
      fruit.map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="5"/>`).join('') +
      `<circle cx="-3" cy="-15" r="1.6" fill="currentColor"/><circle cx="6" cy="-13" r="1.6" fill="currentColor"/>` +
      `<path d="M-15,-10H15L11,0H-11Z" fill="${wick}" stroke="${ink}" stroke-width="2.2"/><path d="M-12,-5H12" stroke="${wickD}" stroke-width="2"/></g>` +
      `<g id="${D.pot}" stroke="${ink}" stroke-width="2.4"><path d="M-12,0C-16,-10 -12,-20 0,-20C12,-20 16,-10 12,0Z" fill="${gold}"/>` +
      `<path d="M12,-12C20,-14 22,-20 26,-24" fill="none" stroke-width="5"/><path d="M12,-12C20,-14 22,-20 26,-24" fill="none" stroke="${gold}" stroke-width="2"/>` +
      `<path d="M-6,-20C-6,-28 6,-28 6,-20Z" fill="${goldD}"/><circle cx="0" cy="-28" r="2.5" fill="${goldD}"/>` +
      `<path d="M-12,-9C-20,-12 -20,-2 -12,-3" fill="none"/><path d="M-6,-14C-8,-10 -8,-6 -6,-4" fill="none" stroke="${goldL}" stroke-width="2.5"/></g>` +
      `<g id="${D.amph}" stroke="${ink}" stroke-width="2.6"><path d="M-7,-58H7V-50C22,-42 26,-16 14,-4C8,2 -8,2 -14,-4C-26,-16 -22,-42 -7,-50Z"/>` +
      `<path d="M-7,-50C-16,-50 -18,-40 -12,-36M7,-50C16,-50 18,-40 12,-36" fill="none"/><path d="M-18,-30C-8,-26 8,-26 18,-30" fill="none" stroke="${goldL}" stroke-width="3.5"/><path d="M-9,-60H9" stroke-width="5"/></g>` +
      `<g id="${D.sack}" stroke="${ink}"><path d="M-14,0C-18,-14 -14,-26 -10,-28H10C14,-26 18,-14 14,0Z" fill="${T('#d9b27a')}" stroke-width="2.4"/>` +
      `<ellipse cx="0" cy="-28" rx="10" ry="4" stroke-width="2.2"/><path d="M-12,-22Q0,-18 12,-22" fill="none" stroke="${T('#b08a55')}" stroke-width="2"/></g>`
  );
  return D;
}
const useAt = (ref, x, y, k = 1, fill = '', extra = '') =>
  `<use href="#${ref}" transform="translate(${f(x)} ${f(y)})${k === 1 ? '' : ` scale(${k})`}"${fill ? ` fill="${fill}"` : ''}${extra}/>`;
function goods(P, D, kind, x, y, w, ab) {
  const T = P.t;
  const ink = P.ink;
  const ct = y - 48;
  let s = '';
  switch (kind) {
    case 'rugs': {
      s += `<path d="M${x + 7},${ab + 5}H${x + w - 7}" stroke="${T('#7a4a2c')}" stroke-width="3.5"/>`;
      s += rug(P, x + 11, ab + 6, 36, 60, 'red', 'yellow') + rug(P, x + 53, ab + 6, 36, 54, 'purple', 'green');
      s += `<rect x="${x + 8}" y="${ct - 8}" width="${w - 16}" height="8" rx="3" fill="${T(C.blue[0])}" stroke="${ink}" stroke-width="2"/>`;
      s += `<rect x="${x + 12}" y="${ct - 15}" width="${w - 24}" height="7" rx="3" fill="${T(C.yellow[0])}" stroke="${ink}" stroke-width="2"/>`;
      s += `<rect x="${x + 16}" y="${ct - 21}" width="${w - 32}" height="6" rx="3" fill="${T(C.green[0])}" stroke="${ink}" stroke-width="2"/>`;
      break;
    }
    case 'spices': {
      s += `<g transform="translate(${x + w / 2} ${y - 24}) scale(.5)">${person(P, { skin: '#cf9366', robe: '#2a9a45', hat: 'scarf', hatColor: '#f5899a', armL: 'front', armR: 'hold', eyes: 'happy', wx: x })}</g>`;
      for (const [dx, c] of [[13, '#d05631'], [33, '#f5cf2f'], [68, '#78bf4c'], [88, '#e8862e']]) s += useAt(D.bowl, x + dx, ct, 1, T(c));
      break;
    }
    case 'pottery': {
      s += `<rect x="${x + 6}" y="${ab + 40}" width="${w - 12}" height="5" fill="${T('#9a5f38')}" stroke="${ink}" stroke-width="2"/>`;
      const jars = [[22, ab + 40, 0.62, '#d05631'], [44, ab + 40, 0.5, '#2ec4c6'], [64, ab + 40, 0.66, '#bb613d'], [84, ab + 40, 0.5, '#f2b84b'], [26, ct, 0.72, '#bb613d'], [52, ct, 0.56, '#1a9fd6'], [76, ct, 0.78, '#d05631']];
      for (const [dx, jy, k, c] of jars) s += useAt(D.jar, x + dx, jy, k, T(c));
      break;
    }
    case 'lanterns': {
      s += `<g transform="translate(${x + w / 2} ${y - 14}) scale(.5)">${person(P, { skin: '#a86d45', robe: '#f6f1e7', vest: '#6a45a8', hat: 'fez', armL: 'up', armR: 'front', mustache: '#2e2020', wx: x })}</g>`;
      const cols = ['#f5cf2f', '#2ec4c6', '#e0344f', '#74cf82', '#a88ae0'];
      [18, 34, 50, 66, 82].forEach((dx, i) => {
        const ly = ab + 14 + (i % 2) * 12;
        s += `<path d="M${x + dx},${ab + 2}V${ly - 9}" stroke="${ink}" stroke-width="1.6"/>` + useAt(D.lan, x + dx, ly, 0.8, P.glow(cols[i]));
      });
      break;
    }
    case 'dates': {
      s += `<rect x="${x + 6}" y="${ab + 38}" width="${w - 12}" height="5" fill="${T('#9a5f38')}" stroke="${ink}" stroke-width="2"/>`;
      s += useAt(D.pot, x + 26, ab + 38, 0.8) + useAt(D.pot, x + 66, ab + 38, 0.7);
      for (const [dx, c, c2] of [[22, '#8a3b1c', '#c46a3a'], [52, '#f08a24', '#ffc070'], [80, '#9a2a1a', '#d05631']]) s += useAt(D.bask, x + dx, ct, 1, T(c), ` color="${T(c2)}"`);
      break;
    }
    default:
  }
  return s;
}
function stall(P, D, x, y, w, h, col, kind) {
  const T = P.t;
  const ink = P.ink;
  const cb = T(col[0]);
  const cl = T(col[1]);
  const cream = T('#fff3d4');
  const wood = T('#b07445');
  const inner = T('#70402a');
  const top = y - h;
  const ab = top + 40;
  let s = `<g stroke-width="2.5">` + shadow(P, x + w / 2, y + 1, w * 0.62, 9, x);
  s += `<rect x="${x + 5}" y="${ab - 6}" width="${w - 10}" height="${y - 46 - ab + 6}" fill="${inner}"/>`;
  s += `<rect x="${x + 2}" y="${ab - 4}" width="8" height="${y - ab + 4}" fill="${wood}" stroke="${ink}"/><rect x="${x + w - 10}" y="${ab - 4}" width="8" height="${y - ab + 4}" fill="${wood}" stroke="${ink}"/>`;
  s += goods(P, D, kind, x, y, w, ab);
  s += `<rect x="${x - 3}" y="${y - 48}" width="${w + 6}" height="47" rx="3" fill="${wood}" stroke="${ink}"/>`;
  s += `<rect x="${x + 6}" y="${y - 41}" width="${w - 12}" height="33" rx="2" fill="${cl}" stroke="${ink}"/>`;
  const pat = kind === 'spices' || kind === 'lanterns' ? 1 : kind === 'dates' ? 2 : 0;
  if (pat === 1) {
    let dm = '';
    for (let i = 0; i < 6; i++) dm += `M${x + 16 + i * 14},${y - 30}l6,6 -6,6 -6,-6Z`;
    s += `<path d="${dm}" fill="${cb}"/>`;
  } else if (pat === 2) {
    let dt = '';
    for (let i = 0; i < 7; i++) dt += `<circle cx="${x + 14 + i * 12}" cy="${y - 24}" r="3.6"/>`;
    s += `<g fill="${cb}">${dt}</g>`;
  } else {
    let zz = `M${x + 10},${y - 20}`;
    for (let i = 0; i < 10; i++) zz += `l8,${i % 2 ? 8 : -8}`;
    s += `<path d="${zz}" fill="none" stroke="${cb}" stroke-width="3"/>`;
  }
  s += `<path d="M${x + 8},${y - 34}H${x + w - 8}M${x + 8},${y - 13}H${x + w - 8}" stroke="${cream}" stroke-width="2.5" stroke-dasharray="2 5"/>`;
  // awning
  const xt0 = x + 10;
  const xt1 = x + w - 10;
  const xb0 = x - 12;
  const xb1 = x + w + 12;
  const N = 8;
  const trap = `M${xt0},${top}H${xt1}L${xb1},${ab}H${xb0}Z`;
  s += `<path d="${trap}" fill="${cream}"/>`;
  let st = '';
  for (let i = 0; i < N; i += 2) {
    const a0 = xt0 + ((xt1 - xt0) * i) / N;
    const a1 = xt0 + ((xt1 - xt0) * (i + 1)) / N;
    const b0 = xb0 + ((xb1 - xb0) * i) / N;
    const b1 = xb0 + ((xb1 - xb0) * (i + 1)) / N;
    st += `M${f(a0)},${top}L${f(a1)},${top}L${f(b1)},${ab}L${f(b0)},${ab}Z`;
  }
  s += `<path d="${st}" fill="${cb}"/><path d="${trap}" fill="none" stroke="${ink}"/>`;
  const sw = (xb1 - xb0) / N;
  let sc0 = '';
  let sc1 = '';
  for (let i = 0; i < N; i++) {
    const a = xb0 + sw * i;
    const d = `M${f(a)},${ab}A${f(sw / 2)},${f(sw / 2)} 0 0 0 ${f(a + sw)},${ab}Z`;
    if (i % 2) sc1 += d;
    else sc0 += d;
  }
  s += `<path d="${sc0}" fill="${cb}" stroke="${ink}"/><path d="${sc1}" fill="${cream}" stroke="${ink}"/>`;
  s += `<rect x="${xt0 - 5}" y="${top - 5}" width="${xt1 - xt0 + 10}" height="8" rx="4" fill="${wood}" stroke="${ink}"/>`;
  s += `<path d="M${x + w / 2},${top - 5}V${top - 30}" stroke="${ink}" stroke-width="2.5"/><path d="M${x + w / 2},${top - 31}L${x + w / 2 + 20},${top - 25}L${x + w / 2},${top - 19}Z" fill="${cb}" stroke="${ink}" stroke-width="2"/>`;
  return s + '</g>';
}
function catOnRug(P, x, y) {
  const T = P.t;
  const ink = P.ink;
  const o = T('#f2a65a');
  const od = T('#d9822b');
  const cream = T('#fff3d4');
  let fr = '';
  for (let i = 0; i < 6; i++) fr += `M${x - 50 - i * 1.6},${y - 8 + i * 4}h-7M${x + 50 + i * 1.6},${y - 8 + i * 4}h7`;
  return (
    `<g stroke-width="2.5">` +
    `<path d="${fr}" stroke="${cream}" stroke-width="2"/>` +
    `<path d="M${x - 46},${y - 10}H${x + 46}L${x + 56},${y + 14}H${x - 56}Z" fill="${T(C.red[0])}" stroke="${ink}"/>` +
    `<path d="M${x - 38},${y - 5}H${x + 38}L${x + 45},${y + 9}H${x - 45}Z" fill="none" stroke="${T(C.yellow[0])}" stroke-width="3"/>` +
    `<path d="M${x},${y - 4}L${x + 18},${y + 2}L${x},${y + 8}L${x - 18},${y + 2}Z" fill="${T(C.blue[0])}"/>` +
    // cat curled up asleep
    `<path d="M${x + 30},${y - 2}C${x + 44},${y - 4} ${x + 40},${y + 10} ${x + 20},${y + 8}C${x + 4},${y + 7} ${x - 16},${y + 8} ${x - 24},${y + 4}" fill="none" stroke="${ink}" stroke-width="9"/>` +
    `<path d="M${x + 30},${y - 2}C${x + 44},${y - 4} ${x + 40},${y + 10} ${x + 20},${y + 8}C${x + 4},${y + 7} ${x - 16},${y + 8} ${x - 24},${y + 4}" fill="none" stroke="${o}" stroke-width="4"/>` +
    `<ellipse cx="${x + 8}" cy="${y - 8}" rx="26" ry="13" fill="${o}" stroke="${ink}"/>` +
    `<path d="M${x + 2},${y - 20}q3,6 0,11M${x + 12},${y - 20}q3,6 0,11M${x + 22},${y - 17}q3,5 0,9" fill="none" stroke="${od}" stroke-width="3"/>` +
    `<path d="M${x - 26},${y - 16}L${x - 24},${y - 30}L${x - 16},${y - 22}L${x - 8},${y - 29}L${x - 7},${y - 15}Z" fill="${o}" stroke="${ink}"/>` +
    `<ellipse cx="${x - 16}" cy="${y - 11}" rx="13" ry="10" fill="${o}" stroke="${ink}"/>` +
    `<path d="M${x - 23},${y - 12}q2.5,2.5 5,0M${x - 14},${y - 12}q2.5,2.5 5,0" fill="none" stroke="${ink}" stroke-width="2"/>` +
    `<ellipse cx="${x - 23}" cy="${y - 7}" rx="3" ry="1.8" fill="${T(BLUSH)}" opacity=".6"/><ellipse cx="${x - 8}" cy="${y - 7}" rx="3" ry="1.8" fill="${T(BLUSH)}" opacity=".6"/>` +
    `<path d="M${x - 2},${y - 36}h7l-7,7h7M${x + 8},${y - 50}h9l-9,9h9" fill="none" stroke="${mix(P.ink, P.haze, 0.3)}" stroke-width="2"/>` +
    '</g>'
  );
}
function bazaarLayer(P, id, defs) {
  const D = bazaarDefs(P, id, defs);
  const T = P.t;
  const stalls = [
    [26, 606, 100, 170, C.blue, 'rugs'],
    [132, 600, 100, 178, C.yellow, 'spices'],
    [238, 606, 100, 170, C.green, 'pottery'],
    [344, 600, 100, 178, C.red, 'lanterns'],
    [450, 606, 100, 170, C.purple, 'dates'],
  ];
  let s = '';
  // bunting behind the stalls' pennants
  const cols = ['blue', 'yellow', 'green', 'red', 'purple'];
  let bunt = '';
  let line = '';
  for (let i = 0; i < stalls.length - 1; i++) {
    const [x0, y0, w0, h0] = stalls[i];
    const [x1, y1, w1, h1] = stalls[i + 1];
    const ax = x0 + w0 / 2;
    const ay = y0 - h0 - 26;
    const bx = x1 + w1 / 2;
    const by = y1 - h1 - 26;
    const mx = (ax + bx) / 2;
    const my = Math.max(ay, by) + 22;
    line += `M${ax},${ay}Q${mx},${my} ${bx},${by}`;
    for (let j = 1; j < 6; j++) {
      const t = j / 6;
      const u = 1 - t;
      const px = u * u * ax + 2 * u * t * mx + t * t * bx;
      const py = u * u * ay + 2 * u * t * my + t * t * by;
      bunt += useAt(D.bun, px, py, 1, T(C[cols[(i + j) % 5]][0]));
    }
  }
  s += `<path d="${line}" fill="none" stroke="${P.ink}" stroke-width="1.6"/>` + bunt;
  for (const st of stalls) s += stall(P, D, ...st);
  // lanterns hanging from the awning fronts
  const glowSpots = [];
  const hang = [[26, 606, 170, 8, '#f5cf2f'], [132, 600, 178, 96, '#e0344f'], [238, 606, 170, 8, '#2ec4c6'], [450, 606, 170, 96, '#f5cf2f']];
  for (const [x, y, h, dx, c] of hang) {
    const ab = y - h + 40;
    const lx = x + dx;
    const ly = ab + 22;
    s += `<path d="M${lx},${ab + 4}V${ly - 9}" stroke="${P.ink}" stroke-width="1.8"/>` + useAt(D.lan, lx, ly, 1, P.glow(c));
    glowSpots.push([lx, ly + 14]);
  }
  // spice sacks & big amphorae on the ground
  s += shadow(P, 150, 628, 36, 5, 150) + useAt(D.sack, 134, 628, 1, T('#d05631')) + useAt(D.sack, 162, 630, 1, T('#f2b84b'));
  s += shadow(P, 350, 634, 30, 5, 350) + useAt(D.amph, 340, 634, 0.7, T('#d05631')) + useAt(D.amph, 362, 638, 0.55, T('#bb613d'));
  s += catOnRug(P, 260, 652);
  if (P.night) {
    s += `<ellipse cx="290" cy="630" rx="300" ry="46" fill="#ffc861" opacity=".1"/>`;
    for (const [gx, gy] of glowSpots) s += `<circle cx="${gx}" cy="${gy + 1}" r="26" fill="#ffd36a" opacity=".16"/><circle cx="${gx}" cy="${gy + 1}" r="13" fill="#ffe08a" opacity=".22"/>`;
    [362, 378, 394, 410, 426].forEach((gx, i) => {
      s += `<circle cx="${gx}" cy="${488 + (i % 2) * 12}" r="15" fill="#ffd36a" opacity=".15"/>`;
    });
  }
  return s;
}

// ---------------------------------------------------------------- oasis (scene)
/**
 * standing flamingo, feet at (x, y). m > 1 thickens the outlines for small copies (m = 1 keeps the scene's look).
 * soften > 0 pulls the night colours part-way back to daytime so a small copy stays readable (like the calf).
 */
function flamingo(P, x, y, k, m = 1, soften = 0) {
  const T = P.night && soften ? (h) => mix(P.t(h), h, soften) : P.t;
  const ink = P.ink;
  const pink = T('#f7909f');
  const pinkD = T('#e0647d');
  const leg = T('#e87a8c');
  const w25 = f(2.5 * m);
  return (
    `<g transform="translate(${x} ${y}) scale(${k})" stroke-width="${f(3 * m)}">` +
    limb(P, 'M2,-1L3,-40L0,-66', 3.5, leg, 2.6 * Math.min(m, 1.25)) +
    limb(P, 'M4,-64L18,-50L4,-44', 3.5, leg, 2.6 * Math.min(m, 1.25)) +
    `<path d="M-24,-82C-24,-98 0,-104 18,-96C32,-90 38,-76 28,-68C18,-60 -4,-60 -16,-66C-22,-70 -24,-76 -24,-82Z" fill="${pink}" stroke="${ink}"/>` +
    `<path d="M26,-92L40,-86L30,-80Z" fill="${pinkD}" stroke="${ink}" stroke-width="${w25}"/>` +
    `<path d="M-6,-88C6,-94 24,-90 28,-78C18,-72 2,-72 -6,-80Z" fill="${pinkD}" stroke="${ink}" stroke-width="${w25}"/>` +
    limb(P, 'M-18,-86C-32,-96 -32,-112 -20,-120C-8,-128 -8,-140 -18,-146', 7, pink, 3 * Math.min(m, 1.4)) +
    `<circle cx="-18" cy="-148" r="9" fill="${pink}" stroke="${ink}"/>` +
    `<path d="M-25,-151C-34,-151 -38,-146 -37,-137L-32,-138C-32,-143 -30,-145 -25,-145Z" fill="${T('#fbe6d8')}" stroke="${ink}" stroke-width="${w25}"/>` +
    `<path d="M-37,-137L-32,-138L-33,-142L-37,-142Z" fill="${T('#2e2828')}"/>` +
    `<circle cx="-17" cy="-150" r="${f(2.2 * Math.min(m, 1.35))}" fill="${T(EYE)}"/>` +
    `<ellipse cx="-13" cy="-144" rx="3" ry="1.8" fill="${T(BLUSH)}" opacity=".6"/>` +
    '</g>'
  );
}
function ibisStanding(P, x, y, k) {
  const T = P.t;
  const ink = P.ink;
  const w = T('#fbf7ee');
  const b = T('#2e2828');
  return (
    `<g transform="translate(${x} ${y}) scale(${k})" stroke-width="2.6">` +
    shadow(P, 0, 0, 16, 3, x) +
    `<path d="M-2,-32L-4,0M6,-32L8,0" stroke="${b}" stroke-width="3"/>` +
    `<path d="M-26,-40C-30,-34 -28,-28 -22,-28C-18,-30 -14,-32 -12,-34Z" fill="${b}" stroke="${ink}"/>` +
    `<path d="M-18,-40C-20,-54 0,-60 14,-54C22,-50 24,-42 18,-36C10,-30 -8,-30 -14,-34Z" fill="${w}" stroke="${ink}"/>` +
    limb(P, 'M12,-52C18,-60 18,-68 12,-74', 5, b, 2.4) +
    `<circle cx="12" cy="-76" r="5.5" fill="${b}"/>` +
    `<path d="M16,-78C24,-78 30,-72 30,-62" fill="none" stroke="${b}" stroke-width="3"/>` +
    `<circle cx="13" cy="-77.5" r="1.3" fill="#fff"/>` +
    '</g>'
  );
}
/**
 * Baby camel calf lying down (kushed) — legs folded, neck up, happy "^" eyes, tuft, little
 * green blanket and a flower by its ear. Local space faces right, ground at y=0, ~185 wide.
 * It uses a gentler night grade (45% back towards daylight colours) so it stays warm and
 * readable against the dark blue night sand instead of turning into a murky silhouette.
 */
function camelCalf(P, x, y, k, flip = 1) {
  const soft = (h) => (P.night ? mix(P.t(h), h, 0.45) : P.t(h));
  const ink = P.ink;
  const body = soft('#ecc892');
  const sh = soft('#cc9e62');
  const pomA = soft(C.red[0]);
  // baby proportions: short loaf body, small hump, short chunky neck, big low head
  const hump = 'M-52,-48C-44,-66 -8,-70 6,-52';
  const bodyD = `${hump}C14,-58 20,-68 26,-80L56,-72C48,-58 44,-48 40,-36C44,-20 38,-5 24,-3L-60,-4C-72,-18 -70,-40 -52,-48Z`;
  let petals = '';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    petals += `<circle cx="${f(14 + Math.cos(a) * 6)}" cy="${f(-122 + Math.sin(a) * 6)}" r="4.6"/>`;
  }
  return (
    shadow(P, x, y - 1, 54 * k, 8 * k, x) +
    `<g transform="translate(${x} ${y}) scale(${f(k * flip)} ${k})" stroke-width="5">` +
    // tail
    limb(P, 'M-64,-26Q-76,-22 -74,-9', 4, body, 2.6) +
    `<path d="M-74,-13C-80,-9 -78,0 -72,0C-68,-3 -69,-9 -74,-13Z" fill="${soft('#c8925a')}" stroke="${ink}" stroke-width="3.5"/>` +
    // body with belly & neck shade
    `<path d="${bodyD}" fill="${body}"/>` +
    `<path d="M-63,-11C-50,-18 -16,-18 36,-15C38,-9 34,-4 24,-3L-58,-4Z" fill="${sh}"/>` +
    `<path d="M40,-36C44,-48 48,-58 56,-72L51,-74C44,-60 40,-50 36,-40Z" fill="${sh}" opacity=".6"/>` +
    // little blanket over the baby hump, with a trim and pom-poms
    `<path d="${hump}L8,-32L-54,-32Z" fill="${soft(C.green[0])}"/>` +
    `<path d="M-54,-41C-26,-45 -6,-45 7,-41V-35C-6,-38 -26,-38 -54,-35Z" fill="${soft(C.yellow[0])}"/>` +
    `<path d="${hump}L8,-32L-54,-32Z" fill="none" stroke="${ink}" stroke-width="4"/>` +
    `<g stroke="${ink}" stroke-width="3"><circle cx="-54" cy="-31" r="5" fill="${pomA}"/><circle cx="-23" cy="-31" r="5" fill="${soft('#fff3d4')}"/><circle cx="8" cy="-31" r="5" fill="${pomA}"/></g>` +
    `<path d="${bodyD}" fill="none" stroke="${ink}"/>` +
    `<path d="M-54,-6C-56,-22 -38,-28 -28,-17" fill="none" stroke="${ink}" stroke-width="4"/>` +
    // folded front legs
    `<path d="M4,-3C6,-17 32,-20 42,-9C46,-4 44,1 36,1H8C4,1 3,-1 4,-3Z" fill="${body}" stroke="${ink}"/>` +
    `<ellipse cx="34" cy="-7" rx="5.5" ry="4" fill="${soft('#b8844a')}"/>` +
    // ear, big round head, pale muzzle, tuft of hair
    `<path d="M27.1,-111.6C16.1,-121.5 19.4,-134.7 31.5,-127C35.9,-122.6 34.8,-116 31.5,-111.6Z" fill="${body}" stroke="${ink}"/>` +
    `<path d="M20.7,-91.8C18.5,-116 47.1,-129.2 69.1,-120.4C86.7,-113.8 97.7,-96.2 93.3,-80.8C88.9,-65.4 73.5,-58.8 58.1,-61C38.3,-63.2 22.9,-74.2 20.7,-91.8Z" fill="${body}" stroke="${ink}"/>` +
    `<path d="M71.3,-96.2C82.3,-101.7 91.7,-92.9 92.2,-83C91.1,-72 80.1,-66.5 66.9,-68.2C62.5,-77.5 63.6,-89.6 71.3,-96.2Z" fill="${soft('#fbe6bf')}"/>` +
    `<path d="M41.1,-122.2C37.8,-132.1 46.6,-137.6 51,-129.9C53.2,-138.7 63.1,-137.6 60.9,-126.6C56.5,-129.9 47.7,-129.9 41.1,-122.2Z" fill="${soft('#c8925a')}" stroke="${ink}" stroke-width="3.5"/>` +
    // flower tucked by the ear (kept bright at night, like the lotus flowers)
    `<g fill="${P.glow('#f5899a')}" stroke="${ink}" stroke-width="2.4">${petals}</g>` +
    `<circle cx="14" cy="-122" r="3.6" fill="${P.glow('#fde88f')}" stroke="${ink}" stroke-width="2"/>` +
    // happy closed "^" eyes with lashes, blush, nostril, smile
    `<path d="M48.2,-94Q55.9,-103.9 63.6,-94" fill="none" stroke="${ink}" stroke-width="4.8"/>` +
    `<path d="M49.3,-97.3L43.8,-101.7M53.7,-100.6L51.5,-107.2M59.2,-100.6L60.3,-107.2" fill="none" stroke="${ink}" stroke-width="3.6"/>` +
    `<ellipse cx="66.9" cy="-79.7" rx="8.2" ry="5" fill="${soft(BLUSH)}" opacity=".6"/>` +
    `<path d="M85.6,-90.7q3.9,-.6 5.5,2.8" fill="none" stroke="${ink}" stroke-width="3.4"/>` +
    `<path d="M76.8,-77.5q6.6,5 12.7,-1.1" fill="none" stroke="${ink}" stroke-width="3.8"/>` +
    '</g>'
  );
}
/**
 * The background scene's oasis pool (scene coordinates), built like the board centrepiece: one
 * bubbly hedge silhouette behind a tan rim, grass & reeds growing out of the hedge, a few
 * wildflowers, every pad and animal in the water kept clear of the rim, and the tall characters
 * (flamingo, ibis, water reeds, calf, near palm) standing in front of the rim where they overlap it.
 */
const SCENE_POOL = {
  pool: [1150, 672, 284, 62, [1, 0.97, 1.03, 0.99, 1.02, 0.97, 1.03, 1, 0.97, 1.04, 0.99, 1.02]],
  bank: [1.034, 1.15], // the rim's outer edge = the pool shape scaled about its centre (hedge & plants follow it)
  // plain pads [x, y, scale, flip] and pads with a flower [x, y, pad scale, 'lotus' | 'bud', flower scale]
  pads: [[924, 686, 1.5, 1], [1036, 704, 1.4, -1], [1202, 648, 1, 1], [1346, 682, 1.1, -1], [1418, 670, 0.8, 1]],
  flowers: [[964, 664, 1.1, 'lotus', 1.1], [1082, 652, 1.2, 'bud', 1.3], [1136, 694, 1.6, 'lotus', 1.4]],
  hippo: [1286, 700, 0.95],
  flamingo: [1392, 690, 0.72],
  ibis: [1160, 604, 0.9],
  // reed clumps standing in the water [x, y, scale, flip] (drawn in front of the rim)
  waterReeds: [[1004, 708, 0.42, -1], [1180, 716, 0.36, 1], [1236, 640, 0.34, -1]],
  // hedge plants [kind, angle° (0 right · 90 near side · 180 left · 270 far side), scale, flip, radial nudge]
  plants: [
    ['reed', 178, 0.66, -1], ['reed', 214, 0.7, -1], ['reed', 246, 0.62, 1], ['reed', 294, 0.66, -1], ['reed', 326, 0.72, 1], ['reed', 356, 0.8, 1],
    ['tuft', 196, 0.9, 1], ['tuft', 230, 0.85, -1], ['tuft', 268, 0.8, 1], ['tuft', 310, 0.85, -1], ['tuft', 342, 0.9, 1],
    ['tuft', 160, 0.8, -1], ['tuft', 134, 0.7, 1], ['tuft', 106, 0.6, -1], ['tuft', 74, 0.6, 1], ['tuft', 46, 0.7, -1], ['tuft', 18, 0.8, 1],
  ],
  // ~8 small wildflowers on the hedge [angle°, radial nudge, scale, petal colour]
  blooms: [[172, 0, 1.25, '#fffaf0'], [220, 0, 1.25, '#f5cf2f'], [256, 0, 1.25, '#fffaf0'], [284, 0, 1.25, '#f5cf2f'], [304, 0, 1.25, '#fffaf0'], [4, 0, 1.25, '#f5cf2f'], [60, 0, 1.25, '#fffaf0'], [116, 0, 1.25, '#f5cf2f']],
  // ripple dashes in open water: [waterLine path, waterHi path]; day sparkles [x, y, scale]
  ripples: [
    'M880,662H904M985,650H1010M1100,676H1116M1160,660H1190M1060,726H1090M1330,708H1350M1216,690H1236M1290,628H1320',
    'M894,676H904M996,662H1004M1170,648H1180M1352,700H1362M1300,640H1310',
  ],
  sparks: [[1024, 664, 0.8], [1170, 676, 0.6], [1370, 660, 0.6]],
  fireflies: [[1090, 580, 1], [1122, 598, 0.8], [1268, 586, 1], [1300, 570, 0.7], [1424, 614, 1], [1456, 594, 0.8], [900, 638, 0.9], [872, 612, 0.7], [1512, 700, 1], [1184, 556, 0.8]],
  dragonflies: [[1150, 634, 1], [1430, 584, 0.9]],
};

/**
 * The rim's outer edge as a frame: dense points with their outward normals and the angle
 * round the pool (0 right · 90 near side · 180 left · 270 far side).
 */
function bankFrame(bankCtrl, cx, cy) {
  const ring = splinePts(bankCtrl);
  const n = ring.length;
  return ring.map((p, i) => {
    const a = ring[(i - 1 + n) % n];
    const b = ring[(i + 1) % n];
    let nx = b[1] - a[1];
    let ny = a[0] - b[0];
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) {
      nx = -nx;
      ny = -ny;
    }
    const ang = Math.atan2((p[1] - cy) / 80, (p[0] - cx) / 300);
    return { x: p[0], y: p[1], nx, ny, ang, sn: Math.sin(ang) };
  });
}
/**
 * Hedge bubbles for the scene pool: centred a little outside the rim along its outward normal
 * (12 behind the pool, 6 in front) so they overlap the rim's outer edge all the way round;
 * big on the far side, smaller in front.
 */
function sceneHedgeBubbles(frame, seed) {
  const rnd = rng(seed);
  const out = [];
  let acc = 0;
  let next = 0;
  for (let i = 1; i <= frame.length; i++) {
    const p = frame[i % frame.length];
    const q = frame[i - 1];
    acc += Math.hypot(p.x - q.x, p.y - q.y);
    if (acc < next) continue;
    const d = 5 + 7 * Math.max(0, -p.sn);
    const r = 22 - 8 * Math.max(0, p.sn) + (rnd() - 0.5) * 5;
    out.push([p.x + p.nx * d, p.y + p.ny * d, r]);
    next = acc + Math.max(9, r * (1.05 - 0.12 * Math.max(0, p.sn)));
  }
  return out;
}
/** a point on the scene hedge's visible green band at the given angle (nudge moves it outwards) */
function sceneBandPoint(frame, deg, nudge = 0) {
  const a = (deg * Math.PI) / 180;
  let best = frame[0];
  let bd = Infinity;
  for (const p of frame) {
    const d = Math.abs(Math.atan2(Math.sin(p.ang - a), Math.cos(p.ang - a)));
    if (d < bd) {
      bd = d;
      best = p;
    }
  }
  const off = 11 + 6 * Math.max(0, -best.sn) - Math.max(0, best.sn) + nudge;
  return [best.x + best.nx * off, best.y + best.ny * off];
}
/** like blob() but with the fills grouped (much smaller output for a big hedge) */
function blobG(cs, fill, ink, sw) {
  const c = ([x, y, r], d) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r + d)}"/>`;
  return `<g fill="${ink}">${cs.map((b) => c(b, sw)).join('')}</g><g fill="${fill}">${cs.map((b) => c(b, 0)).join('')}</g>`;
}
/** scene-weight hedge grass tuft (open base in the hedge green), wildflower and lotus bud */
function sceneHedgeDefs(P, id, defs, hedgeG) {
  const ink = P.ink;
  const soft = (h) => (P.night ? mix(P.t(h), h, 0.35) : P.t(h));
  const D = { tuft: id('ht'), bloom: id('hb'), bud: id('hd') };
  const tuftD = 'M-14,0Q-16,-8 -22,-12Q-12,-11 -8,-4Q-10,-14 -8,-22Q-3,-14 -3,-5Q0,-16 3,-24Q5,-14 3,-4Q7,-13 12,-18Q10,-8 8,-2Q14,-8 20,-9Q16,-3 14,0';
  let petals = '';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    petals += `<circle cx="${f(Math.cos(a) * 2.7)}" cy="${f(Math.sin(a) * 2.7)}" r="2.3"/>`;
  }
  defs.push(
    `<g id="${D.tuft}"><path d="${tuftD}Z" fill="${hedgeG}"/><path d="${tuftD}" fill="none" stroke="${ink}" stroke-width="3"/>` +
      `<path d="M-4,-3Q-6,-10 -7,-16M5,-3Q6,-9 9,-13" fill="none" stroke="${soft('#a6d86a')}" stroke-width="2.4"/></g>` +
      `<g id="${D.bloom}" stroke="${ink}" stroke-width="1.4">${petals}<circle cx="0" cy="0" r="1.7" fill="${soft('#f2a93b')}"/></g>` +
      `<g id="${D.bud}" stroke="${ink}" stroke-width="1.5"><path d="M-3,-1Q-6,-4 -6,-7Q-2,-5 0,-1ZM3,-1Q6,-4 6,-7Q2,-5 0,-1Z" fill="${P.t('#78bf4c')}"/>` +
      `<path d="M0,0C-4.5,-2 -5,-8 0,-13C5,-8 4.5,-2 0,0Z" fill="${P.glow('#f7a8c0')}"/><path d="M0,-2.5Q-1.2,-7 0,-10.5" fill="none" stroke="${P.glow('#fde0ea')}" stroke-width="1.2"/></g>`
  );
  return D;
}
/** where the scene's hedge plants and wildflowers go (flowers slide along their radius until they
 *  sit wholly on visible green: on the hedge, clear of the rim, the reeds and the tall characters) */
function scenePlantLayout(L, bubbles, frame, obstacles) {
  const plants = L.plants.map(([kind, deg, k, flip = 1, nudge = 0]) => {
    const [x, y] = sceneBandPoint(frame, deg, nudge);
    return { kind, x, y, k, flip };
  });
  const bank = frame.map((p) => [p.x, p.y]);
  // nothing may hide a flower: hedge reeds, hedge tufts, and the obstacles passed in
  const hulls = [
    ...plants.map((p) =>
      p.kind === 'reed' ? reedFootprint(p.x, p.y, p.k, p.flip) : boxHull(p.x - 22 * p.k, p.y - 24 * p.k, p.x + 22 * p.k, p.y + 2)
    ),
    ...obstacles,
  ];
  const blooms = [];
  for (const [deg, nudge, k, c] of L.blooms) {
    const r = 5.2 * k;
    const ring = [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r], [r * 0.7, r * 0.7], [-r * 0.7, r * 0.7], [r * 0.7, -r * 0.7], [-r * 0.7, -r * 0.7]];
    let best = null;
    let bestN = Infinity;
    for (let n = -12; n <= 12; n += 1) {
      const [x, y] = sceneBandPoint(frame, deg, n);
      const ok =
        ring.every(([u, v]) => onGreen(bubbles, x + u, y + v, 1)) &&
        !inPoly(bank, x, y) &&
        polyDist(bank, x, y) >= r + 2 &&
        hulls.every((h) => !inPoly(h, x, y) && polyDist(h, x, y) >= r + 1.5);
      if (ok && Math.abs(n - nudge) < Math.abs(bestN - nudge)) {
        bestN = n;
        best = [x, y, k, c];
      }
    }
    if (best) blooms.push(best);
  }
  return { plants, blooms };
}
/**
 * Everything drawn in front of the scene hedge that could hide a wildflower (same in every theme,
 * so the flowers sit in the same spots by day and by night).
 */
function scenePoolObstacles(L) {
  const [fx, fy, fk] = L.flamingo;
  const [ix, iy, ik] = L.ibis;
  return [
    boxHull(fx - 38 * fk, fy - 157 * fk, fx + 40 * fk, fy),
    boxHull(ix - 28 * ik, iy - 80 * ik, ix + 31 * ik, iy),
    boxHull(1372, 700, 1476, 792), // the calf
    boxHull(1470, 330, 1520, 770), // the near palm's trunk
    ...L.waterReeds.map(([x, y, k, fl]) => reedFootprint(x, y, k, fl)),
    ...L.dragonflies.map(([x, y, k]) => boxHull(x - 14 * k, y - 10 * k, x + 14 * k, y + 12 * k)),
  ];
}
/** a closed rectangle outline as dense points in order (an obstacle for the wildflower search) */
function boxHull(x0, y0, x1, y1) {
  const out = [];
  const side = (ax, ay, bx, by) => {
    for (let t = 0; t < 1; t += 0.05) out.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
  };
  side(x0, y0, x1, y0);
  side(x1, y0, x1, y1);
  side(x1, y1, x0, y1);
  side(x0, y1, x0, y0);
  return out;
}
function oasisLayer(P, id, defs, cr, lily, reed, spark) {
  const T = P.t;
  const ink = P.ink;
  const crown = cr.crown;
  const L = SCENE_POOL;
  const put = (ref, x, y, k, flip = 1) => `<use href="#${ref}" transform="translate(${f(x)} ${f(y)}) scale(${f(k * flip)} ${f(k)})"/>`;
  let s = '';
  // palms on the far bank (behind the hedge)
  s += palm(P, crown, 1060, 616, 1092, 352, 18, 0.82, -1, 8);
  s += palm(P, crown, 1212, 606, 1232, 300, 16, 0.98, 1, -4);
  s += palm(P, crown, 1352, 612, 1338, 372, -8, 0.78, -1, -7);
  // pool, rim & hedge geometry
  const [pcx, pcy, prx, pry, wob] = L.pool;
  const pts = blobPts(pcx, pcy, prx, pry, wob);
  const poolD = smooth(pts, true);
  const bankCtrl = pts.map(([x, y]) => [pcx + (x - pcx) * L.bank[0], pcy + (y - pcy) * L.bank[1]]);
  const hedgeG = T('#78bf4c');
  const hd = sceneHedgeDefs(P, id, defs, hedgeG);
  const frame = bankFrame(bankCtrl, pcx, pcy);
  const bubbles = sceneHedgeBubbles(frame, 23);
  const [fx, fy, fk] = L.flamingo;
  const [ix, iy, ik] = L.ibis;
  const planting = scenePlantLayout(L, bubbles, frame, scenePoolObstacles(L));
  // 1) ONE bubbly hedge silhouette: all ink first, then all fills (the only outline is its outer edge)
  s += blobG(bubbles, hedgeG, ink, 3);
  // 2) on the green: a few wildflowers, then grass tufts & reed clumps growing out of the hedge
  for (const [x, y, k, c] of planting.blooms) s += `<use href="#${hd.bloom}" transform="translate(${f(x)} ${f(y)}) scale(${k})" fill="${P.night ? mix(T(c), c, 0.35) : T(c)}"/>`;
  for (const p of planting.plants) s += put(p.kind === 'reed' ? reed : hd.tuft, p.x, p.y, p.k, p.flip);
  // 3) water (clipped): deep tone, gradient, palm reflections, glitter, ripples, sparkles, rings
  const pool = id('pool');
  const clip = id('pcl');
  const wg = id('wg');
  defs.push(`<path id="${pool}" d="${poolD}"/><clipPath id="${clip}"><use href="#${pool}"/></clipPath>` + lin(wg, 0, 610, 0, 740, P.water));
  s += `<g clip-path="url(#${clip})"><rect x="850" y="600" width="600" height="150" fill="${P.waterDeep}"/>`;
  s += `<use href="#${pool}" transform="translate(0 9)" fill="url(#${wg})"/>`;
  s +=
    `<g fill="${P.waterDeep}" opacity=".32"><path d="M1052,616L1068,616L1092,700L1072,700ZM1203,606L1221,606L1230,712L1212,712ZM1344,612L1360,612L1352,700L1336,700Z"/>` +
    `<use href="#${cr.sil}" transform="translate(1086 716) scale(-.82 -.4)"/><use href="#${cr.sil}" transform="translate(1228 734) scale(.98 -.42)"/><use href="#${cr.sil}" transform="translate(1342 708) scale(-.78 -.36)"/></g>`;
  if (P.night || P.sunset) {
    const gx = P.night ? 962 : 912;
    const c = P.night ? '#fff3c4' : '#ffe9a0';
    let d = '';
    for (let i = 0; i < 7; i++) {
      const yy = 624 + i * 15;
      const hw = 26 - i * 2.5 + (i % 2) * 6;
      d += `M${gx - hw},${yy}H${gx + hw}`;
    }
    s += `<path d="${d}" stroke="${c}" stroke-width="4" opacity=".75"/>`;
  }
  s += `<path d="${L.ripples[0]}" stroke="${P.waterLine}" stroke-width="3.5" opacity=".75"/><path d="${L.ripples[1]}" stroke="${P.waterHi}" stroke-width="3.5"/>`;
  if (!P.night) s += `<g fill="${P.waterHi}">${L.sparks.map(([x, y, k]) => `<use href="#${spark}" transform="translate(${x} ${y}) scale(${k})"/>`).join('')}</g>`;
  const [hx, hy, hk] = L.hippo;
  s += hippoWater(P, hx, hy, hk) + waterRing(P, fx, fy, 15.8, 3.6, 1.8);
  for (const [x, y, k] of L.waterReeds) s += waterRing(P, x, y, 30 * k, 8.5 * k, 2);
  s += '</g>';
  // 4) lily pads, the pads carrying a lotus or a bud, then the flowers — all well inside the water
  for (const [x, y, k, fl] of L.pads) s += put(lily.pad, x, y, k, fl);
  L.flowers.forEach(([x, y, pk], i) => {
    s += put(lily.pad, x, y, pk, i % 2 ? -1 : 1);
  });
  for (const [x, y, , kind, k] of L.flowers) s += put(kind === 'bud' ? hd.bud : lily.lotus, x, y, k);
  // 5) the hippo peeking out, with open water all round it
  s += hippo(P, hx, hy, hk);
  // 6) the tan rim over the water's edge…
  s += `<path d="${smooth(bankCtrl, true)}${poolD}" fill="${T('#e0a062')}" fill-rule="evenodd" stroke="${ink}" stroke-width="3"/>`;
  // 7) …and in front of it everything tall: reeds standing in the water, the wading flamingo,
  //    the ibis on the far bank, the big near-bank palm and the calf resting in its shade
  for (const [x, y, k, fl] of L.waterReeds) s += put(reed, x, y, k, fl);
  s += flamingo(P, fx, fy, fk, 1, 0.45);
  s += ibisStanding(P, ix, iy, ik);
  s += palm(P, crown, 1500, 760, 1486, 330, 26, 1.12, 1, -5);
  s += camelCalf(P, 1432, 790, 0.56, -1);
  s += critters(P, P.night ? L.fireflies : L.dragonflies);
  return s;
}

// ---------------------------------------------------------------- foreground
function rockDefs(P, id, defs) {
  const ink = P.ink;
  const r = id('rk');
  const r2 = id('rk2');
  const b = P.t('#c9996c');
  const sh = P.t('#a8774f');
  const hi = P.t('#e6c092');
  defs.push(
    `<g id="${r}" stroke-width="3"><path d="M-32,0C-36,-16 -22,-30 -4,-32C14,-34 30,-22 32,-8C33,0 26,1 0,1C-20,1 -30,1 -32,0Z" fill="${b}" stroke="${ink}"/>` +
      `<path d="M-30,-4C-28,-14 -18,-20 -8,-18C-14,-12 -14,-4 -10,0H-28Z" fill="${sh}"/><path d="M4,-26C14,-26 22,-20 24,-12" fill="none" stroke="${hi}" stroke-width="3.5"/></g>` +
      `<g id="${r2}" stroke-width="3"><path d="M-20,0C-24,-10 -16,-20 -4,-21C8,-22 20,-14 20,-4C20,0 16,1 0,1C-12,1 -19,1 -20,0Z" fill="${b}" stroke="${ink}"/>` +
      `<path d="M-18,-3C-16,-10 -10,-13 -4,-12C-8,-8 -8,-3 -6,0H-17Z" fill="${sh}"/><path d="M2,-17C9,-17 14,-13 15,-8" fill="none" stroke="${hi}" stroke-width="3"/></g>`
  );
  return { r, r2 };
}
function shrubDefs(P, id, defs) {
  const ink = P.ink;
  const t = id('tf');
  const b = id('bu');
  const g = P.t('#8db04a');
  const gd = P.t('#6a8e38');
  const bush = P.t('#9fb46a');
  defs.push(
    `<g id="${t}"><path d="M-20,0L-26,-16L-13,-7L-12,-28L-4,-9L1,-33L5,-9L13,-26L13,-7L25,-15L20,0Z" fill="${g}" stroke="${ink}" stroke-width="2.6"/>` +
      `<path d="M-5,-2L1,-26M8,-2L13,-18" fill="none" stroke="${gd}" stroke-width="2"/></g>` +
      `<g id="${b}">` +
      blob([[-14, -10, 11], [0, -18, 14], [14, -10, 11], [0, -6, 12]], bush, ink, 3) +
      `<circle cx="-6" cy="-20" r="2.4" fill="${P.t('#fde88f')}"/><circle cx="8" cy="-16" r="2.4" fill="${P.t('#f5899a')}"/><circle cx="-14" cy="-10" r="2.2" fill="${P.t('#fde88f')}"/>` +
      '</g>'
  );
  return { t, b };
}
/** soft foreground dunes framing the lower corners + wind ripples; drawn right after the ground */
function sandLayer(P) {
  let s =
    `<path d="M-20,812C90,776 250,786 380,832C480,868 560,930 640,1000H-20Z" fill="${P.fgDune}"/>` +
    `<path d="M380,832C480,868 560,930 640,1000H560C520,944 460,892 380,832Z" fill="${P.fgDuneShade}" opacity=".6"/>` +
    `<path d="M1620,826C1500,790 1350,800 1220,842C1120,876 1040,934 980,1000H1620Z" fill="${P.fgDune}"/>` +
    `<path d="M1220,842C1120,876 1040,934 980,1000H1060C1100,940 1150,886 1220,842Z" fill="${P.fgDuneShade}" opacity=".5"/>` +
    `<path d="M-20,816C90,780 250,790 376,835M1620,830C1500,794 1350,804 1224,845" fill="none" stroke="${P.duneHi}" stroke-width="4" opacity=".7"/>`;
  const rnd = rng(5);
  let rip = '';
  let hi = '';
  for (let i = 0; i < 70; i++) {
    const x = rnd() * 1600;
    const y = 520 + Math.pow(rnd(), 0.8) * 470;
    if (x > 860 && x < 1450 && y > 590 && y < 760) continue;
    if (x < 560 && y < 640) continue;
    const w = 26 + rnd() * 30 + (y - 500) * 0.06;
    const hgt = w * 0.14;
    rip += `M${f(x)},${f(y)}q${f(w / 2)},${f(-hgt)} ${f(w)},0`;
    hi += `M${f(x + 3)},${f(y - 4)}q${f(w / 2 - 3)},${f(-hgt)} ${f(w - 6)},0`;
  }
  return s + `<path d="${hi}" fill="none" stroke="${P.rippleHi}" stroke-width="2.5" opacity=".8"/><path d="${rip}" fill="none" stroke="${P.ripple}" stroke-width="3" opacity=".55"/>`;
}
function foregroundLayer(P, id, defs) {
  const rk = rockDefs(P, id, defs);
  const sb = shrubDefs(P, id, defs);
  let s = '';
  // rocks & shrubs
  const use = (ref, x, y, k, flip = 1) => `<use href="#${ref}" transform="translate(${x} ${y}) scale(${f(k * flip)} ${f(k)})"/>`;
  s += shadow(P, 40, 992, 40, 7, 40) + use(rk.r, 40, 992, 1.2) + use(rk.r2, 92, 996, 0.9);
  s += use(sb.t, 18, 872, 1.1) + use(sb.b, 576, 988, 1.1) + use(sb.t, 616, 996, 0.8, -1);
  s += use(rk.r2, 700, 944, 0.7) + use(sb.t, 988, 960, 0.8);
  s += use(sb.b, 1600, 904, 1.1) + use(sb.t, 1020, 998, 1.1) + use(rk.r2, 1262, 998, 0.8, -1);
  s += use(rk.r2, 880, 800, 0.55) + use(sb.t, 780, 600, 0.55) + use(rk.r2, 610, 700, 0.6, -1);
  // left group: lady with parasol, fez gentleman, kid with a flag, resting camel
  s += `<g transform="translate(92 972) scale(.8)" stroke-width="3.5">${person(P, { skin: '#f6d3b0', robe: '#f5899a', style: 'dress', hair: 'bob', hairC: '#5a3522', hat: 'sunhat', hatColor: '#6a45a8', sash: '#6a45a8', armL: 'down', armR: 'hold', item: 'parasol', itemColor: '#7fd0f0', legs: '#fbe3cf', shoe: '#a31a34', wx: 92 })}</g>`;
  s += `<g transform="translate(196 986) scale(.84)" stroke-width="3.5">${person(P, { skin: '#cf9366', robe: '#f6f1e7', robeS: '#d9d0bf', hat: 'fez', armL: 'up', armR: 'down', mustache: '#2e2020', sash: '#1a9fd6', trim: '#1a9fd6', eyes: 'happy', wx: 196 })}</g>`;
  s += `<g transform="translate(292 990) scale(.78)" stroke-width="3.5">${person(P, { kid: true, skin: '#7a4a2c', robe: '#74cf82', robeS: '#4fae62', hat: 'cap', hatColor: '#e0344f', armL: 'down', armR: 'up', item: 'flag', itemColor: 'yellow', wx: 292 })}</g>`;
  s += `<g transform="translate(428 952) scale(.86)">${restingCamel(P, { blanket: 'red', stripe: 'yellow', pom: 'blue', eyes: 'happy', wx: 428 })}</g>`;
  // right group: resting camel facing left, water-seller, turban gentleman
  s += `<g transform="translate(1168 954) scale(-.86 .86)">${restingCamel(P, { blanket: 'blue', stripe: 'purple', pom: 'yellow', eyes: 'open', wx: 1168 })}</g>`;
  s += `<g transform="translate(1318 978) scale(.84)" stroke-width="3.5">${person(P, { skin: '#a86d45', robe: '#1a9fd6', robeS: '#0b6e9c', hat: 'turban', hatColor: '#fff6e2', gem: '#e0344f', armL: 'front', armR: 'front', beard: '#eeeae0', sash: '#f5cf2f', eyes: 'happy', wx: 1318 })}</g>`;
  s += `<g transform="translate(1424 988) scale(.84)" stroke-width="3.5">${person(P, { skin: '#e8b48a', robe: '#fff3d4', robeS: '#e6d6b0', vest: '#e0344f', hat: 'fez', armL: 'cup', armR: 'hold', item: 'jug', mustache: '#3a2416', sash: '#f5cf2f', wx: 1424 })}</g>`;
  // 1920s explorer in a pith helmet, watching the race through binoculars (bonus detail at the edge)
  s += `<g transform="translate(1556 974) scale(.8)" stroke-width="3.5">${person(P, { skin: '#f6d3b0', robe: '#dcc48e', robeS: '#c2a56c', style: 'suit', trousers: '#b8955a', shoe: '#5a3a22', hat: 'pith', armL: 'bino', armR: 'bino', mustache: '#c46a2e', wx: 1556 })}</g>`;
  return s;
}

// ---------------------------------------------------------------- public: scene
export function sceneSVG(theme = 'sand') {
  const P = palette(theme);
  const id = idMaker('sc');
  const defs = [];
  const crestY = curveY(GROUND);
  const cr = crownDef(P, id, defs);
  const crown = cr.crown;
  const lily = lilyDefs(P, id, defs);
  const reed = reedDef(P, id, defs);
  const gz = gazelleDefs(P, id, defs);
  const spark = id('spk');
  const gg = id('gr');
  defs.push(sparkDef(spark) + lin(gg, 0, 440, 0, 1000, P.ground));
  const body = [
    skyLayer(P, id, defs, spark),
    cloudsLayer(P, id, defs),
    skylineLayer(P),
    pyramidsLayer(P, spark),
    `<path d="${dunePath(DUNE_A)}" fill="${P.duneA}"/>`,
    sphinx(P, 640, 455, 0.72),
    `<path d="${dunePath(DUNE_B)}" fill="${P.duneB}"/>`,
    birdsLayer(P, id, defs),
    // palms peeking behind the bazaar
    palm(P, crown, 118, 470, 104, 318, -10, 0.7, 1, -6),
    palm(P, crown, 452, 474, 470, 352, 10, 0.6, -1, 6),
    `<path d="${dunePath(GROUND)}" fill="url(#${gg})"/>`,
    `<path d="M880,454C950,448 1010,456 1060,470C1110,484 1150,496 1210,510C1110,514 1030,500 970,482C930,470 900,461 880,454Z" fill="${P.duneShade}" opacity=".55"/>`,
    `<path d="${smooth([620, 680, 740, 800, 860, 920, 980, 1030].map((x) => [x, crestY(x) + 3]))}" fill="none" stroke="${P.duneHi}" stroke-width="3.5" opacity=".75"/>`,
    sandLayer(P),
    caravanLayer(P, id, defs, crestY),
    `<use href="#${gz.st}" transform="translate(1302 560) scale(-.34 .34)"/><use href="#${gz.lp}" transform="translate(1578 528) scale(-.34 .34)"/><use href="#${gz.st}" transform="translate(1536 548) scale(-.3 .3)"/>`,
    bazaarLayer(P, id, defs),
    oasisLayer(P, id, defs, cr, lily, reed, spark),
    foregroundLayer(P, id, defs),
  ].join('');
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" width="100%" height="100%" stroke-linecap="round" stroke-linejoin="round">' +
    `<defs>${defs.join('')}</defs>${body}</svg>`
  );
}

// ---------------------------------------------------------------- public: oasis centrepiece
function duck(P, x, y, k) {
  const T = P.t;
  const ink = P.ink;
  const w = T('#fffaf0');
  const ws = T('#e8dcc4');
  const or = T('#f59a2a');
  return (
    `<g transform="translate(${x} ${y}) scale(${k})" stroke-width="2.4">` +
    `<path d="M-16,-6C-16,-14 -6,-16 4,-14C10,-13 14,-10 14,-4C14,0 8,1 0,1C-10,1 -16,0 -16,-6Z" fill="${w}" stroke="${ink}"/>` +
    `<path d="M-16,-6L-21,-11L-14,-10Z" fill="${w}" stroke="${ink}" stroke-width="2"/>` +
    `<path d="M-8,-8C-2,-11 6,-9 8,-4C2,-2 -4,-3 -8,-8Z" fill="${ws}" stroke="${ink}" stroke-width="1.8"/>` +
    `<circle cx="10" cy="-18" r="7.5" fill="${w}" stroke="${ink}"/>` +
    `<path d="M16,-19C21,-19 24,-17 23,-15C21,-14 18,-14 16,-15Z" fill="${or}" stroke="${ink}" stroke-width="1.8"/>` +
    `<circle cx="12" cy="-20" r="1.5" fill="${T(EYE)}"/><ellipse cx="12" cy="-15.5" rx="2.2" ry="1.3" fill="${T(BLUSH)}" opacity=".6"/>` +
    '</g>'
  );
}
function frog(P, x, y, k) {
  const T = P.t;
  const ink = P.ink;
  const g = T('#74c24a');
  const gd = T('#4f9a3a');
  return (
    `<g transform="translate(${x} ${y}) scale(${k})" stroke-width="2.2">` +
    `<path d="M-12,0C-14,-8 -8,-13 0,-13C8,-13 14,-8 12,0Z" fill="${g}" stroke="${ink}"/>` +
    `<circle cx="-6" cy="-13" r="4.2" fill="${g}" stroke="${ink}"/><circle cx="6" cy="-13" r="4.2" fill="${g}" stroke="${ink}"/>` +
    `<circle cx="-6" cy="-13.5" r="2" fill="${T(EYE)}"/><circle cx="6" cy="-13.5" r="2" fill="${T(EYE)}"/>` +
    `<circle cx="-5.3" cy="-14.3" r=".7" fill="#fff"/><circle cx="6.7" cy="-14.3" r=".7" fill="#fff"/>` +
    `<path d="M-5,-6Q0,-3 5,-6" fill="none" stroke="${ink}" stroke-width="1.6"/>` +
    `<ellipse cx="-8.5" cy="-6.5" rx="2" ry="1.2" fill="${T(BLUSH)}" opacity=".6"/><ellipse cx="8.5" cy="-6.5" rx="2" ry="1.2" fill="${T(BLUSH)}" opacity=".6"/>` +
    `<path d="M-12,0C-16,-1 -17,1 -15,2M12,0C16,-1 17,1 15,2" fill="none" stroke="${gd}" stroke-width="2.2"/>` +
    '</g>'
  );
}
/**
 * Board-centrepiece layout, in the oasis group's local coordinates (the group is drawn 21 units
 * lower on the board). Overlays drawn by the app in front of this art (board units): dice-pyramid
 * keep-clear zone x 80–220 / y 51–196 (local y 30–175) — the pyramid itself fills x 81–219 /
 * y 54–169 — and five 46×46 dice huts at x 15/71/127/183/239, y 243–289 (local y 222–268).
 */
const OASIS = {
  dy: 21,
  pool: [150, 152, 118, 50, [1, 0.97, 1.04, 0.98, 1.02, 0.96, 1.03, 0.99, 0.97, 1.04, 0.98, 1.02]],
  bank: [1.05, 1.13], // the rim ring's outer edge = pool shape scaled about its centre
  hedge: { rx: 127, ryTop: 60, ryBot: 55.5, maxY: 220.5 }, // lowest point (incl. outline) ≤ local 220.5
  band: { rx: 134, ryTop: 64, ryBot: 60 }, // plant bases sit on this ellipse: the visible green band
  // plain lily pads [x, y, scale, flip]: the one left of the frog is gone, the one below the frog is
  // small and clear of the rim, the frog's pad and the lotus pad, and the one under the duck's beak
  // sits a little to the right so it no longer touches its neighbour
  pads: [[62, 126, 0.85, 1], [58, 175, 0.5, 1], [86, 166, 0.7, -1], [102, 196, 0.65, 1], [121.5, 196, 0.9, -1], [208, 184, 0.8, 1], [256, 134, 0.9, -1]],
  // pads carrying a flower [x, y, pad scale, 'lotus' | 'bud', flower scale] — all kept ≥ 3 clear of the rim
  flowers: [[74, 141, 0.7, 'bud', 0.75], [80, 180, 1, 'lotus', 1], [140, 168, 0.6, 'bud', 0.8], [210, 163, 0.8, 'bud', 0.8], [228, 172, 1.1, 'lotus', 1]],
  frogPad: [60, 162, 1.45],
  frog: [60, 163, 0.7125],
  duck: [112, 188, 0.855],
  hippo: [176, 197, 0.594], // scaled about the same waterline centre as before
  flamingo: [246, 173, 0.3, 1.7], // [x, y, scale, outline multiplier] — fully inside the right lobe
  waterReeds: [[40, 158, 0.24, -1], [143, 195, 0.16, -1]], // [x, y, scale, flip] rising out of the water
  // a taller reed left of the flamingo's head, drawn IN FRONT of the rim so it overlaps the rim and the
  // hedge behind it (clear of the pyramid's real outline and the flamingo's beak)
  frontReeds: [[220, 138, 0.44, -1]],
  dragonfly: [53.5, 140, 0.5],
  // ripple dashes in open water: [waterLine path, waterHi path]
  ripples: ['M62,132H68M96,160H104M150,160H160M188,168H196M201,195H208M226,152H232', 'M62,147H66M154,164H158'],
  // night: fireflies over the hedge, the palms and open water (local) …
  fireflies: [[40, 94, 0.7], [60, 140, 0.6], [260, 94, 0.7], [270, 100, 0.6], [18, 196, 0.6], [284, 192, 0.6], [100, 150, 0.6], [196, 158, 0.6]],
  // … and two above the pyramid apex (board coords), clear of the pyramid box and the "Tap to roll!" pill
  skyFireflies: [[105, 48, 0.6], [196, 38, 0.6]],
};

/**
 * Hedge plantings: [kind, angle° round the pool (0 right · 90 bottom · 180 left · 270 top), scale,
 * flip, radial nudge]. Every plant stands on the visible green band between the rim and the
 * hedge's outer edge; tuck-in bubbles under its base become part of the hedge silhouette.
 * A–E are the planting options that were offered to the user; the game draws DEFAULT_PLANTING.
 * (tools/plant-options.html still shows all five side by side.)
 */
const DEFAULT_PLANTING = 'E'; // the user picked E · Flowery
const TOP_ZONE = [238, 302]; // angles whose band points fall inside the pyramid zone (x 80–220)
const cycle = (arr, i) => arr[i % arr.length];
const PLANTINGS = {
  // A · Tidy tufts: a dozen evenly spaced little tufts + the two end reed clumps
  A: [
    ['reed', 180, 0.42, -1], ['reed', 0, 0.42, 1],
    ...[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((a, i) => ['tuft', a, a > 60 && a < 120 ? 0.28 : a > 238 && a < 302 ? 0.33 : 0.38, i % 2 ? -1 : 1]),
  ],
  // B · Reed bed: tall cattail clumps at the ends and top corners, short ones low down, grass between
  B: [
    ['cattail', 178, 0.5, -1], ['cattail', 2, 0.5, 1], ['cattail', 214, 0.52, 1], ['cattail', 326, 0.52, -1],
    ['cattail', 130, 0.3, 1], ['cattail', 50, 0.3, -1],
    ['tuft', 198, 0.4, 1], ['tuft', 342, 0.4, -1], ['tuft', 156, 0.38, -1], ['tuft', 24, 0.38, 1],
    ['tuft', 244, 0.32, 1], ['tuft', 296, 0.32, -1], ['tuft', 104, 0.26, 1], ['tuft', 76, 0.26, -1],
  ],
  // C · Wild meadow: a dense fringe of wispy grass of mixed heights; reeds only at the two ends
  C: [
    ['reed', 180, 0.42, -1], ['reed', 0, 0.42, 1],
    ...[16, 32, 48, 64, 80, 96, 112, 128, 144, 162, 198, 214, 230, 246, 262, 278, 294, 310, 326, 344].map((a, i) => {
      const low = a > 45 && a < 135;
      const zone = a > TOP_ZONE[0] && a < TOP_ZONE[1];
      const k = low ? cycle([0.27, 0.23, 0.3], i) : zone ? cycle([0.3, 0.34, 0.27], i) : cycle([0.46, 0.36, 0.52, 0.4], i);
      return ['meadow', a, k, i % 2 ? -1 : 1, low ? 0 : cycle([0, 1.5, -1], i)];
    }),
  ],
  // D · Papyrus oasis: papyrus umbrella stalks behind the pool and at the ends, small tufts between
  D: [
    ['papyrus', 220, 0.56, 1], ['papyrus', 320, 0.56, -1], ['papyrus', 188, 0.48, -1], ['papyrus', 352, 0.48, 1],
    ['papyrus', 233, 0.36, 1], ['papyrus', 307, 0.36, -1],
    ['tuft', 164, 0.4, 1], ['tuft', 16, 0.4, -1], ['tuft', 136, 0.34, -1], ['tuft', 44, 0.34, 1], ['tuft', 108, 0.26, 1], ['tuft', 72, 0.26, -1],
    ['tuft', 256, 0.3, 1], ['tuft', 284, 0.3, -1],
  ],
  // E · Flowery: grass and reeds with tiny desert wildflowers (see BLOOMS) sprinkled over the hedge
  E: [
    ['reed', 170, 0.42, -1], ['reed', 10, 0.42, 1],
    ['tuft', 222, 0.42, 1], ['tuft', 318, 0.42, -1], ['tuft', 148, 0.38, 1], ['tuft', 32, 0.38, -1],
    ['tuft', 122, 0.3, 1], ['tuft', 58, 0.3, -1], ['tuft', 250, 0.3, 1], ['tuft', 290, 0.3, -1],
  ],
};
/** option E wildflowers: [angle°, radial nudge, scale, petal colour] */
const BLOOMS = {
  E: [
    [140, -1, 0.9, '#fffaf0'], [135, 2, 0.8, '#f5cf2f'], [110, 0, 0.75, '#fffaf0'], [98, 1, 0.7, '#f5cf2f'], [84, 0, 0.72, '#fffaf0'], [70, 1, 0.75, '#f5cf2f'],
    [45, 0, 0.8, '#fffaf0'], [40, 3, 0.85, '#f5cf2f'], [22, -1, 1, '#fffaf0'], [2, 1, 1, '#f5cf2f'], [340, 0, 1, '#fffaf0'], [330, 4, 0.9, '#f5cf2f'],
    [306, 1, 0.9, '#fffaf0'], [296, 4, 0.8, '#f5cf2f'], [264, 3, 0.75, '#fffaf0'], [276, 2, 0.8, '#f5cf2f'], [244, 4, 0.8, '#fffaf0'], [234, 1, 0.9, '#f5cf2f'],
    [210, 4, 0.9, '#fffaf0'], [198, -1, 1, '#f5cf2f'], [186, 2, 1, '#fffaf0'], [158, 1, 1, '#f5cf2f'],
  ],
};
/** tuck-in bubbles under each plant's base [dx, dy, r] (× the plant's scale) */
const TUCKS = {
  tuft: [[-8, 3, 9], [8, 3, 9], [0, 2, 7]],
  meadow: [[-8, 3, 9], [8, 3, 9], [0, 2, 7]],
  reed: [[-6, 4, 9], [6, 4, 8], [0, 3, 7]],
  cattail: [[-6, 4, 9], [6, 4, 8], [0, 3, 7]],
  papyrus: [[-9, 4, 10], [8, 4, 9], [0, 3, 8]],
};

/** overlapping circles for one continuous bubbly hedge around the pool (lowest point capped) */
function hedgeBubbles(cx, cy, { rx, ryTop, ryBot, maxY }, seed, sw) {
  const rnd = rng(seed);
  const M = 720;
  const ring = [];
  for (let i = 0; i <= M; i++) {
    const a = (i / M) * Math.PI * 2;
    const sn = Math.sin(a);
    ring.push([cx + Math.cos(a) * rx, cy + sn * (sn > 0 ? ryBot : ryTop), sn]);
  }
  const out = [];
  let acc = 0;
  let next = 0;
  for (let i = 1; i < M; i++) {
    acc += Math.hypot(ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]);
    if (acc < next) continue;
    const [x, y, sn] = ring[i];
    const r = Math.min(13.5 - 4.5 * Math.max(0, sn) + (rnd() - 0.5) * 3.5, maxY - sw - y);
    out.push([x, y, r]);
    next = acc + Math.max(6, r * 1.15);
  }
  return out;
}
/** a point on the hedge's visible green band at the given angle (nudge moves it outwards) */
function bandPoint(L, deg, nudge = 0) {
  const a = (deg * Math.PI) / 180;
  const sn = Math.sin(a);
  const { rx, ryTop, ryBot } = L.band;
  return [L.pool[0] + Math.cos(a) * (rx + nudge), L.pool[1] + sn * ((sn > 0 ? ryBot : ryTop) + nudge)];
}
/** dense points along the same closed Catmull-Rom spline that smooth(pts, true) draws */
function splinePts(pts) {
  const n = pts.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    for (let k = 0; k < 24; k++) {
      const t = k / 24;
      const u = 1 - t;
      out.push([
        u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0],
        u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1],
      ]);
    }
  }
  return out;
}
function inPoly(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const polyDist = (poly, x, y) => Math.min(...poly.map(([px, py]) => Math.hypot(px - x, py - y)));
/** outline of a reedDef clump (base at 0,0): blades, cattail head and both papyrus umbels */
const REED_HULL = [[-4, 0], [-26, -42], [-19, -81], [-1, -86], [4, -87], [13, -83], [16, -79], [25.5, -66], [32, -58], [33, -53.5], [26, -34], [4, 0]];
/** that outline placed at (x, y) with scale k and flip, as dense points (so polyDist ≈ distance to the edge) */
function reedFootprint(x, y, k, flip = 1) {
  const pts = REED_HULL.map(([u, v]) => [x + u * k * flip, y + v * k]);
  const dense = [];
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % pts.length];
    for (let t = 0; t < 1; t += 0.1) dense.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
  }
  return dense;
}
const onGreen = (green, x, y, margin) => green.some(([bx, by, r]) => Math.hypot(x - bx, y - by) < r - margin);
/**
 * Resolve a planting: plant positions, their tuck-in bubbles, and (option E) wildflowers — each
 * bloom slides along its radius (and shrinks if it must) until it sits wholly on the visible
 * green: on the hedge, clear of the rim.
 */
function plantLayout(L, key, bubbles, bankCtrl) {
  const use = PLANTINGS[key] ? key : DEFAULT_PLANTING;
  const list = PLANTINGS[use];
  const plants = list.map(([kind, deg, k, flip = 1, nudge = 0]) => {
    // the band is thinnest along the bottom arc: sit low plants a little further out so more shows
    const low = deg > 45 && deg < 135 ? 2.5 : 0;
    const [x, y] = bandPoint(L, deg, nudge + low);
    return { kind, x, y, k, flip };
  });
  const tucks = [];
  for (const p of plants) {
    for (const [tx, ty, tr] of TUCKS[p.kind]) {
      const cy = p.y + ty * p.k;
      const r = Math.min(Math.max(tr * p.k, 4.5), L.hedge.maxY - 2.5 - cy);
      if (r > 1) tucks.push([p.x + tx * p.k * p.flip, cy, r]);
    }
  }
  const blooms = [];
  if (BLOOMS[use]) {
    const green = [...bubbles, ...tucks];
    const bank = splinePts(bankCtrl);
    for (const [deg, nudge, k0, c] of BLOOMS[use]) {
      let spot = null;
      for (let k = k0; k > 0.5 && !spot; k -= 0.1) {
        const r = 5.2 * k;
        let bestN = Infinity;
        for (let n = -7; n <= 7; n += 0.5) {
          const [x, y] = bandPoint(L, deg, n);
          const ok =
            [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r], [r * 0.7, r * 0.7], [-r * 0.7, r * 0.7], [r * 0.7, -r * 0.7], [-r * 0.7, -r * 0.7]].every(([u, v]) => onGreen(green, x + u, y + v, 0.6)) &&
            !inPoly(bank, x, y) &&
            polyDist(bank, x, y) >= r + 1.4;
          if (ok && Math.abs(n - nudge) < Math.abs(bestN - nudge)) {
            bestN = n;
            spot = [x, y, k];
          }
        }
      }
      if (spot) blooms.push([...spot, c]);
    }
  }
  return { plants, tucks, blooms };
}

/** plants that grow out of the hedge; grass fills are the hedge green so their open bases merge into it */
function hedgePlantDefs(P, id, defs, hedgeG) {
  const ink = P.ink;
  const soft = (h) => (P.night ? mix(P.t(h), h, 0.35) : P.t(h));
  const D = { tuft: id('ht'), meadow: id('hm'), cattail: id('hc'), papyrus: id('hp'), bloom: id('hb') };
  const lite = soft('#a6d86a');
  const reedG = P.t('#5fa83e');
  const brown = P.t('#8a5226');
  const tuftD = 'M-14,0Q-16,-8 -22,-12Q-12,-11 -8,-4Q-10,-14 -8,-22Q-3,-14 -3,-5Q0,-16 3,-24Q5,-14 3,-4Q7,-13 12,-18Q10,-8 8,-2Q14,-8 20,-9Q16,-3 14,0';
  const meadowD = 'M-12,0Q-18,-10 -26,-16Q-14,-14 -8,-6Q-12,-18 -12,-30Q-5,-18 -3,-7Q-2,-22 2,-34Q5,-20 3,-6Q8,-18 14,-26Q12,-12 8,-3Q15,-10 24,-12Q17,-5 12,0';
  const stem = (d, w = 1.8) => `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${w + 2.8}"/><path d="${d}" fill="none" stroke="${reedG}" stroke-width="${w}"/>`;
  const leaf = (d) => `<path d="${d}" fill="${reedG}" stroke="${ink}" stroke-width="2"/>`;
  const head = (x, y, w, h, a) => `<rect x="${f(x - w / 2)}" y="${f(y - h)}" width="${w}" height="${h}" rx="${f(w / 2)}" transform="rotate(${a} ${x} ${y})" fill="${brown}" stroke="${ink}" stroke-width="2"/>`;
  const umbel = (x, y, a, k) =>
    `<g transform="translate(${x} ${y}) rotate(${a}) scale(${k})"><path d="M0,0L-13,-6Q-13,-10 -10,-13Q-6,-16.5 0,-17Q6,-16.5 10,-13Q13,-10 13,-6Z" fill="${soft('#9ad35e')}" stroke="${ink}" stroke-width="2"/>` +
    `<path d="M0,0L-10,-10M0,0L-5,-14.5M0,0L1,-16M0,0L6.5,-13.5M0,0L10.5,-8.5" fill="none" stroke="${soft('#4f9a3a')}" stroke-width="1.4"/></g>`;
  const mg = id('mg');
  defs.push(
    // grass tuft: same green as the hedge, no stroke along its base
    `<g id="${D.tuft}"><path d="${tuftD}Z" fill="${hedgeG}"/><path d="${tuftD}" fill="none" stroke="${ink}" stroke-width="2.2"/>` +
      `<path d="M-4,-3Q-6,-10 -7,-16M5,-3Q6,-9 9,-13" fill="none" stroke="${lite}" stroke-width="2"/></g>` +
      // wispy meadow grass: hedge green at the base fading to sunny tips
      lin(mg, 0, 0, 0, -32, [[0, hedgeG], [0.3, hedgeG], [1, soft('#bcd85c')]]) +
      `<g id="${D.meadow}"><path d="${meadowD}Z" fill="url(#${mg})"/><path d="${meadowD}" fill="none" stroke="${ink}" stroke-width="2.2"/>` +
      `<path d="M-6,-4Q-9,-14 -10,-22M4,-4Q5,-14 8,-20" fill="none" stroke="${lite}" stroke-width="1.8"/></g>` +
      // cattail clump: long leaves + three brown heads
      `<g id="${D.cattail}">` +
      leaf('M-2,0C-5,-22 -9,-42 -17,-58C-9,-44 -3,-24 2,-2Z') +
      leaf('M2,0C5,-20 11,-36 20,-48C11,-37 5,-20 -1,-2Z') +
      stem('M-6,0C-7,-22 -9,-44 -11,-64') + stem('M5,0C6,-20 8,-38 11,-54') + stem('M0,0C0,-20 -1,-34 -2,-46') +
      leaf('M-1,0C-2,-26 -1,-50 1,-76C3,-50 3,-26 3,0Z') +
      head(-11, -64, 6.5, 17, -6) + head(11, -54, 6, 15, 12) + head(-2, -46, 5.5, 12, -2) +
      `<path d="M-13,-81l-.8,-6M14.6,-68.5l1,-5M-2.4,-58l0,-5" fill="none" stroke="${ink}" stroke-width="1.8"/>` +
      '</g>' +
      // papyrus: tall smooth stalks topped with umbrella-like umbels, little sheath leaves at the base
      `<g id="${D.papyrus}">` +
      stem('M-5,0C-7,-22 -11,-42 -15,-60', 2) + stem('M0,0C1,-26 1,-52 2,-78', 2) + stem('M5,0C7,-20 11,-36 17,-50', 2) +
      umbel(-15, -60, -13, 1) + umbel(2, -78, 2, 1.1) + umbel(17, -50, 24, 0.9) +
      leaf('M-6,0Q-9,-7 -14,-10Q-7,-9 -2,-2Z') + leaf('M6,0Q9,-7 14,-9Q7,-8 2,-2Z') +
      '</g>' +
      // tiny desert wildflower: five petals (fill from the <use>) round a warm centre
      `<g id="${D.bloom}" stroke="${ink}" stroke-width="1.2">` +
      [0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        return `<circle cx="${f(Math.cos(a) * 2.7)}" cy="${f(Math.sin(a) * 2.7)}" r="2.3"/>`;
      }).join('') +
      `<circle cx="0" cy="0" r="1.7" fill="${soft('#f2a93b')}"/></g>`
  );
  return D;
}

/**
 * The board centrepiece. `opts.plants` picks a hedge planting option ('A'–'E'); without it the
 * default planting is drawn (what the game uses).
 */
export function oasisSVG(theme = 'sand', opts = {}) {
  const P = palette(theme);
  const id = idMaker('oa');
  const defs = [];
  const T = P.t;
  const ink = P.ink;
  const L = OASIS;
  const cr = crownDef(P, id, defs);
  const crown = cr.crown;
  const lily = lilyDefs(P, id, defs);
  const reed = reedDef(P, id, defs);
  const sb = shrubDefs(P, id, defs);
  const rk = rockDefs(P, id, defs);
  const hedgeG = T('#78bf4c');
  const pd = hedgePlantDefs(P, id, defs, hedgeG);
  // sand tuft for the palm bases (gentler night grade so it stays readable on the dark sand) + lotus bud
  const soft = (h) => (P.night ? mix(P.t(h), h, 0.35) : P.t(h));
  const gt = id('gt');
  const bud = id('bd');
  defs.push(
    `<g id="${gt}" stroke="${ink}" stroke-width="2.2"><path d="M-14,0Q-16,-8 -22,-12Q-12,-11 -8,-4Q-10,-14 -8,-22Q-3,-14 -3,-5Q0,-16 3,-24Q5,-14 3,-4Q7,-13 12,-18Q10,-8 8,-2Q14,-8 20,-9Q16,-3 14,0Z" fill="${soft('#78bf4c')}"/>` +
      `<path d="M-4,-3Q-6,-10 -7,-16M5,-3Q6,-9 9,-13" fill="none" stroke="${soft('#4f9a3a')}" stroke-width="2"/></g>` +
      `<g id="${bud}" stroke="${ink}" stroke-width="1.4"><path d="M-3,-1Q-6,-4 -6,-7Q-2,-5 0,-1ZM3,-1Q6,-4 6,-7Q2,-5 0,-1Z" fill="${T('#78bf4c')}"/>` +
      `<path d="M0,0C-4.5,-2 -5,-8 0,-13C5,-8 4.5,-2 0,0Z" fill="${P.glow('#f7a8c0')}"/><path d="M0,-2.5Q-1.2,-7 0,-10.5" fill="none" stroke="${P.glow('#fde0ea')}" stroke-width="1.2"/></g>`
  );
  const put = (ref, x, y, k, flip = 1) => `<use href="#${ref}" transform="translate(${f(x)} ${f(y)}) scale(${f(k * flip)} ${f(k)})"/>`;
  const gg = id('g');
  defs.push(
    `<radialGradient id="${gg}" gradientUnits="userSpaceOnUse" cx="150" cy="165" r="220"><stop offset="0" stop-color="${T('#f9dc98')}"/><stop offset=".6" stop-color="${T('#f5cb82')}"/><stop offset="1" stop-color="${T('#efb46c')}"/></radialGradient>`
  );
  let s = `<rect width="300" height="300" fill="url(#${gg})"/>`;
  // gentle sand ripples all over the sand, but not under the oasis, the palm bases or the hut row
  const rnd = rng(3);
  let rip = '';
  let hi = '';
  for (let n = 0, tries = 0; n < 26 && tries < 600; tries++) {
    const w = 14 + rnd() * 16;
    const x = 2 + rnd() * (294 - w);
    const y = 6 + rnd() * 290;
    const cx = x + w / 2;
    if (((cx - 150) / 146) ** 2 + ((y - 173) / 78) ** 2 < 1) continue;
    if (y > 240 && y < 292) continue;
    if (Math.hypot(cx - 16, y - 129) < 24 || Math.hypot(cx - 284, y - 129) < 24) continue;
    n++;
    rip += `M${f(x)},${f(y)}q${f(w / 2)},${f(-w * 0.14)} ${f(w)},0`;
    hi += `M${f(x + 2)},${f(y - 2.6)}q${f(w / 2 - 2)},${f(-w * 0.14)} ${f(w - 4)},0`;
  }
  s += `<path d="${hi}" fill="none" stroke="${T('#fdeab8')}" stroke-width="1.8" opacity=".9"/><path d="${rip}" fill="none" stroke="${T('#dc9a5c')}" stroke-width="2" opacity=".5"/>`;

  // ---- the oasis group, drawn L.dy lower (all coordinates below are group-local)
  s += `<g transform="translate(0 ${L.dy})">`;
  const [pcx, pcy, prx, pry, wob] = L.pool;
  const pts = blobPts(pcx, pcy, prx, pry, wob);
  const poolD = smooth(pts, true);
  const bankCtrl = pts.map(([x, y]) => [pcx + (x - pcx) * L.bank[0], pcy + (y - pcy) * L.bank[1]]);
  const bankD = smooth(bankCtrl, true);
  // 1) ONE bubbly hedge silhouette: ring bubbles + every plant's tuck-in bubbles, all ink first and
  //    then all fills, so the only outline is the outer edge (no circle outlines inside the green)
  const bubbles = hedgeBubbles(pcx, pcy, L.hedge, 17, 2.5);
  const planting = plantLayout(L, opts.plants, bubbles, bankCtrl);
  // no wildflower may hide behind a reed clump (hedge reeds, water reeds, or the front reed)
  const reedHulls = [...planting.plants.filter((p) => p.kind === 'reed').map((p) => [p.x, p.y, p.k, p.flip]), ...L.waterReeds, ...L.frontReeds].map(
    ([x, y, k, fl]) => reedFootprint(x, y, k, fl)
  );
  const blooms = planting.blooms.filter(([x, y, k]) => reedHulls.every((h) => !inPoly(h, x, y) && polyDist(h, x, y) >= 5.2 * k + 1));
  s += blob([...bubbles, ...planting.tucks], hedgeG, ink, 2.5);
  // 2) on top of the green: wildflowers (option E), then grass & reeds with their bases on the hedge
  for (const [x, y, k, c] of blooms) s += `<use href="#${pd.bloom}" transform="translate(${f(x)} ${f(y)}) scale(${k})" fill="${soft(c)}"/>`;
  for (const p of planting.plants) s += put(p.kind === 'reed' ? reed : pd[p.kind], p.x, p.y, p.k, p.flip);
  // 3) water: deep tone, gradient, palm reflections, ripples & sparkle dashes, rings under animals/reeds
  const clip = id('pc');
  const wg = id('wg');
  const pool = id('pool');
  defs.push(`<path id="${pool}" d="${poolD}"/><clipPath id="${clip}"><use href="#${pool}"/></clipPath>` + lin(wg, 0, 100, 0, 205, P.water));
  s += `<g clip-path="url(#${clip})"><rect x="0" y="90" width="300" height="130" fill="${P.waterDeep}"/><use href="#${pool}" transform="translate(0 7)" fill="url(#${wg})"/>`;
  s += `<g fill="${P.waterDeep}" opacity=".3"><use href="#${cr.sil}" transform="translate(36 166) scale(.5 -.28)"/><use href="#${cr.sil}" transform="translate(264 166) scale(-.5 -.28)"/></g>`;
  // (at night the pale-gold waterHi dashes double as moonlight glitter)
  s += `<path d="${L.ripples[0]}" stroke="${P.waterLine}" stroke-width="2.4" opacity=".8"/><path d="${L.ripples[1]}" stroke="${P.waterHi}" stroke-width="2.4"/>`;
  const [dx, dyk, dk2] = L.duck;
  const [hx, hy, hk] = L.hippo;
  const [fx, fy, fk, fm] = L.flamingo;
  s += waterRing(P, dx, dyk + dk2, 17 * dk2, 3.5 * dk2, 2 * dk2) + hippoWater(P, hx, hy, hk) + waterRing(P, fx + 1, fy, 22 * fk, 5 * fk, 1.8);
  for (const [x, y, k] of [...L.waterReeds, ...L.frontReeds]) s += waterRing(P, x, y, 30 * k, 8.5 * k, 1.6);
  s += '</g>';
  // 4) lily pads, the frog's pad, then the pads that carry lotus flowers & buds — all above the ripples
  for (const [x, y, k, fl] of L.pads) s += put(lily.pad, x, y, k, fl);
  s += put(lily.pad, L.frogPad[0], L.frogPad[1], L.frogPad[2]);
  L.flowers.forEach(([x, y, pk], i) => {
    s += put(lily.pad, x, y, pk, i % 2 ? 1 : -1);
  });
  for (const [x, y, , kind, k] of L.flowers) s += put(kind === 'bud' ? bud : lily.lotus, x, y, k);
  // 5) little cattail clumps rising out of the water, then the animals
  for (const [x, y, k, fl] of L.waterReeds) s += put(reed, x, y, k, fl);
  s += frog(P, ...L.frog) + duck(P, dx, dyk, dk2) + hippo(P, hx, hy, hk) + flamingo(P, fx, fy, fk, fm, 0.45);
  // 6) palms in the top corners, trunks planted in the sand: little sand mound + root flare,
  //    contact shadow (inside palm()), grass tufts at the base
  const foot = (x, y) =>
    `<ellipse cx="${x}" cy="${y + 1}" rx="17" ry="5.5" fill="${T('#f9dc98')}" stroke="${T('#e3a868')}" stroke-width="1.6"/>` +
    `<g fill="${T('#b77a48')}" stroke="${ink}" stroke-width="1.6"><ellipse cx="${x - 9}" cy="${y - 0.5}" rx="4.8" ry="3.4"/><ellipse cx="${x + 9}" cy="${y - 0.5}" rx="4.8" ry="3.4"/></g>`;
  s += foot(16, 108) + palm(P, crown, 16, 108, 30, 44, -3, 0.5, 1, 8) + put(gt, 5, 111, 0.45) + put(gt, 29, 112, 0.38, -1);
  s += foot(284, 108) + palm(P, crown, 284, 108, 270, 44, 3, 0.5, -1, -8) + put(gt, 295, 111, 0.45, -1) + put(gt, 271, 112, 0.38);
  s += critters(P, P.night ? L.fireflies : [L.dragonfly]);
  // 7) the tan pool rim on top of everything (only the app's dice pyramid sits in front of it)…
  s += `<path d="${bankD}${poolD}" fill="${T('#e0a062')}" fill-rule="evenodd" stroke="${ink}" stroke-width="2.5"/>`;
  // 8) …except the tall reed beside the flamingo, which stands in front of the rim and the hedge
  for (const [x, y, k, fl] of L.frontReeds) s += put(reed, x, y, k, fl);
  s += '</g>';
  // low details in the sand: right side above the huts, and the corners below the hut row
  s += put(rk.r2, 290, 234, 0.35) + put(sb.b, 5, 300, 0.42) + put(sb.t, 297, 300, 0.42) + put(rk.r2, 270, 299, 0.42);
  // night: two fireflies drifting above the pyramid's apex (board coordinates)
  if (P.night) s += critters(P, L.skyFireflies);
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="100%" height="100%" stroke-linecap="round" stroke-linejoin="round">' +
    `<defs>${defs.join('')}</defs>${s}</svg>`
  );
}
