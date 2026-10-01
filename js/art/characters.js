// Oasis Derby: player portraits, the starting-player pharaoh mask and the
// spectator crowds. Hand-written sticker-style SVG strings, see
// docs/ART_STYLE.md. Pure functions only: no DOM access at import time.

export const CHARACTERS = [
  // (ids are kept from earlier versions so saved games and online rooms keep working)
  { id: 'explorer', name: 'Ruby', title: 'The Archaeologist', color: '#7fd1c6' },
  { id: 'merchant', name: 'Omar', title: 'The Spice Merchant', color: '#f5b94f' },
  { id: 'bookie', name: 'Bashir', title: 'The Bookmaker', color: '#cfd66a' },
  { id: 'mystic', name: 'Zara', title: 'The Fortune Teller', color: '#f5a38c' },
  { id: 'aviator', name: 'Archie', title: 'The Aviator', color: '#8cc4f0' },
  { id: 'camelmaster', name: 'Karim', title: 'The Professor', color: '#8fd39a' },
  { id: 'socialite', name: 'Clementine', title: 'The Socialite', color: '#eea6cf' },
  { id: 'catkeeper', name: 'Charlotte', title: 'The Historian', color: '#b9a3e6' },
];

// ------------------------------------------------------------------ kit --
const INK = '#3b2412';
const EYE = '#2a1a10';
const BLUSH = '#f28b82';
const GOLD = '#f2b84b';
const GOLD_D = '#d99a1e';
const GOLD_L = '#fbe08a';
const CREAM = '#fff3d4';
const WHITE = '#fffaf0';
const MOUTH = '#8e2a2a';
const TONGUE = '#f5899a';
const NS = ' stroke="none"';

let seq = 0;
const uid = (p) => `${p}${(++seq).toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const r1 = (n) => Math.round(n * 10) / 10;

/** Flat shadow tone: a darker, slightly warmer version of a colour. */
function shade(hex, k = 0.86) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v, m) => Math.max(0, Math.min(255, Math.round(v * m)));
  const rgb = (c(n >> 16, k + 0.03) << 16) | (c((n >> 8) & 255, k) << 8) | c(n & 255, k - 0.06);
  return '#' + rgb.toString(16).padStart(6, '0');
}

// (also squashes float noise such as 91.60000000000001 back to one decimal)
const svg = (vb, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body.replace(/\d+\.\d{3,}/g, (n) => r1(+n))}</svg>`;
const inked = (body, w = 2.5) =>
  `<g stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round">${body}</g>`;
