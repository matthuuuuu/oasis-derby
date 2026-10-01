// Cute camel sprites. All camels are drawn facing RIGHT; the board flips them
// with CSS so racing camels face clockwise and crazy camels face the other way.
//
// Two poses share one 120×100 box (same ground line):
//   'stand' — a camel on its own
//   'sit'   — legs folded, used when camels pile up in a stack
//
// Every camel is drawn as ONE connected silhouette: all body parts are first
// painted with a thick outline, then painted again without it on top. That
// hides every inner seam, so the head, neck, legs and tail always look joined
// (even on dark backgrounds, where the outline itself disappears).

export const CAMEL_COLORS = {
  blue: { base: '#1a9fd6', light: '#7fd0f0', dark: '#0b6e9c' },
  yellow: { base: '#f5cf2f', light: '#fde88f', dark: '#c89b0c' },
  green: { base: '#2a9a45', light: '#74cf82', dark: '#17672c' },
  red: { base: '#e0344f', light: '#f5899a', dark: '#a31a34' },
  purple: { base: '#6a45a8', light: '#a88ae0', dark: '#43287a' },
  white: { base: '#f6f1e7', light: '#ffffff', dark: '#cfc5b3' },
  black: { base: '#463d3d', light: '#6d6262', dark: '#272121' },
};

/** A shape per racing camel so colours can also be told apart without colour vision. */
export const CAMEL_SYMBOLS = {
  blue: 'diamond',
  yellow: 'circle',
  green: 'triangle',
  red: 'square',
  purple: 'star',
};

const INK = '#3b2412';
const OUTLINE = 2.5; // visible outline width
let uid = 0;

/** A small symbol centred on (x, y) with radius r. */
export function symbolPath(kind, x, y, r) {
  const f = (n) => Math.round(n * 10) / 10;
  switch (kind) {
    case 'diamond':
      return `M${f(x)},${f(y - r)} L${f(x + r * 0.8)},${f(y)} L${f(x)},${f(y + r)} L${f(x - r * 0.8)},${f(y)} Z`;
    case 'circle':
      return `M${f(x - r * 0.85)},${f(y)} a${f(r * 0.85)},${f(r * 0.85)} 0 1,0 ${f(r * 1.7)},0 a${f(r * 0.85)},${f(r * 0.85)} 0 1,0 ${f(-r * 1.7)},0 Z`;
    case 'triangle':
      return `M${f(x)},${f(y - r)} L${f(x + r * 0.95)},${f(y + r * 0.72)} L${f(x - r * 0.95)},${f(y + r * 0.72)} Z`;
    case 'square':
      return `M${f(x - r * 0.72)},${f(y - r * 0.72)} h${f(r * 1.44)} v${f(r * 1.44)} h${f(-r * 1.44)} Z`;
    case 'star': {
      let d = '';
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 ? r * 0.45 : r;
        d += `${i ? 'L' : 'M'}${f(x + Math.cos(a) * rr)},${f(y + Math.sin(a) * rr)} `;
      }
      return d + 'Z';
    }
    default:
      return '';
  }
}

// ─── Shapes ──────────────────────────────────────────────────────────────────

// head (shared by both poses; the sitting pose moves it down with a transform)
const HEAD =
  'M87,21 C86,11 95,5 104,7 C111,8 116,14 117.5,21 C119,28 115,34 107.5,34 C100,34 93.5,31.5 89.5,28 C87.5,26 87,23.5 87,21 Z';
const MUZZLE =
  'M103.5,18.5 C110,16 117.8,19 117.8,24.5 C117.8,30.5 113,34 106.5,34 C102.5,34 100.2,30 100.8,26 C101.2,22 101.8,19.8 103.5,18.5 Z';
const EAR = 'M89.8,13.5 C87.4,7 91,2.6 94.8,5.8 C96.4,7.3 96.6,10.2 95.6,13 Z';
const BLANKET =
  'M35.5,37 C38,25 45.5,17 54,17 C62.5,17 68,25 70.2,33.5 C71.5,39 71.6,44.5 70.6,49.2 C60.5,51.6 49.5,52.4 40,52 C36.8,47 35,42 35.5,37 Z';
const BLANKET_TRIM = 'M40,52 C50,52.5 61,51.6 70.6,49.2';