const P = (d, f, x = '') => `<path d="${d}" fill="${f}"${x}/>`;
const S = (d, f, x = '') => `<path d="${d}" fill="${f}"${NS}${x}/>`;
const L = (d, w = 2, c = INK, x = '') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}"${x}/>`;
const C = (cx, cy, r, f, x = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"${x}/>`;
const E = (cx, cy, rx, ry, f, x = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}"${x}/>`;
const G = (t, s) => `<g transform="${t}">${s}</g>`;
const flip = (s, cx = 50) => G(`matrix(-1 0 0 1 ${2 * cx} 0)`, s);
const sym = (s, cx = 50) => s + flip(s, cx);
/** Filled shape with flat shading painted inside it, outline drawn last. */
const sh = (d, f, inner) => S(d, f) + inner + P(d, 'none');
/** Outlined "sausage" stroke for arms and cords. */
const tube = (d, col, w = 5, o = 2) => L(d, w + 2 * o, INK) + L(d, w, col);
/** Tiny unoutlined dots, e.g. freckles or sequins: pts = [x, y, x, y, ...]. */
const dots = (pts, r, f) => {
  let s = '';
  for (let i = 0; i < pts.length; i += 2) s += C(pts[i], pts[i + 1], r, f, NS);
  return s;
};

// ---- faces
function dotEyes(y, dx = 10, cx = 50, rx = 3, ry = 3.8) {
  let s = '';
  for (const x of [cx - dx, cx + dx]) {
    s += E(x, y, rx, ry, EYE, NS) + C(r1(x + rx * 0.33), r1(y - ry * 0.4), r1(rx * 0.4), '#fff', NS);
  }
  return s;
}
function happyEyes(y, dx = 10, cx = 50, w = 3.6, sw = 2.4) {
  let s = '';
  for (const x of [cx - dx, cx + dx]) {
    s += L(`M${r1(x - w)} ${r1(y + 1.2)}Q${x} ${r1(y - 3.8)} ${r1(x + w)} ${r1(y + 1.2)}`, sw, EYE);
  }
  return s;
}
const cheeks = (y, dx = 16.5, cx = 50, rx = 4.6, ry = 2.8) =>
  E(r1(cx - dx), y, rx, ry, BLUSH, NS + ' opacity=".55"') + E(r1(cx + dx), y, rx, ry, BLUSH, NS + ' opacity=".55"');
const nose = (skin, x = 50, y = 64.5, rx = 2.3, ry = 1.7) => E(x, y, rx, ry, shade(skin, 0.8), NS);
function openSmile(x = 50, y = 69, w = 5.5, h = 6, sw = 2) {
  const a = r1(x - w), b = r1(x + w), yb = r1(y + h);
  const tl = r1(x - w * 0.55), tr = r1(x + w * 0.55), ty = r1(y + h * 0.78);
  return (
    P(`M${a} ${y}Q${x} ${r1(y + 1.8)} ${b} ${y}Q${r1(b - 0.8)} ${yb} ${x} ${yb}Q${r1(a + 0.8)} ${yb} ${a} ${y}Z`, MOUTH, ` stroke-width="${sw}"`) +
    S(`M${tl} ${ty}Q${x} ${r1(y + h * 0.42)} ${tr} ${ty}Q${x} ${r1(y + h)} ${tl} ${ty}Z`, TONGUE)
  );
}

// ---- heads & bodies
function headPath(cx, top, bot, hw, k = 0.58) {
  const my = r1(top + (bot - top) * 0.54);
  const a = r1(hw * k), b1 = r1((my - top) * k), b2 = r1((bot - my) * k);
  const l = r1(cx - hw), r = r1(cx + hw);
  return (
    `M${cx} ${top}C${r1(cx + a)} ${top} ${r} ${r1(my - b1)} ${r} ${my}C${r} ${r1(my + b2)} ${r1(cx + a)} ${bot} ${cx} ${bot}` +
    `C${r1(cx - a)} ${bot} ${l} ${r1(my + b2)} ${l} ${my}C${l} ${r1(my - b1)} ${r1(cx - a)} ${top} ${cx} ${top}Z`
  );
}
const head = (skin, cx = 50, top = 33, bot = 79, hw = 26, k) => P(headPath(cx, top, bot, hw, k), skin);
const ears = (skin, y = 60, cx = 50, dx = 25.5) =>
  sym(E(r1(cx - dx), y, 4.6, 6, skin) + E(r1(cx - dx - 0.6), y, 2, 3.4, shade(skin), NS), cx);
const torso = (fill, cx = 50, top = 83, hw = 40) =>
  P(`M${cx - hw} 104C${cx - hw} ${top + 7} ${cx - hw + 11} ${top} ${cx - 13} ${top}H${cx + 13}C${cx + hw - 11} ${top} ${cx + hw} ${top + 7} ${cx + hw} 104Z`, fill);
const neck = (skin, cx = 50, w = 7, top = 70, bot = 86) =>
  P(`M${cx - w} ${top}V${bot}Q${cx} ${bot + 4} ${cx + w} ${bot}V${top}Z`, shade(skin));

// ---- portrait background: soft sun rays + a lighter inner ring
const RAYS = (() => {
  let d = '';
  for (let i = 0; i < 12; i++) {
    const a = ((i * 30 - 90) * Math.PI) / 180, b = a + Math.PI / 12;
    d += `M50 56L${r1(50 + 90 * Math.cos(a))} ${r1(56 + 90 * Math.sin(a))}L${r1(50 + 90 * Math.cos(b))} ${r1(56 + 90 * Math.sin(b))}Z`;
  }
  return d;
})();

function framed(color, art, bg) {
  if (!bg) return svg('0 0 100 100', art);
  const id = uid('pc');
  return svg(
    '0 0 100 100',
    `<defs><clipPath id="${id}"><circle cx="50" cy="50" r="50"/></clipPath></defs>` +
      `<g clip-path="url(#${id})"><circle cx="50" cy="50" r="50" fill="${color}"/>` +
      `<path d="${RAYS}" fill="#fff" opacity=".17"/>` +
      `<circle cx="50" cy="50" r="42.5" fill="none" stroke="#fff" stroke-width="3" opacity=".3"/>` +
      art +
      '</g>' +
      `<circle cx="50" cy="50" r="48.75" fill="none" stroke="${INK}" stroke-width="2.5"/>`
  );
}

// ------------------------------------------------------------ portraits --
const ART = {
  explorer() {
    const skin = '#f6d3b0', hair = '#b5562b', kh = '#d8c08a', khD = '#bea46d', khL = '#ede1b9', band = '#8a6a3a';
    const shirt = '#c8ac70', red = '#e0344f', redD = '#b82640';
    const rim = (x) => C(x, 59, 6.4, '#fff', ' fill-opacity=".15" stroke-width="1.7"');
    return inked(
      P('M19 71C14 53 20 35 50 33C80 35 86 53 81 71C79 76 72 77 70 72H30C28 77 21 76 19 71Z', hair) +
        torso(shirt) +
        neck(skin) +
        P('M41.5 77.5Q50 83.5 58.5 77.5L59 83Q50 89.5 41 83Z', red) +
        sym(P('M41 80.5L31.5 84L37.5 94.5L46 87Z', khL)) +
        P('M47.5 88L44 97.5L50 95.5Z', red) + P('M52.5 88L56 97.5L50 95.5Z', redD) + C(50, 87.5, 3.2, red) +
        head(skin) +
        cheeks(66.5) +
        dots([29, 67.5, 31.5, 69.5, 33.5, 67, 71, 67.5, 68.5, 69.5, 66.5, 67], 0.8, '#c0663a') +
        dotEyes(59) +
        nose(skin, 50, 65) +
        openSmile(50, 69.5, 5, 5.4) +
        rim(40) + rim(60) +
        L('M46.4 58.2Q50 56.4 53.6 58.2', 1.7) + L('M33.6 57.6L27.5 55.5M66.4 57.6L72.5 55.5', 1.7) +
        sym(P('M25 46C21.5 56 22.5 66 27 73C29 67 29.5 57 32 49Z', hair)) +
        P('M27 48C29 43.5 37 42 50 42C63 42 71 43.5 73 48C70.5 50.5 67.5 50 65.5 47.8C62.5 51.3 57.5 51.3 55.5 48C52.5 51.5 47.5 51.5 45 48C42 51.3 37.5 51.3 34.5 47.8C32.5 50 29.5 50.5 27 48Z', hair) +
        sh('M12 38C12 32.5 29 30 50 30C71 30 88 32.5 88 38C88 43.5 71 46 50 46C29 46 12 43.5 12 38Z', kh,
          S('M12 38C16 42 32 44 50 44C68 44 84 42 88 38C88 43.5 71 46 50 46C29 46 12 43.5 12 38Z', khD)) +
        sh('M26 38.5C26 18 36 7 50 7C64 7 74 18 74 38.5Q50 44 26 38.5Z', kh,
          S('M60 9C68.5 13 74 24 74 38.5Q68 40 62 40.7C63 29 62.5 18 60 9Z', khD) +
          S('M33 27C33 18 38.5 12.5 45 11C40.5 15 37.5 21 37 28Z', khL)) +
        P('M26.2 32.5Q50 38 73.8 32.5L74 38.5Q50 44 26 38.5Z', band) +
        L('M50 8C47.5 15 46.5 23 47 34.5', 1.5) +
        E(50, 7.5, 4.2, 2.3, khD)
    );
  },

  aviator() {
    const skin = '#f3c9a1', cap = '#7a4a2c', capD = '#5f3820', capL = '#9a6441', strap = '#4a2c18';
    const jacket = '#b06d3c', scarf = '#fffaf2', scarfD = '#e7ddcb', brass = '#e3a93c', hair = '#8a5a2b';
    const gog = (x, y) =>
      C(x, y, 9.4, brass) + C(x, y, 6.4, '#80dad1') +
      L(`M${x - 4} ${y + 0.6}Q${x - 3.8} ${y - 3.6} ${x + 0.2} ${y - 4.1}`, 1.9, '#fff') +
      C(x + 2.9, y + 2.7, 1, '#fff', NS);
    return inked(
      torso(jacket) +
        sym(P('M36.5 83L45 104H30.5C28.5 96 30.5 88 36.5 83Z', shade(jacket))) +
        sym(P('M28.5 90.2C26.5 88.8 24.2 88.9 23 89.9C24.6 90.3 25.8 91.2 26.6 92.2C27.4 91.8 28 91.5 28.5 91.4Z', GOLD, ' stroke-width="1.2"'), 28.5) +
        C(28.5, 90.8, 1.3, GOLD_D, ' stroke-width="1.1"') +
        neck(skin) +
        sh('M59 83.5C67 83 73 77.5 79.5 74.5C83.5 72.5 86.5 70.5 90.5 67L88.6 72.6L93 74.6C88 76.6 84 78.4 80 80.6C73 84.6 68 90 61 92.5Z', scarf,
          S('M61 92.5C68 90 73 84.6 80 80.6C84 78.4 88 76.6 93 74.6L91.2 76.4C87 78.4 84 80.4 81 82.6C74 87 69 91.2 62.6 93.4Z', scarfD)) +
        L('M66 86C71 83 75 79.5 80 77', 1.3, scarfD) +
        sh('M36.5 80C42 86 58 86 63.5 80C67 84.5 66 90.5 60 93C54 95.5 46 95.5 40 93C34 90.5 33 84.5 36.5 80Z', scarf,
          S('M34.8 87C40 92 60 92 65.2 87C64.5 90 62.5 91.8 60 93C54 95.5 46 95.5 40 93C37.5 91.8 35.5 90 34.8 87Z', scarfD)) +
        head(skin) +
        cheeks(66.5, 15.5) +
        dotEyes(58.5) +
        L('M35.5 51.4Q40 49 44.5 51', 2.4, hair) + L('M55.5 50.6Q60 47.8 64.5 50', 2.4, hair) +
        nose(skin, 50, 63.6) +
        openSmile(50, 70.4, 5, 5.2) +
        // a dashing pilot's moustache
        P('M50 66.4C47.4 64.8 43 64.9 40.6 66.7C39.2 67.7 37.6 67.3 37.4 65.9C36.8 68.9 39.2 70.9 42.6 70.1C45.6 69.5 48.2 68.6 50 68.6' +
          'C51.8 68.6 54.4 69.5 57.4 70.1C60.8 70.9 63.2 68.9 62.6 65.9C62.4 67.3 60.8 67.7 59.4 66.7C57 64.9 52.6 64.8 50 66.4Z', hair, ' stroke-width="2"') +
        P('M44 43.5C47 42.4 52 42.4 55.5 44C52.8 44.8 50.8 46.3 49.8 48.8C48.6 46.3 46.6 44.6 44 43.5Z', hair) +
        sh('M22.5 53C20 30 32 16 50 16C68 16 80 30 77.5 53C73 47 63 42.5 50 42.5C37 42.5 27 47 22.5 53Z', cap,
          S('M30 34C32 25 39 20 46 19C40 23 35.5 28 34 35Z', capL) + L('M50 16.5V25', 1.4, capD)) +
        sym(P('M20.5 47C17.5 58 18.5 71 22.5 77.5C25.5 81.5 31 80.5 31.5 75.5L29.5 51.5C27 48.5 24 47 20.5 47Z', cap) +
          L('M23.6 53C22.2 61 22.6 69 25.4 74.5', 1.3, capD)) +
        P('M21.5 37Q50 27.5 78.5 37L78.5 43Q50 33.5 21.5 43Z', strap) +
        gog(38.5, 35) + gog(61.5, 35) + P('M47.4 33H52.6V37H47.4Z', brass, ' stroke-width="2"')
    );
  },

  merchant() {
    const skin = '#a86d45', tur = '#fff3d4', turD = '#efd8a4', vest = '#6a45a8', mous = '#2a1a14';
    const fold = (d) => L(d, 4, turD, ' transform="translate(0 2.2)"') + L(d, 1.7);
    return inked(
      torso(WHITE, 50, 84, 44) +
        sym(P('M6 104C6 93 15 86 31 84.5H40.5L45.5 104Z', vest) + L('M38.6 87L42.4 104', 2.4, GOLD)) +
        neck(skin, 50, 8, 72, 87) +
        ears(skin, 61, 50, 26.8) +
        head(skin, 50, 34, 81, 27.5, 0.64) +
        C(22.8, 68.6, 2.4, 'none', ' stroke-width="3.9"') + C(22.8, 68.6, 2.4, 'none', ` stroke="${GOLD}" stroke-width="1.7"`) +
        cheeks(67.5, 17.5, 50, 5.6, 3.4) +
        happyEyes(58.5, 10.5) +
        L('M34 51.5Q39.5 48 45 50.8', 3.2, mous) + L('M55 50.8Q60.5 48 66 51.5', 3.2, mous) +
        nose(skin, 50, 62.8, 3.6, 2.9) +
        openSmile(50, 70.6, 4.6, 4.8) +
        L('M39 67Q44.5 62.8 50 65Q55.5 62.8 61 67', 5.8, mous) +
        sym(L('M39.5 66.8C34 69.4 29.8 66 30.9 62.2C31.8 59.3 35.6 59.4 35.7 62', 3.1, mous)) +
        L('M42 65Q45.5 63.2 48.5 64.3M51.5 64.3Q54.5 63.2 58 65', 1, '#6a4a3a') +
        sh('M18.5 43C10 29 21 6 50 5.5C79 6 90 29 81.5 43C73 50 27 50 18.5 43Z', tur,
          S('M15 36C18 42 30 46 50 46C70 46 82 42 85 36C84.5 39.5 83.5 41.5 81.5 43C73 50 27 50 18.5 43C16.5 41.5 15.5 39.5 15 36Z', turD)) +
        fold('M20 30C31 29.5 43 33.5 50 40') + fold('M80 30C69 29.5 57 33.5 50 40') +
        fold('M27 16C38 14 46.5 18.5 51 27') + fold('M73 16C64 14.5 57 17.5 53 24') +
        P('M50 35C43.5 30.5 40 21 43 9C46.4 10.8 49 14.6 50.4 19.6C51.8 25 51.8 30.6 50 35Z', '#2ec4c6') +
        L('M49.6 33C47.2 28 46.2 24 45.8 19.5M46.4 23.2l2.8-.9M47.8 28l2.6-.5', 1.1, '#15838c') +
        E(46.3, 14.6, 2.6, 3.4, GOLD, ' stroke-width="1.1"') + E(46.4, 15, 1.4, 2, '#1f4f9c', NS) +
        P('M50 32.5L56 39L50 46L44 39Z', GOLD) + E(50, 39.2, 3, 3.6, '#e0344f', ' stroke-width="1.6"') + C(48.9, 37.8, 0.9, '#fff', NS)
    );
  },

  camelmaster() {
    // Karim the professor: mortarboard with a gold tassel, half-moon specs, academic gown and bow tie
    const skin = '#b97a4f', gown = '#34303f', gownD = '#26232f', cap = '#2e2a38', capD = '#1f1c27', capL = '#4a4558';
    const red = '#e0344f', redD = '#b82640', beard = '#aaa49c', beardD = '#7b756e', grey = '#e6e1d9', brow = '#9a948d';
    const lens = (x) => `M${x - 6.2} 60H${x + 6.2}Q${x + 5.8} 66.2 ${x} 66.2Q${x - 5.8} 66.2 ${x - 6.2} 60Z`;
    const wire = (d) => L(d, 3.4) + L(d, 1.6, GOLD);
    return inked(
      torso(gown) +
        sym(P('M30 88C33 93 34 99 34 104H24C24 97 26 92 30 88Z', gownD)) +
        P('M39 83L50 99L61 83Z', WHITE) +
        sym(P('M34.5 84.5L39 83L50 99V104H44.5Z', GOLD)) +
        sym(P('M50 89.6L43.4 86V93.2Z', red, ' stroke-width="2"')) + E(50, 89.6, 2.1, 2.3, redD, ' stroke-width="1.8"') +
        neck(skin) +
        ears(skin, 60) +
        head(skin) +
        cheeks(64.6, 18.8, 50, 3.6, 2.4) +
        happyEyes(56.6) +
        L('M33.2 55.4l-2.6-1.2M33.4 57.6l-2.6.6M66.8 55.4l2.6-1.2M66.6 57.6l2.6.6', 1.3) +
        L('M34.5 49.8Q40 46.8 45 48.8', 3.4, brow) + L('M55 48.8Q60 46.8 65.5 49.8', 3.4, brow) +
        nose(skin, 50, 63.6, 2.6, 1.9) +
        sh('M27.5 60C26.5 75 37 86.5 50 86.5C63 86.5 73.5 75 72.5 60C70 67 64.5 70 58.5 69C55 71.5 45 71.5 41.5 69C35.5 70 30 67 27.5 60Z', beard,
          S('M31 72C35 80 42 84.5 50 84.8C58 84.5 65 80 69 72C66 78.5 58 83 50 83C42 83 34 78.5 31 72Z', beardD, ' opacity=".55"')) +
        sym(L('M31.6 66.5Q32.6 72.5 37 76.5M38.6 72.8Q40.6 77.6 45.6 80.2', 1.3, '#ece8e1')) +
        L('M50 77.2V81.8', 1.3, '#ece8e1') +
        dots([35.2, 71.6, 64.8, 71.6, 42.6, 82, 57.4, 82, 46.4, 76.4, 53.6, 76.4], 0.7, '#6f6962') +
        P('M45.5 70.6Q50 72 54.5 70.6Q53.5 75 50 75Q46.5 75 45.5 70.6Z', MOUTH, ' stroke-width="1.8"') +
        P('M40.5 67.5C43.5 64 47.5 64 50 65.8C52.5 64 56.5 64 59.5 67.5C56.5 70 52.5 69.5 50 68.4C47.5 69.5 43.5 70 40.5 67.5Z', beard, ' stroke-width="1.8"') +
        // fluffy white hair poking out under the cap
        sym(P('M28.5 45.5C24 44.5 20.5 48 21.8 51.8C19.6 54.4 20.8 58.4 24.2 58.6C25 55 27.4 51.6 31.2 49.6Z', grey, ' stroke-width="2"')) +
        // half-moon reading glasses
        S(lens(40), '#fff', ' fill-opacity=".28"') + S(lens(60), '#fff', ' fill-opacity=".28"') +
        wire(lens(40)) + wire(lens(60)) + wire('M46.2 60.6Q50 58.8 53.8 60.6') + wire('M33.8 60.6L26.4 58.6M66.2 60.6L73.6 58.6') +
        // mortarboard
        sh('M24 50C23.5 37 35 30 50 30C65 30 76.5 37 76 50C69 45.5 60 43.5 50 43.5C40 43.5 31 45.5 24 50Z', cap,
          S('M31 37C35 33 41 31.2 46 31C41 33.5 37 36.5 34.5 40.5Z', capL)) +
        P('M11 28L50 38L89 28V31.6L50 41.6L11 31.6Z', capD) +
        sh('M11 28L50 17.5L89 28L50 38Z', cap, S('M11 28L50 17.5L57 19.4L19 30Z', capL, ' opacity=".7"')) +
        tube('M50 27.8Q68 28.4 80.6 30.6C81.8 35 81.8 39.5 81.2 43.4', GOLD, 1.7, 1) +
        C(50, 27.8, 2.4, GOLD, ' stroke-width="1.6"') +
        P('M78.4 43.4H84L85.6 53.4Q81.2 55 76.8 53.4Z', GOLD, ' stroke-width="1.8"') +
        L('M79.8 46.6L79.4 52.8M82.6 46.6L83 52.8', 1, GOLD_D) +
        P('M78.2 42.2H84.2V45.4H78.2Z', GOLD_D, ' stroke-width="1.6"')
    );
  },

  bookie() {
    const skin = '#e8b48a', fez = '#c8283d', fezD = '#9e1b2f', suit = '#2a6b45', suitD = '#1f5535', hair = '#2a1f1a', yel = '#f5cf2f';
    return inked(
      torso(suit) +
        neck(skin) +
        P('M40.5 82L50 98L59.5 82Z', WHITE) +
        sym(P('M36.5 83L46.5 100L41 104H30.5C28.5 95.5 30.5 88 36.5 83Z', suitD)) +
        sym(P('M41.5 80.8L49 86.4L44.6 90.8L39.4 83.6Z', WHITE, ' stroke-width="2"')) +
        sym(P('M50 87.6C46.6 84.2 42.6 83.2 41.2 84.8C40.2 86.8 40.2 88.6 41.2 90.6C42.6 92.2 46.6 91.2 50 87.6Z', yel, ' stroke-width="2"')) +
        P('M47.9 85.4H52.1V89.8H47.9Z', '#d9aa12', ' stroke-width="1.8"') +
        G('rotate(-28 80 50)',
          P('M66 48H86V52H66Z', yel, ' stroke-width="1.8"') +
          P('M86 48H88.6V52H86Z', '#cfc5b3', ' stroke-width="1.6"') +
          P('M88.6 48H90.4Q92 50 90.4 52H88.6Z', TONGUE, ' stroke-width="1.6"')) +
        ears(skin, 60) +
        head(skin) +
        P('M24 58C21.5 41 33 31.5 50 31.5C67 31.5 78.5 41 76 58C74.5 52 71.5 48.5 68 47.5Q50 44.5 32 47.5C28.5 48.5 25.5 52 24 58Z', hair) +
        S('M27.4 51C28.4 45.5 32 41.5 37 39.5C33.5 43 31.2 46.5 30.6 51Z', '#5c4a3e') +
        cheeks(66.5) +
        E(40, 59, 3, 3.8, EYE, NS) + C(41, 57.5, 1.2, '#fff', NS) +
        E(60, 59, 3.5, 4.3, EYE, NS) + C(61.2, 57.2, 1.4, '#fff', NS) +
        L('M35 52Q40 50 45 51.5', 2.2, hair) + L('M55 49.5Q60.5 46 66 49', 2.2, hair) +
        nose(skin, 50, 65) +
        sym(L('M50 66.8C46.5 65.5 42.5 65.7 40 67.7C38.8 68.7 37.2 68.3 37.5 66.8', 2.4, hair)) +
        L('M45.5 71.6Q50.5 74.2 55.5 70.8', 2.1) +
        C(60, 59, 6.8, '#fff', ' fill-opacity=".18" stroke-width="4.4"') +
        C(60, 59, 6.8, 'none', ` stroke="${GOLD}" stroke-width="2.2"`) +
        L('M56 57Q56.3 54.3 59 53.6', 1.3, '#fff') +
        L('M66.6 61C71 67.5 71.5 78 67.5 86.5', 1.2, GOLD_D) +
        G('rotate(7 50 41)',
          sh('M32 40L35.5 11Q50 7.5 64.5 11L68 40Q50 45 32 40Z', fez,
            S('M57.5 10.1Q61.5 10.4 64.5 11L68 40Q64.5 41.6 60.5 42.4Z', fezD)) +
          E(50, 10.6, 14.5, 3.4, '#b3202f') +
          L('M50 10C55.5 9.5 61.5 11 64.8 14.5', 2.2, '#2a1a14') +
          P('M63 14.2L66.6 13.8L70.2 30Q66 31.6 61.8 30Z', '#2a1a14', ' stroke-width="1.8"') +
          L('M64.6 18.5L64.8 28.5M67 18.5L67.8 28.5', 1, '#5a4e4e'))
    );
  },

  mystic() {
    const skin = '#a86d45', sc = '#7b3fa0', scD = '#5f2d80', trim = '#a88ae0', hair = '#2a1a1c', top = '#1a7f86';
    const coin = (x, y) => C(x, y, 2.3, GOLD, ' stroke-width="1.3"') + C(x, y, 0.8, GOLD_D, NS);
    const hoop = (x, y) => C(x, y, 5.6, 'none', ' stroke-width="4.6"') + C(x, y, 5.6, 'none', ` stroke="${GOLD}" stroke-width="2.2"`);
    const lid = (x, s) =>
      E(x, 59.5, 3, 3.8, EYE, NS) + C(r1(x + 1.1), 61, 0.8, '#fff', NS) +
      S(`M${r1(x - 3.8)} 59.2Q${x} 57.2 ${r1(x + 3.8)} 59.2V54.5H${r1(x - 3.8)}Z`, skin) +
      L(`M${r1(x - 3.7)} 59.3Q${x} 57.3 ${r1(x + 3.7)} 59.3`, 2, EYE) +
      L(`M${r1(x + s * 3.5)} 59l${s * 2.1}-1.7M${r1(x + s * 2.2)} 58.2l${s * 1.3}-2.1`, 1.3, EYE);
    return inked(
      P('M76 36C84 44 88 54 90 66L84 64C83 54 80 46 74 40Z', scD) +
        P('M78 35C88 39 94 47 96 55L90 57C88 50 84 44 78 40Z', sc) +
        P('M21 48C13 56 18 64 14 72C10 80 16 86 13 94C12 99 15 104 20 104H80C85 104 88 99 87 94C84 86 90 80 86 72C82 64 87 56 79 48Z', hair) +
        torso(top) +
        neck(skin) +
        P('M37 83Q50 97 63 83Z', skin) +
        L('M39.5 84.2Q50 91 60.5 84.2', 1.2, GOLD_D) + coin(44, 87.6) + coin(50, 88.8) + coin(56, 87.6) +
        head(skin) +
        cheeks(66.8) +
        lid(40, -1) + lid(60, 1) +
        L('M35.5 53.5Q40 51.8 44.5 53', 1.8, hair) + L('M55.5 53Q60 51.8 64.5 53.5', 1.8, hair) +
        nose(skin, 50, 64.8) +
        L('M45 69.8Q50.5 73 55.5 69', 2.2) + C(57.8, 72.6, 0.95, INK, NS) +
        sym(P('M24 56C21 64 25 70 22 78C21 82 23 86 27 86C26 80 30 76 28 70C27 64 30 60 29 56Z', hair)) +
        sh('M21 62C17 38 30 17 50 17C70 17 83 38 79 62C76 54 71 49 64 46.5Q50 42 36 46.5C29 49 24 54 21 62Z', sc,
          S('M60 18.5C72 22 80 34 80.5 50C78 52 76 53 75 53C74 40 69 27 60 18.5Z', scD)) +
        L('M31 26Q40 31 42 41M47 18.5Q53 26 52 35', 1.4, scD) +
        P('M23.5 58.5C26 51.5 30.5 46.5 36 44Q50 39.5 64 44C69.5 46.5 74 51.5 76.5 58.5L79 62C76 54 71 49 64 46.5Q50 42 36 46.5C29 49 24 54 21 62Z', trim) +
        coin(34, 49.4) + coin(39.5, 47.7) + coin(45, 46.8) + coin(50, 46.5) + coin(55, 46.8) + coin(60.5, 47.7) + coin(66, 49.4) +
        E(79.8, 35.6, 5.8, 5, sc) + L('M76.6 33.2Q79.8 35.6 78.4 39', 1.3, scD) + L('M81.6 32.4Q84 34 83.6 37', 1.1, trim) +
        hoop(26, 72) + hoop(74, 72) +
        C(50, 96.5, 15, '#fff', NS + ' opacity=".28"') +
        C(50, 96.5, 9, '#bfdcf7') +
        S('M44 99C44 94 47 91 51 90.5C48 93 47.5 97 49.5 100Z', '#e8f4ff') +
        S('M52 95.5C55 94.5 57 96 56.5 99C55.5 97.5 54 96.5 52 95.5Z', '#c9b3f0') +
        E(46.5, 92.5, 2, 1.3, '#fff', NS) +
        S('M64 86l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z', '#fff') +
        S('M35.5 89l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z', '#fff')
    );
  },

  socialite() {
    const skin = '#7a4a2c', hat = '#1a9aa3', hatD = '#127880', hatL = '#3fc6c8', hair = '#1f1a1a', hairL = '#4a4040', dress = '#2e2828';
    let pearls = '';
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, u = 1 - t;
      pearls += C(r1(u * u * 37.5 + 2 * t * u * 50 + t * t * 62.5), r1(u * u * 80.5 + 2 * t * u * 94 + t * t * 80.5), 1.9, WHITE, ' stroke-width="1.1"');
    }
    for (let i = 0; i <= 12; i++) {
      const t = i / 12, u = 1 - t;
      pearls += C(r1(u * u * 35 + 2 * t * u * 50 + t * t * 65), r1(u * u * 82 + 2 * t * u * 108 + t * t * 82), 1.9, WHITE, ' stroke-width="1.1"');
    }
    let flower = '';
    for (let i = 0; i < 5; i++) {
      const a = ((i * 72 - 90) * Math.PI) / 180;
      flower += C(r1(30 + 3.3 * Math.cos(a)), r1(44 + 3.3 * Math.sin(a)), 2.9, '#f5cf2f', ' stroke-width="1.8"');
    }
    flower += C(30, 44, 2.2, '#e8901e', ' stroke-width="1.6"');
    return inked(
      P('M20 70C15 54 20 36 50 34C80 36 85 54 80 70C78 75 72 76 69 72H31C28 76 22 75 20 70Z', hair) +
        sym(L('M17.6 56.5Q20 54.6 22 56.4M17.2 63.4Q19.6 61.6 21.8 63.2', 1.5, hairL)) +
        torso(dress) +
        dots([22, 95, 28, 90.5, 17, 100.5, 72, 90.5, 78, 95, 83, 100.5, 26, 100, 74, 100], 0.9, GOLD) +
        neck(skin) +
        P('M35.5 83Q50 101 64.5 83Z', skin) +
        pearls +
        head(skin) +
        cheeks(66.8, 16) +
        dotEyes(59, 10, 50, 3.2, 4) +
        L('M36.4 56.6l-2.6-1.8M35.6 58.6l-2.8-.6M63.6 56.6l2.6-1.8M64.4 58.6l2.8-.6', 1.4, EYE) +
        nose(skin, 50, 64.8) +
        P('M45.5 69.6Q47.8 68 50 69.2Q52.2 68 54.5 69.6Q53 73.8 50 73.8Q47 73.8 45.5 69.6Z', '#d0243c', ' stroke-width="1.8"') +
        S('M47.6 71.6Q50 72.6 52.4 71.6Q50 73 47.6 71.6Z', '#f5899a') +
        sym(P('M22 50C19 58 22 66 26 71C28.5 74 32 73.5 33.5 70C31 70.5 29 69 29 66.5C29 63.5 32 62 31.5 58.5C31 55 29 53 30.5 50Z', hair) +
          L('M22.4 57.5Q25 55.6 28.6 57.4M23.4 64.2Q26 62.4 29 64', 1.3, hairL)) +
        sh('M20.5 52C18.5 28 32 12 50 12C68 12 81.5 28 79.5 52C80.5 55 79 57.5 76 56.5C68 51.5 60 49.5 50 49.5C40 49.5 32 51.5 24 56.5C21 57.5 19.5 55 20.5 52Z', hat,
          S('M60 13C71.5 16.5 79.5 28 79.8 42C76 40.5 71 39.5 67 39C67 29 64.5 20 60 13Z', hatD) +
          S('M29 20C33 15.5 39 13.5 44 13.5C39 16 35 19.5 32.5 24Z', hatL)) +
        P('M21.2 43.5C31 38.8 40 37.2 50 37.2C60 37.2 69 38.8 78.8 43.5L79.5 48.5C69.5 44 60 42.4 50 42.4C40 42.4 30.5 44 20.5 48.5Z', hatD) +
        P('M30.5 42C22 37 16.5 28 17.5 17.5C23.5 21.5 29 29.5 32.8 38.8Z', '#fde88f') + L('M31 40C25 34 20.5 27 18.8 20', 1.2, '#c89b0c') +
        flower
    );
  },

  catkeeper() {
    // Charlotte the historian: blonde ponytail tied with a ribbon, high-collared blouse,
    // cameo brooch and a well-loved history book
    const skin = '#f7d6b8', hair = '#f0c454', hairD = '#d6a33a', hairL = '#fbe39a', ribbon = '#e0344f', ribbonD = '#b82640';
    const coat = '#2f6475', coatD = '#244f5d', blouseD = '#eadfca', book = '#c0462f', bookD = '#963322';
    return inked(
      // the ponytail swings out behind her head
      sh('M40 30C28 22 11.5 30 11.5 48C11.5 61 15 71 22 80.5C19.5 70 20.5 58 26 50C29 44.5 34 39 40 36Z', hair,
        S('M40 36C34 39 29 44.5 26 50C20.5 58 19.5 70 22 80.5C19 76 17.6 70.5 17.4 64.5C19 55 24 45.5 33 38.6Z', hairD) +
        S('M30 27.6C22 28.4 16 35 15.4 44C18 37 23.5 31.6 31.4 29.4Z', hairL)) +
        L('M33 31.6C22.5 33 16.6 42 17.2 54M35.4 34.4C26.6 40 23 50 22.6 62', 1.2, hairD) +
        torso(coat) +
        sym(P('M36.5 83L46.5 100L41 104H30.5C28.5 95.5 30.5 88 36.5 83Z', coatD)) +
        P('M38.5 83L50 99L61.5 83Z', WHITE) +
        L('M44.5 90Q50 93 55.5 90M46.5 94.6Q50 96.6 53.5 94.6', 1.2, blouseD) +
        neck(skin) +
        P('M41.5 75V85Q50 89.5 58.5 85V75Q50 79 41.5 75Z', WHITE) +
        L('M42 81.6Q50 85.6 58 81.6', 1.1, blouseD) +
        E(50, 88, 3.4, 4.1, GOLD, ' stroke-width="1.6"') + E(50, 88, 2.1, 2.8, '#e8836f', NS) + E(50, 87.3, 1, 1.3, WHITE, NS) +
        ears(skin, 61) +
        C(24.3, 67.6, 1.9, WHITE, ' stroke-width="1.4"') + C(75.7, 67.6, 1.9, WHITE, ' stroke-width="1.4"') +
        head(skin) +
        cheeks(66.8, 16) +
        dotEyes(59, 10, 50, 3.1, 3.9) +
        L('M36.6 56.8l-2.6-1.8M35.8 58.8l-2.8-.6M63.4 56.8l2.6-1.8M64.2 58.8l2.8-.6', 1.4, EYE) +
        L('M35.5 52.4Q40 50.4 44.5 51.8', 1.9, hairD) + L('M55.5 51.8Q60 50.4 64.5 52.4', 1.9, hairD) +
        nose(skin, 50, 64.8) +
        openSmile(50, 69.4, 4.8, 5.2) +
        // hair pulled back smoothly from a side parting towards the ponytail
        sh('M23.5 58C21 41 32 30 50 30C68 30 79 41 76.5 58C75 51 71 46.5 64 45C57 43.5 49 43.5 43.5 40.5C40 44 34 46.5 30 49C27 51.5 25 54.5 23.5 58Z', hair,
          S('M62 31.6C72 35 78.6 44.5 76.5 58C75.5 53.5 73.6 50 71 47.8C70.6 41 67.4 35.6 62 31.6Z', hairD) +
          S('M28.6 42.6C31.6 36.6 37.6 32.6 44.6 31.6C39.2 34.6 35.2 38.4 32.6 43.2Z', hairL)) +
        L('M59 44.2Q47.5 37.6 40.5 33.4M69 47.4Q57.5 36.4 45.5 32', 1.2, hairD) +
        // ribbon bow where the ponytail is tied
        G('rotate(-24 38.5 31)',
          P('M38.5 31C35.5 25.8 30 25.8 30.4 31C30 36.2 35.5 36.2 38.5 31Z', ribbon, ' stroke-width="1.8"') +
          P('M38.5 31C41.5 25.8 47 25.8 46.6 31C47 36.2 41.5 36.2 38.5 31Z', ribbon, ' stroke-width="1.8"') +
          P('M37.4 32.4L35 38.6L37.4 38L38.5 33ZM39.6 32.4L42 38.6L39.6 38L38.5 33Z', ribbonD, ' stroke-width="1.5"') +
          E(38.5, 31, 2.2, 2.4, ribbonD, ' stroke-width="1.6"')) +
        // her favourite history book, a little pyramid on the cover
        G('rotate(-12 70 93) translate(-3 0)',
          P('M79 81.5H81.8V104H79Z', CREAM, ' stroke-width="2"') +
          sh('M60 80H79V104H60Z', book, S('M60 80H63.6V104H60Z', bookD)) +
          L('M60 85H63.6M60 99H63.6', 1.2, GOLD) +
          P('M71.4 85.4L76 93H66.8Z', GOLD, ' stroke-width="1.5"') + L('M67 96.2H75.8', 1.4, GOLD))
    );
  },
};

/**
 * Head-and-shoulders portrait, viewBox 0 0 100 100.
 * opts.bg (default true): round coloured badge with the character clipped to it.
 */
export function portraitSVG(id, opts = {}) {
  const { bg = true } = opts;
  const ch = CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
  return framed(ch.color, ART[ch.id](), bg);
}

// --------------------------------------------------------- pharaoh mask --
/** The starting-player marker: a cute golden Tutankhamun-style mask. */
export function pharaohMaskSVG() {
  const g = uid('pg'), c = uid('pk');
  const lap = '#1f4f9c', tq = '#2ec4c6', liner = '#1b2440';
  const nemes = 'M50 7C69 7 79 18 81 33L91 61C92 65.5 89 67.5 85 67.5H15C11 67.5 8 65.5 9 61L19 33C21 18 31 7 50 7Z';
  const lappets = 'M17 58H33L32.5 93C28.5 96.5 21.5 96.5 17.5 93ZM83 58H67L67.5 93C71.5 96.5 78.5 96.5 82.5 93Z';
  let stripes = '';
  for (let y = 11; y < 100; y += 9) stripes += `M0 ${y}h100v4.5H0z`;
  const eye = (x, s) =>
    P(`M${x - 6.2} 51Q${x} 44 ${x + 6.2} 51Q${x} 57.4 ${x - 6.2} 51Z`, '#fff8ec', ' stroke-width="2"') +
    C(x, 51.4, 3.4, EYE, NS) + C(x + 1.2, 50.1, 1.2, '#fff', NS) + C(x - 1.2, 53, 0.6, '#fff', NS) +
    L(`M${x - s * 6.5} 50.8Q${x} 43.6 ${x + s * 6.5} 50.8L${x + s * 10.8} 52.4`, 2.5, liner) +
    L(`M${x - s * 5} 42.4Q${x} 38.6 ${x + s * 8.5} 42.8`, 2.8, lap);
  return svg(
    '0 0 100 100',
    `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${GOLD_L}"/>` +
      `<stop offset=".55" stop-color="${GOLD}"/><stop offset="1" stop-color="${GOLD_D}"/></linearGradient>` +
      `<clipPath id="${c}"><path d="${nemes}${lappets}"/></clipPath></defs>` +
      inked(
        P('M12 92C18 81 33 76.5 50 76.5C67 76.5 82 81 88 92L91 104H9Z', GOLD) +
          L('M16.5 90C23 83 35 80 50 80C65 80 77 83 83.5 90', 3.4, lap) +
          L('M14 97C21 88.5 34 85 50 85C66 85 79 88.5 86 97', 3.4, tq) +
          S(nemes + lappets, `url(#${g})`) +
          `<path d="${stripes}" fill="${lap}" clip-path="url(#${c})"${NS}/>` +
          P(nemes, 'none') + P(lappets, 'none') +
          P(headPath(50, 24, 77.5, 22.5, 0.6), `url(#${g})`) +
          P('M27.8 38C29.5 29 38.5 24 50 24C61.5 24 70.5 29 72.2 38C66.5 33.5 58.5 31.5 50 31.5C41.5 31.5 33.5 33.5 27.8 38Z', GOLD) +
          L('M30.2 33.8C35 29.5 42 27.6 50 27.6C58 27.6 65 29.5 69.8 33.8', 1.8, lap) +
          eye(39.5, -1) + eye(60.5, 1) +
          cheeks(61, 14.5, 50, 4.2, 2.5) +
          E(50, 59.5, 2.4, 1.7, GOLD_D, NS) +
          L('M45.5 66Q50 69.4 54.5 66', 2.1) +
          P('M50 13C54 13 55.5 16.5 55 20.5C54.6 24 52.6 27 50 28.5C47.4 27 45.4 24 45 20.5C44.5 16.5 46 13 50 13Z', GOLD) +
          P('M50 16C51.6 16 52.2 18.2 51.8 20.5C51.5 22.5 50.8 24 50 25C49.2 24 48.5 22.5 48.2 20.5C47.8 18.2 48.4 16 50 16Z', lap, ' stroke-width="1.2"') +
          C(50, 19.5, 1.1, '#d0243c', NS) +
          E(50, 12.2, 2.9, 2.4, GOLD, ' stroke-width="1.8"') + dots([48.9, 12, 51.1, 12], 0.55, INK) +
          P('M44.5 75.5H55.5L56.5 92.5C56.5 97.5 43.5 97.5 43.5 92.5Z', lap) +
          L('M44.6 81L50 84L55.4 81M44.4 86.4L50 89.4L55.6 86.4M44.2 91.8L50 94.8L55.8 91.8', 1.6, GOLD) +
          P('M43 75H57V78.5H43Z', GOLD, ' stroke-width="2"')
      )
  );
}