const STAND = {
  body: 'M25,56 C22,46 26,40 33,38 C37,26 44,15.5 53,15 C62,14.5 67,24 70,32 C72,36.5 76,39 80,40 C89,43 91,58 85,65 C78,72 47,74 32,70 C25,68 23,62 25,56 Z',
  neck: 'M77,43 C83,38 86,30 88,22 L101,25 C99,36 95,48 87,58 Z',
  tail: 'M27,49 C19,50 15.5,56 16.6,63.5',
  tuft: 'M16.8,61.5 C13,63.8 13.2,69.6 16.9,70.8 C20.4,70 21.2,65.2 18.8,62 Z',
  head: 'translate(0 0)',
  blanket: 'translate(0 0)',
  shadow: { cx: 57, cy: 94.5, rx: 36 },
  belly:
    'M24,60 C30,68.5 45,71 60,70.5 C72,70 81,67 86.5,61 L92,62 L92,76 L20,76 Z',
  highlight: 'M42,26 C45,20 50,17.8 55,18.2',
};

const SIT = {
  body: 'M17,79 C15,68 20,60 29,57 C33,46 41,36.5 51,36 C61,35.5 67,44 70.5,51 C73,55.5 78,57.5 83,58.5 C92,60.5 96,71 94,80 C92.5,87 88,91.5 80,91.5 L28,91.5 C21,91.5 17.5,86 17,79 Z',
  neck: 'M78,63 C84,56 87,47 88,38 L101,41 C99,51 96,60 89,71 Z',
  tail: 'M20,66 C13.5,67 10.8,72.5 12.2,79',
  tuft: 'M12.4,77 C8.6,79.3 8.8,85.1 12.5,86.3 C16,85.5 16.8,80.7 14.4,77.5 Z',
  hind: 'M14.5,86 C13.5,80.5 18.5,77 25,78 C31,79 34,83.5 33.5,88 C33.2,91 31,92.3 28,92.3 L18,92.3 C15.5,92.3 14.5,89.5 14.5,86 Z',
  fore: 'M77,87 C77,81.5 83.5,78.8 91,79.8 C97.5,80.8 101.2,84.8 100.5,88.8 C100.2,91.3 98.2,92.3 95.5,92.3 L80.5,92.3 C78.3,92 77,89.8 77,87 Z',
  head: 'translate(0 16)',
  blanket: 'translate(-2 21)',
  shadow: { cx: 56, cy: 93.2, rx: 42 },
  belly: 'M16,80 C22,88 40,89.5 56,89.5 C72,89.5 86,88 94,80 L98,95 L12,95 Z',
  highlight: 'M40,47 C43,41 48,38.8 53,39.2',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Paint `parts` as one connected silhouette with a single outer outline.
 * part: { d, fill, t? (transform), line? (stroke width for line-shaped parts) }
 */
function silhouette(parts, ink) {
  const tr = (p) => (p.t ? ` transform="${p.t}"` : '');
  const behind = parts
    .map((p) =>
      p.line
        ? `<path d="${p.d}" fill="none" stroke="${ink}" stroke-width="${p.line + OUTLINE * 2}" stroke-linecap="round"${tr(p)}/>`
        : `<path d="${p.d}" fill="${ink}" stroke="${ink}" stroke-width="${OUTLINE * 2}" stroke-linejoin="round"${tr(p)}/>`
    )
    .join('');
  const front = parts
    .map((p) =>
      p.line
        ? `<path d="${p.d}" fill="none" stroke="${p.fill}" stroke-width="${p.line}" stroke-linecap="round"${tr(p)}/>`
        : `<path d="${p.d}" fill="${p.fill}"${tr(p)}/>`
    )
    .join('');
  return behind + front;
}

function leg(x) {
  return `M${x},60 L${x + 9},60 C${x + 9.8},69 ${x + 10},75 ${x + 8.8},79.5 L${x + 8.2},88 C${x + 9.2},90.5 ${x + 8.8},93 ${x + 6},93 L${x + 3},93 C${x + 0.2},93 ${x - 0.2},90.5 ${x + 0.8},88 L${x + 0.2},79.5 C${x - 1},75 ${x - 0.8},69 ${x},60 Z`;
}

function normalFace(ink) {
  return (
    `<ellipse cx="101.4" cy="18.4" rx="3.4" ry="4.2" fill="#2a1a10"/>` +
    `<circle cx="102.7" cy="16.8" r="1.3" fill="#fff"/>` +
    `<path d="M98.2,14.4 l-2.4,-2.1 M100.2,13.3 l-1.1,-2.8 M102.5,13.4 l0.4,-2.8" stroke="${ink}" stroke-width="1.3" stroke-linecap="round"/>` +
    `<ellipse cx="106.5" cy="26.8" rx="3.7" ry="2.2" fill="#f28b82" opacity=".65"/>` +
    `<path d="M113.6,20.6 q1.6,0.2 2,1.8" stroke="${ink}" stroke-width="1.3" fill="none" stroke-linecap="round"/>` +
    `<path d="M108.6,29 q3.4,2.3 7.2,-0.4" stroke="${ink}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
  );
}

function crazyFace(c, ink, isBlack) {
  const tongue = isBlack ? '#f07c8e' : '#ee6f84';
  return (
    // googly eyes, looking in different directions
    `<circle cx="99" cy="17.5" r="4.6" fill="#fff" stroke="${ink}" stroke-width="1.4"/>` +
    `<circle cx="100.8" cy="19.2" r="2.1" fill="#1a100a"/>` +
    `<circle cx="107.6" cy="16.2" r="3.4" fill="#fff" stroke="${ink}" stroke-width="1.4"/>` +
    `<circle cx="106.4" cy="14.9" r="1.5" fill="#1a100a"/>` +
    `<path d="M113.6,20.6 q1.6,0.2 2,1.8" stroke="${ink}" stroke-width="1.3" fill="none" stroke-linecap="round"/>` +
    // goofy grin with tongue out
    `<path d="M106.5,28.2 q4.8,3.6 10,0.2" stroke="${ink}" stroke-width="1.5" fill="none" stroke-linecap="round"/>` +
    `<path d="M109.8,30 q0.4,4.6 2.9,4.4 q2.4,-0.3 1.8,-4.9" fill="${tongue}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>`
  );
}

/** Everything drawn on the head: muzzle, face, and a headband or wild hair. */
function headDetails(c, ink, crazy, isBlack, muzzle) {
  const hair = crazy
    ? // wild tuft of hair, rooted in the head so it never floats
      `<path d="M91.5,10.5 l-3.2,-6.4 l4.8,2.8 l0.8,-5.6 l3,5.4 l3.6,-4.2 l-0.2,6.8 Z" fill="${c.dark}" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>`
    : // little tasselled headband
      `<path d="M89.2,15.8 C93,12.4 98,10.4 103.6,10.2" stroke="#f2b84b" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
      `<path d="M93.6,13.2 l-1.2,4.6" stroke="${c.dark}" stroke-width="1.8" stroke-linecap="round"/>` +
      `<circle cx="92.2" cy="18.6" r="1.7" fill="${c.light}" stroke="${ink}" stroke-width=".9"/>`;
  return (
    `<path d="${MUZZLE}" fill="${muzzle}" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>` +
    (crazy ? crazyFace(c, ink, isBlack) : normalFace(ink)) +
    hair
  );
}

function blanketArt(camel, c, ink) {
  const tassels = [42, 48, 54, 60, 66, 71]
    .map((x, i) => {
      const y = 52.3 - i * 0.55 - (x > 68 ? 1.8 : 0);
      return (
        `<path d="M${x},${y} l0,4.2" stroke="#d99a1e" stroke-width="1.6" stroke-linecap="round"/>` +
        `<circle cx="${x}" cy="${y + 4.8}" r="1.5" fill="#f2b84b" stroke="${ink}" stroke-width=".9"/>`
      );
    })
    .join('');
  return (
    tassels +
    `<path d="${BLANKET}" fill="${c.light}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<path d="M38.5,33.5 C44,25 57,22.5 64.5,29.5" stroke="#f2b84b" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
    `<path d="${BLANKET_TRIM}" stroke="#f2b84b" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
    `<path d="${symbolPath(CAMEL_SYMBOLS[camel], 53.5, 39.5, 6.2)}" fill="${c.dark}" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>`
  );
}

// ─── Public ──────────────────────────────────────────────────────────────────

/**
 * camelSVG('blue', { pose: 'stand' | 'sit' }) → SVG string (viewBox 0 0 120 100, facing right).
 * Racing camels wear a saddle blanket with their colour symbol; the two crazy
 * camels (white, black) have googly eyes, wild hair and a tongue.
 */
export function camelSVG(camel, { title = '', pose = 'stand', shadow = true } = {}) {
  const c = CAMEL_COLORS[camel];
  const crazy = camel === 'white' || camel === 'black';
  const isBlack = camel === 'black';
  const ink = isBlack ? '#140f0f' : INK;
  const muzzle = isBlack ? '#6d6060' : camel === 'white' ? '#fffaf0' : '#fff3d4';
  const P = pose === 'sit' ? SIT : STAND;
  const id = `cam${++uid}`;

  const parts =
    pose === 'sit'
      ? [
          { d: P.tail, fill: c.base, line: 4.6 },
          { d: P.tuft, fill: c.dark },
          { d: P.hind, fill: c.base },
          { d: P.body, fill: c.base },
          { d: P.fore, fill: c.base },
          { d: P.neck, fill: c.base },
          { d: EAR, fill: c.dark, t: P.head },
          { d: HEAD, fill: c.base, t: P.head },
        ]
      : [
          { d: P.tail, fill: c.base, line: 4.6 },
          { d: P.tuft, fill: c.dark },
          { d: leg(37), fill: c.dark },
          { d: leg(80.5), fill: c.dark },
          { d: P.body, fill: c.base },
          { d: leg(26.5), fill: c.base },
          { d: leg(70), fill: c.base },
          { d: P.neck, fill: c.base },
          { d: EAR, fill: c.dark, t: P.head },
          { d: HEAD, fill: c.base, t: P.head },
        ];

  // soft shading, kept inside the body
  const shading =
    `<defs><clipPath id="${id}"><path d="${P.body}"/></clipPath></defs>` +
    `<path d="${P.belly}" fill="${c.dark}" opacity=".4" clip-path="url(#${id})"/>` +
    `<path d="${P.highlight}" stroke="${c.light}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".9"/>`;

  const extras =
    pose === 'sit'
      ? // folded-leg creases and a peeking hoof
        `<path d="M22.5,80 C27.5,81 31,84.5 31.5,89.5" stroke="${ink}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>` +
        `<path d="M81,82.5 C86,80.5 92,81 95.5,83.5" stroke="${ink}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>` +
        `<path d="M95.2,85.6 C98.4,85.4 100.6,87.6 100.4,90 C100.3,91.6 99,92.3 97,92.3 L94,92.3 C93.8,89.8 93.9,86.6 95.2,85.6 Z" fill="${c.dark}"/>`
      : // hoof bands
        [26.5, 70].map((x) => `<path d="M${x + 1},87.6 L${x + 8},87.6" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" opacity=".5"/>`).join('');

  const blanket = crazy
    ? `<path d="M60,24 C66,28 70,34 71,43" stroke="${c.dark}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8" transform="${P.blanket}"/>`
    : `<g transform="${P.blanket}">${blanketArt(camel, c, ink)}</g>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" role="img"${title ? ` aria-label="${title}"` : ''}>` +
    (shadow ? `<ellipse cx="${P.shadow.cx}" cy="${P.shadow.cy}" rx="${P.shadow.rx}" ry="4" fill="#3b2412" opacity=".18"/>` : '') +
    silhouette(parts, ink) +
    shading +
    extras +
    blanket +
    `<g transform="${P.head}">${headDetails(c, ink, crazy, isBlack, muzzle)}</g>` +
    `</svg>`
  );
}