// ---------------------------------------------------------------- crowd --
// Back row first. cheer/boo: [pose, arg1, arg2]
const FANS = [
  { x: 45, y: 28, skin: '#7a4a2c', cloth: '#2a9a45', hat: 'turban', cheer: ['both', '#e0344f'], boo: ['crossed'] },
  { x: 104, y: 28, skin: '#cf9366', cloth: '#e0344f', hat: 'boater', cheer: ['flag', '#2a9a45', 1, -1], boo: ['thumb', -1] },
  { x: 17, y: 33, skin: '#e8b48a', cloth: '#1a9fd6', hat: 'fez', cheer: ['flag', '#f5cf2f', -1, 1], boo: ['fist', 1] },
  { x: 75, y: 33, skin: '#f6d3b0', cloth: '#6a45a8', hat: 'parasol', cheer: ['flag', '#1a9fd6', 1, 1], boo: ['thumb', 1] },
];

function fanHat(kind, x, y) {
  if (kind === 'fez') {
    return (
      P(`M${x - 6.5} ${y - 6}L${x - 5} ${y - 17.5}Q${x} ${y - 19} ${x + 5} ${y - 17.5}L${x + 6.5} ${y - 6}Q${x} ${y - 3.8} ${x - 6.5} ${y - 6}Z`, '#c8283d') +
      L(`M${x} ${y - 18}Q${x + 5} ${y - 18.5} ${x + 6} ${y - 13}`, 1.5, '#2a1a14') +
      P(`M${x + 5} ${y - 13.5}h2l1 5.5h-4z`, '#2a1a14', ' stroke-width="1.2"')
    );
  }
  if (kind === 'turban') {
    return (
      P(`M${x - 11.5} ${y - 5}C${x - 14} ${y - 13.5} ${x - 7} ${y - 19.5} ${x} ${y - 19.5}C${x + 7} ${y - 19.5} ${x + 14} ${y - 13.5} ${x + 11.5} ${y - 5}Q${x} ${y - 1.5} ${x - 11.5} ${y - 5}Z`, CREAM) +
      L(`M${x - 10.5} ${y - 10}Q${x - 1} ${y - 14} ${x + 9} ${y - 7}`, 1.3) +
      C(x, y - 5.5, 1.9, '#e0344f', ' stroke-width="1.2"')
    );
  }
  if (kind === 'boater') {
    return (
      P(`M${x - 8} ${y - 6.5}V${y - 14}Q${x} ${y - 16} ${x + 8} ${y - 14}V${y - 6.5}Z`, '#f5d98a') +
      P(`M${x - 8} ${y - 10.5}Q${x} ${y - 12.5} ${x + 8} ${y - 10.5}V${y - 7.5}Q${x} ${y - 5.5} ${x - 8} ${y - 7.5}Z`, '#1a9fd6') +
      E(x, y - 6.5, 14, 3, '#f5d98a')
    );
  }
  // parasol lady: hair with a bun (the parasol is drawn separately)
  return (
    C(x, y - 11, 4.6, '#7a4a2c') +
    P(`M${x - 10.5} ${y + 1}C${x - 11} ${y - 7} ${x - 6} ${y - 10} ${x} ${y - 10}C${x + 6} ${y - 10} ${x + 11} ${y - 7} ${x + 10.5} ${y + 1}C${x + 7} ${y - 4} ${x + 3} ${y - 5} ${x} ${y - 5}C${x - 3} ${y - 5} ${x - 7} ${y - 4} ${x - 10.5} ${y + 1}Z`, '#7a4a2c') +
    C(x + 5, y - 10, 2, '#f5899a', ' stroke-width="1.2"')
  );
}

/** Collar detail so each body reads as an outfit. */
function fanNeck(kind, x, y) {
  const t = y + 10.4;
  if (kind === 'fez') return P(`M${x - 4} ${t}L${x} ${t + 5.5}L${x + 4} ${t}Z`, WHITE, ' stroke-width="1.5"');
  if (kind === 'turban') return L(`M${x - 5.5} ${t + 0.8}Q${x} ${t + 4.8} ${x + 5.5} ${t + 0.8}`, 1.8, GOLD);
  if (kind === 'parasol') {
    return sym(P(`M${x} ${t + 0.4}C${x - 3} ${t} ${x - 6.5} ${t + 0.6} ${x - 7} ${t + 1.8}C${x - 6} ${t + 4.8} ${x - 2} ${t + 4.8} ${x} ${t + 2.8}Z`, WHITE, ' stroke-width="1.4"'), x);
  }
  return P(`M${x} ${t + 1.8}L${x - 3.8} ${t}V${t + 3.6}ZM${x} ${t + 1.8}L${x + 3.8} ${t}V${t + 3.6}Z`, '#2e2828', ' stroke-width="1.2"');
}

/** Body, head, face and hat of one spectator. */
function fanBase(f, boo) {
  const { x, y, skin, cloth, hat } = f;
  let s = P(`M${x - 14} 62C${x - 14} ${y + 16} ${x - 9} ${y + 10.5} ${x} ${y + 10.5}C${x + 9} ${y + 10.5} ${x + 14} ${y + 16} ${x + 14} 62Z`, cloth) +
    fanNeck(hat, x, y);
  if (hat === 'parasol') s += L(`M${x - 5} ${y + 19.5}L${x - 1} ${y - 30}`, 1.6);
  s += P(headPath(x, y - 9.5, y + 9.5, 10.2), skin);
  if (boo) {
    s += dotEyes(y + 1.2, 4, x, 1.4, 1.8) +
      L(`M${x - 6.4} ${y - 3}L${x - 2.2} ${y - 1.2}M${x + 6.4} ${y - 3}L${x + 2.2} ${y - 1.2}`, 1.6) +
      (f.boo[0] === 'fist'
        ? E(x, y + 5.6, 2.3, 2, MOUTH, ' stroke-width="1.5"')
        : L(`M${x - 2.8} ${y + 6.4}Q${x} ${y + 4.2} ${x + 2.8} ${y + 6.4}`, 1.7)) +
      cheeks(y + 4, 6.5, x, 2.2, 1.3);
  } else {
    s += happyEyes(y + 0.6, 4, x, 2.1, 1.7) + openSmile(x, y + 3.8, 3.2, 3.8, 1.5) + cheeks(y + 3.4, 6.6, x, 2.2, 1.4);
  }
  return s + fanHat(hat, x, y);
}