/** Round badge with a camel head, for chips, tickets and cards. viewBox 0 0 40 40. */
export function camelBadgeSVG(camel) {
  const c = CAMEL_COLORS[camel];
  const crazy = camel === 'white' || camel === 'black';
  const isBlack = camel === 'black';
  const ink = isBlack ? '#140f0f' : INK;
  const clip = `cb${++uid}`;
  const muzzle = isBlack ? '#6d6060' : '#fff3d4';
  const neck = 'M77,43 C83,38 86,30 88,22 L101,25 C99,36 96,48 94,60 L78,60 Z';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">` +
    `<defs><clipPath id="${clip}"><circle cx="20" cy="20" r="18"/></clipPath></defs>` +
    `<circle cx="20" cy="20" r="18.5" fill="${c.light}"/>` +
    `<g clip-path="url(#${clip})"><g transform="translate(-65.5 5.5) scale(0.86)">` +
    silhouette(
      [
        { d: neck, fill: c.base },
        { d: EAR, fill: c.dark },
        { d: HEAD, fill: c.base },
      ],
      ink
    ) +
    headDetails(c, ink, crazy, isBlack, muzzle) +
    `</g></g>` +
    `<circle cx="20" cy="20" r="18.5" fill="none" stroke="${ink}" stroke-width="2"/>` +
    (crazy ? '' : `<path d="${symbolPath(CAMEL_SYMBOLS[camel], 9.8, 29.5, 4.4)}" fill="${c.dark}" stroke="${ink}" stroke-width="1.1" stroke-linejoin="round"/>`) +
    `</svg>`
  );
}