function parasolTop(x, y) {
  return (
    P(`M${x - 19} ${y - 16}C${x - 17} ${y - 26} ${x - 9} ${y - 30.5} ${x - 1} ${y - 30.5}C${x + 7} ${y - 30.5} ${x + 15} ${y - 26} ${x + 17} ${y - 16}` +
      `Q${x + 13.4} ${y - 18.6} ${x + 11} ${y - 16}Q${x + 7.4} ${y - 18.6} ${x + 5} ${y - 16}Q${x + 1.4} ${y - 18.6} ${x - 1} ${y - 16}` +
      `Q${x - 4.6} ${y - 18.6} ${x - 7} ${y - 16}Q${x - 10.6} ${y - 18.6} ${x - 13} ${y - 16}Q${x - 16.6} ${y - 18.6} ${x - 19} ${y - 16}Z`, '#f5899a') +
    S(`M${x - 7} ${y - 16.6}Q${x - 6} ${y - 26} ${x - 1} ${y - 30}Q${x - 3} ${y - 24} ${x - 1} ${y - 16.6}Q${x - 4} ${y - 18.4} ${x - 7} ${y - 16.6}Z`, WHITE) +
    S(`M${x + 5} ${y - 16.6}Q${x + 5} ${y - 25} ${x - 0.6} ${y - 30}Q${x + 9} ${y - 25} ${x + 11} ${y - 16.6}Q${x + 8} ${y - 18.4} ${x + 5} ${y - 16.6}Z`, WHITE) +
    C(x - 1, y - 31.5, 1.3, GOLD, ' stroke-width="1.2"')
  );
}

/** Arms, hands and flags (drawn over everyone so nothing gets hidden). */
function fanArms(f, boo) {
  const { x, y, skin, cloth, hat } = f;
  const hand = (hx, hy, r = 2.7) => C(r1(hx), r1(hy), r, skin, ' stroke-width="1.8"');
  const sx = (s) => x + s * 10.5, sy = y + 15.5;
  const arm = (d, col = cloth) => tube(d, col, 4.4, 1.8);
  const flagArm = (side, color, dir) => {
    const hx = x + side * 15, hy = y - 3, top = y - 25;
    return (
      arm(`M${sx(side)} ${sy}Q${x + side * 17} ${y + 8} ${hx} ${hy}`) +
      L(`M${hx} ${hy}V${top}`, 1.5) +
      P(`M${hx} ${top}Q${hx + dir * 5} ${top + 1} ${hx + dir * 10.5} ${top + 3.8}Q${hx + dir * 5} ${top + 5.4} ${hx} ${top + 7.5}Z`, color, ' stroke-width="1.6"') +
      hand(hx, hy)
    );
  };
  let s = '';
  if (hat === 'parasol') s += arm(`M${sx(-1)} ${sy}Q${x - 12} ${y + 21} ${x - 5} ${y + 19.5}`) + hand(x - 5, y + 19.5);
  const [pose, a, b, c] = boo ? f.boo : f.cheer;
  if (pose === 'flag') s += flagArm(b, a, c);
  if (pose === 'both') {
    s += flagArm(-1, a, -1) + arm(`M${sx(1)} ${sy}Q${x + 17} ${y + 8} ${x + 15} ${y - 3}`) + hand(x + 15, y - 3);
  }
  if (pose === 'fist') {
    const hx = x + a * 11.8, hy = y - 16;
    s += arm(`M${sx(a)} ${sy}Q${x + a * 15.5} ${y + 2} ${hx} ${hy}`) + hand(hx, hy, 3.7) +
      L(`M${hx - 1.9} ${hy - 1.2}h3.8M${hx - 1.9} ${hy + 1}h3.8`, 1.1) +
      L(`M${hx + 5.4} ${hy - 3.6}q1.8 2.6 0 5.2M${hx - 5.4} ${hy - 3.6}q-1.8 2.6 0 5.2M${hx - 2} ${hy - 6.4}q2-1.4 4 0`, 1.2);
  }
  if (pose === 'crossed') {
    s += arm(`M${sx(-1)} ${sy}Q${x - 6} ${y + 21} ${x + 7} ${y + 19}`, shade(cloth)) + hand(x + 8, y + 18.6, 2.3) +
      arm(`M${sx(1)} ${sy}Q${x + 6} ${y + 23} ${x - 7} ${y + 21}`) + hand(x - 8, y + 20.6, 2.3);
  }
  if (pose === 'thumb') {
    const hx = x + a * 5, hy = y + 19.5;
    s += arm(`M${sx(a)} ${sy}Q${x + a * 14} ${y + 23} ${hx + a * 1.5} ${hy}`) +
      P(`M${hx - 1.4} ${hy + 1}V${hy + 6}Q${hx} ${hy + 7.6} ${hx + 1.4} ${hy + 6}V${hy + 1}Z`, skin, ' stroke-width="1.6"') +
      hand(hx, hy, 3);
  }
  return s;
}

/** A cosy row of spectators; mood 'cheer' (flags up) or 'boo' (grumpy). */
export function crowdSVG(mood = 'cheer') {
  const boo = mood === 'boo';
  const lady = FANS.find((f) => f.hat === 'parasol');
  return svg(
    '0 0 120 60',
    inked(FANS.map((f) => fanBase(f, boo)).join('') + parasolTop(lady.x, lady.y) + FANS.map((f) => fanArms(f, boo)).join(''), 2)
  );
}
