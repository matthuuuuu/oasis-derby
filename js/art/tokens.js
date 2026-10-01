// Game tokens and icons as inline SVG strings.
const INK = '#3b2412';
let uid = 0;
const nextId = (p) => `${p}${++uid}`;

/** Pyramid colours: the golden dice pyramid, and Crazier Camels' little black-and-white one. */
const PYRAMID_LOOKS = {
  gold: { lit: '#f4c96b', shade: '#d9993f', capLit: '#fff0a8', capShade: '#f2b84b', door: '#6b3a1c', doorIn: '#3a1d0c', shadeLine: INK, shadeLineOp: '.35' },
  crazy: { lit: '#fbf8f1', shade: '#3a3436', capLit: '#ffffff', capShade: '#9a9ea6', door: '#6e6a70', doorIn: '#1f1b1d', shadeLine: '#ffffff', shadeLineOp: '.22' },
};

/**
 * The dice pyramid in the middle of the board. viewBox 0 0 120 100.
 * look 'crazy': Crazier Camels' small pyramid (white lit face, black shaded face, grey capstone
 * like the grey die it rolls).
 */
export function pyramidSVG(look = 'gold') {
  const c = PYRAMID_LOOKS[look] || PYRAMID_LOOKS.gold;
  const lines = [];
  // brick courses on the lit (left) face and the shaded (right) face
  for (let i = 1; i <= 6; i++) {
    const t = i / 7;
    const y = 10 + t * 80;
    const lx = 60 - t * 52;
    const fx = 60 + t * 6;
    const rx = 60 + t * 50;
    const ry = 10 + t * 74;
    const fy = (10 + t * 84).toFixed(1);
    lines.push(`<path d="M${lx.toFixed(1)},${y.toFixed(1)} L${fx.toFixed(1)},${fy}" stroke="${INK}" stroke-width="1.2" fill="none" opacity=".35"/>`);
    lines.push(`<path d="M${fx.toFixed(1)},${fy} L${rx.toFixed(1)},${ry.toFixed(1)}" stroke="${c.shadeLine}" stroke-width="1.2" fill="none" opacity="${c.shadeLineOp}"/>`);
  }
  // vertical brick joints, staggered
  const joints = [];
  for (let i = 1; i <= 6; i++) {
    const t0 = i / 7;
    const t1 = (i + 1) / 7;
    const count = i + 1;
    for (let k = 1; k < count; k++) {
      const u = (k + (i % 2 ? 0.5 : 0)) / (count + 0.5);
      const x0 = 60 - t0 * 52 + (t0 * 58) * u;
      const y0 = 10 + t0 * 80 + t0 * 4 * u;
      const x1 = 60 - t1 * 52 + (t1 * 58) * u;
      if (x0 > 64 || x1 > 64) continue;
      joints.push(`<path d="M${x0.toFixed(1)},${y0.toFixed(1)} L${(x0 + (x1 - x0) * 0.35).toFixed(1)},${(y0 + 80 / 7 * 0.98).toFixed(1)}" stroke="${INK}" stroke-width="1" opacity=".22"/>`);
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100">` +
    `<ellipse cx="62" cy="93" rx="54" ry="6" fill="${INK}" opacity=".18"/>` +
    `<path d="M60,10 L8,90 L66,94 Z" fill="${c.lit}"/>` +
    `<path d="M60,10 L66,94 L110,84 Z" fill="${c.shade}"/>` +
    lines.join('') +
    joints.join('') +
    // capstone
    `<path d="M60,10 L52,22.5 L61,23.3 Z" fill="${c.capLit}"/>` +
    `<path d="M60,10 L61,23.3 L67.5,22 Z" fill="${c.capShade}"/>` +
    // door where the dice pop out
    `<path d="M36,90.2 L36,79 C36,74.5 39.5,71.5 43.2,71.5 C47,71.5 50.4,74.5 50.4,79 L50.4,91.3 Z" fill="${c.door}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M38.8,90.4 L38.8,80 C38.8,77 40.8,75 43.2,75 C45.6,75 47.6,77 47.6,80 L47.6,91" fill="${c.doorIn}"/>` +
    // outline
    `<path d="M60,10 L8,90 L66,94 L110,84 Z M60,10 L66,94" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
    // sparkle
    `<path d="M71,6 l1.4,3.6 3.6,1.4 -3.6,1.4 -1.4,3.6 -1.4,-3.6 -3.6,-1.4 3.6,-1.4 Z" fill="#fffbe0" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>` +
    `</svg>`
  );
}

/**
 * The five dice huts under the pyramid: square mud-brick huts with a striped
 * awning. A rolled die nests in the hut's cubby — hutSVG() is drawn behind the
 * die and hutFrontSVG() (awning + sill) in front of it, so the die looks tucked in.
 * Both use viewBox 0 0 48 48.
 */
export function hutSVG() {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">` +
    `<ellipse cx="24" cy="46.3" rx="22.5" ry="2" fill="${INK}" opacity=".18"/>` +
    // mud-brick walls
    `<rect x="3" y="9.5" width="42" height="36" rx="3.5" fill="#e3a65e" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M4.2,39.5 H43.8 V41.8 Q43.8,44.5 41.2,44.5 H6.8 Q4.2,44.5 4.2,41.8 Z" fill="#c98a45" opacity=".55"/>` +
    // a few bricks on the side walls
    `<path d="M3.9,22 H7 M41,22 H44.1 M3.9,30 H7 M41,30 H44.1 M3.9,38 H7 M41,38 H44.1 M5.5,22 V30 M42.5,30 V38" stroke="${INK}" stroke-width=".9" stroke-linecap="round" opacity=".3"/>` +
    // the cubby the die nests in: dark inside, deep shadow under the awning, a floor
    `<rect x="7" y="12.5" width="34" height="32.5" rx="2.5" fill="#5b3017" stroke="${INK}" stroke-width="1.6"/>` +
    `<rect x="7.8" y="13.3" width="32.4" height="6.2" rx="1.6" fill="#3a1d0c"/>` +
    `<rect x="7.8" y="40.6" width="32.4" height="3.6" rx="1.2" fill="#7a4524"/>` +
    `</svg>`
  );
}

export function hutFrontSVG() {
  // striped awning with a scalloped edge (terracotta at both ends), a roof cap, and a sill
  const n = 7;
  const x0 = 1;
  const w = 46 / n;
  const top = 5.2;
  const edge = 13.6; // where the scallops start
  const dip = 3.8; // how far each scallop hangs down
  const f = (v) => v.toFixed(2);
  let stripes = '';
  let outline = `M${x0},${top} H${x0 + 46} V${edge}`;
  for (let i = n - 1; i >= 0; i--) {
    const a = x0 + i * w;
    stripes += `<path d="M${f(a)},${top} H${f(a + w)} V${edge} A${f(w / 2)},${dip} 0 0,1 ${f(a)},${edge} Z" fill="${i % 2 ? '#fff3d4' : '#d05631'}"/>`;
    outline += ` A${f(w / 2)},${dip} 0 0,1 ${f(a)},${edge}`;
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">` +
    `<rect x="6" y="43.2" width="36" height="2.9" rx="1.3" fill="#d9975a" stroke="${INK}" stroke-width="1.5"/>` +
    stripes +
    `<path d="${outline} Z" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` +
    `<circle cx="24" cy="2" r="1.6" fill="#f2b84b" stroke="${INK}" stroke-width="1"/>` +
    `<rect x="0.6" y="2.6" width="46.8" height="4" rx="2" fill="#a4552a" stroke="${INK}" stroke-width="1.6"/>` +
    `</svg>`
  );
}

/**
 * Crazier Camels emblem: a looping arrow running the "wrong" way round, half black
 * and half white like the two crazy camels. viewBox 0 0 48 48.
 */
export function loopArrowSVG() {
  const arc1 = 'M33.6,35.5 A15,15 0 0 0 24,9';
  const arc2 = 'M24,9 A15,15 0 0 0 14.4,35.5';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">` +
    `<path d="${arc1} A15,15 0 0 0 14.4,35.5" fill="none" stroke="${INK}" stroke-width="9.5" stroke-linecap="round"/>` +
    `<path d="${arc1}" fill="none" stroke="#2e2828" stroke-width="5.5" stroke-linecap="round"/>` +
    `<path d="${arc2}" fill="none" stroke="#fffaf0" stroke-width="5.5"/>` +
    `<path d="M19.4,39.6 L10.2,38.9 L17,30.9 Z" fill="#fffaf0" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
    `</svg>`
  );
}

/** An Egyptian-pound coin. value 1 = silver, 5 = gold. viewBox 0 0 40 40. */
export function coinSVG(value = 1) {
  const gold = value !== 1;
  const face = gold ? '#f2b84b' : '#d9dee4';
  const rim = gold ? '#d99a1e' : '#a7b0ba';
  const emboss = gold ? '#c9861a' : '#8d97a2';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">` +
    `<circle cx="20" cy="21.5" r="17" fill="${rim}" stroke="${INK}" stroke-width="2"/>` +
    `<circle cx="20" cy="19.5" r="17" fill="${face}" stroke="${INK}" stroke-width="2"/>` +
    `<circle cx="20" cy="19.5" r="12.5" fill="none" stroke="${emboss}" stroke-width="1.6" stroke-dasharray="2 2.2"/>` +
    // tiny pyramid emblem
    `<path d="M20,11.5 L12.5,25 L27.5,25 Z" fill="${emboss}" opacity=".85"/>` +
    `<path d="M20,11.5 L23,25 L27.5,25 Z" fill="${INK}" opacity=".15"/>` +
    `<path d="M11,12 C13,9.5 16,8 19,7.8" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>` +
    `</svg>`
  );
}

/** Pyramid ticket (worth 1 at leg end). viewBox 0 0 40 40. */
export function pyramidTicketSVG() {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">` +
    `<path d="M11,4.5 L29,4.5 L38,20 L29,35.5 L11,35.5 L2,20 Z" fill="#80dad1" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
    `<path d="M12.6,8 L27.4,8 L34.2,20 L27.4,32 L12.6,32 L5.8,20 Z" fill="#fff3d4" stroke="#1a9aa3" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<path d="M20,11 L11.5,27 L28.5,27 Z" fill="#f4c96b" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<path d="M20,11 L22,27 L28.5,27 Z" fill="#d9993f"/>` +
    `<path d="M20,11 L11.5,27 L28.5,27 Z" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>` +
    `</svg>`
  );
}

/**
 * App logo: a cute camel in a rainbow propeller beanie on a golden tile.
 * viewBox 0 0 100 100.
 * square: full-bleed square (for iOS / maskable icons);
 * scale: shrink the camel toward the centre (maskable safe zone).
 */
export function logoSVG({ tile = true, square = false, scale = 1 } = {}) {
  const id = nextId('lg');
  const clip = nextId('lc');
  const hatClip = nextId('lh');
  const shape = square ? `<rect x="0" y="0" width="100" height="100"/>` : `<rect x="2" y="2" width="96" height="96" rx="24"/>`;
  const k = 1.78 * scale;
  const tx = 48.6 - 102 * k; // keeps the camel's head centred
  const ty = 54 - 18 * k + (1 - scale) * 8;
  const neck = 'M77,43 C83,38 86,30 88,22 L101,25 C99,36 95,48 92,60 L90,80 L72,80 Z';
  const head =
    'M87,21 C86,11 95,5 104,7 C111,8 116,14 117.5,21 C119,28 115,34 107.5,34 C100,34 93.5,31.5 89.5,28 C87.5,26 87,23.5 87,21 Z';
  // head + neck painted as one connected shape (outline behind, fill on top); no ear, so the hat sits cleanly
  const body =
    [neck, head].map((d) => `<path d="${d}" fill="${INK}" stroke="${INK}" stroke-width="3.6" stroke-linejoin="round"/>`).join('') +
    `<path d="${neck}" fill="#e8b46a"/><path d="${head}" fill="#e8b46a"/>`;

  // Propeller beanie in exactly the five camel colours (plus outlines).
  const C = { blue: '#1a9fd6', yellow: '#f5cf2f', green: '#2a9a45', red: '#e0344f', purple: '#6a45a8' };
  const dome = 'M86.4,15.2 C86.2,4.6 95.8,-1.6 104.4,1 C110.6,2.9 113.8,8.6 113,13.6 C104.6,11.7 95,12.5 86.4,15.2 Z';
  const apex = '99.6,-0.4';
  const hat =
    `<defs><clipPath id="${hatClip}"><path d="${dome}"/></clipPath></defs>` +
    // four even panels: yellow, red, green, purple
    `<g clip-path="url(#${hatClip})">` +
    `<path d="M${apex} L76,-6 L76,17 L89.8,17 Z" fill="${C.yellow}"/>` +
    `<path d="M${apex} L89.8,17 L99.9,17 Z" fill="${C.red}"/>` +
    `<path d="M${apex} L99.9,17 L110.8,17 Z" fill="${C.green}"/>` +
    `<path d="M${apex} L110.8,17 L124,17 L124,-6 Z" fill="${C.purple}"/>` +
    `</g>` +
    `<path d="M${apex} L91.6,13.8 M${apex} L99.8,12.3 M${apex} L107.8,12.3" stroke="${INK}" stroke-width=".9" stroke-linecap="round" opacity=".6"/>` +
    `<path d="${dome}" fill="none" stroke="${INK}" stroke-width="1.7" stroke-linejoin="round"/>` +
    // blue brim
    `<path d="M105,12.1 C111,10.9 117.6,12.1 120.6,14.7 C116.1,16.5 110.4,16.1 104.7,14.9 Z" fill="${C.blue}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>` +
    // stem, a red bead, the blue propeller and a yellow hub
    `<path d="M99.6,0 L99.6,-4.8" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>` +
    `<circle cx="99.6" cy="-1.7" r="1.15" fill="${C.red}" stroke="${INK}" stroke-width=".7"/>` +
    `<path d="M99.6,-5.2 C95.9,-8 90.7,-8.6 88.2,-7.2 C87.6,-6.1 91.3,-4.8 99.6,-5.2 Z" fill="${C.blue}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>` +
    `<path d="M99.6,-5.2 C103.3,-2.5 108.5,-1.9 111,-3.3 C111.6,-4.4 107.9,-5.6 99.6,-5.2 Z" fill="${C.blue}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>` +
    `<circle cx="99.6" cy="-5.2" r="1.4" fill="${C.yellow}" stroke="${INK}" stroke-width=".7"/>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7c95e"/><stop offset="1" stop-color="#e9a43a"/></linearGradient>` +
    `<clipPath id="${clip}">${shape}</clipPath></defs>` +
    (tile
      ? `<g clip-path="url(#${clip})"><rect x="0" y="0" width="100" height="100" fill="url(#${id})"/>` +
        `<circle cx="24" cy="26" r="11" fill="#fff0b3" opacity=".8"/>` +
        `<path d="M0,74 C24,64 44,70 60,76 C74,81 88,78 100,72 L100,100 L0,100 Z" fill="#e2893a" opacity=".55"/></g>`
      : '') +
    `<g clip-path="url(#${clip})"><g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k.toFixed(3)})">` +
    body +
    `<path d="M103.5,18.5 C110,16 117.8,19 117.8,24.5 C117.8,30.5 113,34 106.5,34 C102.5,34 100.2,30 100.8,26 C101.2,22 101.8,19.8 103.5,18.5 Z" fill="#fff3d4" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<ellipse cx="101.4" cy="18.6" rx="3.2" ry="4" fill="#2a1a10"/><circle cx="102.6" cy="17.1" r="1.2" fill="#fff"/>` +
    `<ellipse cx="106.5" cy="26.8" rx="3.6" ry="2.1" fill="#f28b82" opacity=".7"/>` +
    `<path d="M108.6,29 q3.4,2.3 7.2,-0.4" stroke="${INK}" stroke-width="1.3" fill="none" stroke-linecap="round"/>` +
    hat +
    `</g></g>` +
    `</svg>`
  );
}

// ─── Action icons (sticker style, viewBox 0 0 48 48) ─────────────────────────

const wrap48 = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${inner}</svg>`;

export const ACTION_ICONS = {
  legBet: () =>
    wrap48(
      `<g transform="rotate(-10 24 24)">` +
        `<rect x="9" y="7" width="30" height="36" rx="5" fill="#7fd0f0" stroke="${INK}" stroke-width="2.4"/>` +
        `<rect x="13" y="11" width="22" height="28" rx="3" fill="#fff3d4" stroke="${INK}" stroke-width="1.6"/>` +
        `<circle cx="24" cy="21" r="6.5" fill="#f2b84b" stroke="${INK}" stroke-width="1.8"/>` +
        `<path d="M24,17.5 L21,23.5 L27,23.5 Z" fill="#c9861a"/>` +
        `<path d="M17,31.5 h14 M17,35 h9" stroke="${INK}" stroke-width="1.8" stroke-linecap="round" opacity=".6"/>` +
        `</g>`
    ),
  tile: () =>
    wrap48(
      `<path d="M8,20 L22,14 L22,34 L8,28 Z" fill="#e0344f" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<path d="M22,12 L34,6 L34,42 L22,36 Z" fill="#f5899a" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<rect x="5" y="19" width="5" height="10" rx="2" fill="#f2b84b" stroke="${INK}" stroke-width="2"/>` +
        `<path d="M12,29 L15,38 L20,38 L18,31" fill="#f2b84b" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M38.5,17 C41,20 41,28 38.5,31 M42.5,13 C46.5,18.5 46.5,29.5 42.5,35" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
    ),
  roll: () =>
    wrap48(
      `<path d="M22,6 L4,38 L26,41 Z" fill="#f4c96b"/><path d="M22,6 L26,41 L42,36 Z" fill="#d9993f"/>` +
        `<path d="M22,6 L4,38 L26,41 L42,36 Z M22,6 L26,41" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<g transform="rotate(14 36 14)"><rect x="29" y="7" width="14" height="14" rx="3.5" fill="#e0344f" stroke="${INK}" stroke-width="2.2"/>` +
        `<circle cx="33" cy="11" r="1.6" fill="#fff"/><circle cx="36" cy="14" r="1.6" fill="#fff"/><circle cx="39" cy="17" r="1.6" fill="#fff"/></g>` +
        `<path d="M27,4 l1,-2.5 M31,4.5 l2,-2" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`
    ),
  finishBet: () =>
    wrap48(
      `<rect x="6" y="14" width="20" height="28" rx="3.5" transform="rotate(-14 16 28)" fill="#2a9a45" stroke="${INK}" stroke-width="2.2"/>` +
        `<rect x="20" y="13" width="20" height="28" rx="3.5" transform="rotate(10 30 27)" fill="#6a45a8" stroke="${INK}" stroke-width="2.2"/>` +
        `<rect x="14" y="10" width="20" height="30" rx="3.5" fill="#f5cf2f" stroke="${INK}" stroke-width="2.4"/>` +
        `<path d="M18,17 h12 v5 a6,6 0 0 1 -12,0 Z" fill="#fff3d4" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="M24,28 v4 M20,34 h8" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>` +
        `<path d="M18,19 h-2.5 a2.5,2.5 0 0 0 2.8,3.6 M30,19 h2.5 a2.5,2.5 0 0 1 -2.8,3.6" stroke="${INK}" stroke-width="1.6" fill="none"/>`
    ),
  partner: () =>
    wrap48(
      `<path d="M4,22 L12,14 L20,18 L14,30 Z" fill="#e8b48a" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<path d="M44,22 L36,14 L27,17 L34,30 Z" fill="#a86d45" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<path d="M14,30 L22,37 C24,38.5 26.5,38 27.5,36 L34,30 L27,17 L20,18 L16,24 C18,26 21,25.5 22.5,23 L25,20" fill="#e8b48a" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<path d="M19,34 l2.5,-2.5 M22.5,36.5 l2.5,-2.5" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>` +
        `<path d="M24,6 l1.2,3 3,1.2 -3,1.2 -1.2,3 -1.2,-3 -3,-1.2 3,-1.2 Z" fill="#f2b84b" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`
    ),
};

// ─── UI line icons (24×24, inherit currentColor) ─────────────────────────────

const ICON_PATHS = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  x: 'M18 6 6 18M6 6l12 12',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  arrowLeft: 'M19 12H5M11 18l-6-6 6-6',
  share: 'M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5',
  copy: 'M9 9h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  volume: 'M11 5 6 9H3v6h3l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13',
  volumeOff: 'M11 5 6 9H3v6h3l5 4V5zM22 9l-6 6M16 9l6 6',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13',
  users: 'M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20a6 6 0 0 1 12 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2.3.9 3.6 3.1 3.6 5.7',
  wifi: 'M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0M12 19.5h.01',
  bot: 'M8 8h8a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3zM12 4v4M9.5 13h.01M14.5 13h.01M2 13v2M22 13v2',
  crown: 'M3 18h18M4 18 3 7l5 4 4-6 4 6 5-4-1 11',
  trophy: 'M8 4h8v6a4 4 0 0 1-8 0V4zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M10 18h4',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5 9.5 17 19 7.5',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
  download: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11',
  sparkles: 'M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7-4.7-1.8 4.7-1.8zM19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z',
  palette: 'M12 21a9 9 0 1 1 9-9c0 2.5-2 3-3.5 3H16a2 2 0 0 0-1.5 3.3A1.6 1.6 0 0 1 12 21zM7.5 11.5h.01M10 7.5h.01M14.5 7.5h.01M17 11h.01',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  refresh: 'M20 11A8 8 0 0 0 6.3 5.3L4 8M4 3.5V8h4.5M4 13a8 8 0 0 0 13.7 5.7L20 16M20 20.5V16h-4.5',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  hourglass: 'M6 3h12M6 21h12M7 3v2a5 5 0 0 0 10 0V3M7 21v-2a5 5 0 0 1 10 0v2',
  phone: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M9 7V4h6v3',
  chevronDown: 'm6 9 6 6 6-6',
  chevronUp: 'm18 15-6-6-6 6',
  scroll: 'M8 21h11a2 2 0 0 0 2-2v-1H10v1a2 2 0 0 1-4 0V5a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2h4M6 3h11a2 2 0 0 1 2 2v13',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2',
  handshake: 'M11 17l2 2a1 1 0 0 0 1.4 0l4.6-4.6a1 1 0 0 0 0-1.4L15 9l-3 1-2-2 3-3 5 1 3 3M3 10l4-4 3 3M7 14l2 2M9 12l2.5 2.5M3 10l6.5 6.5',
};

export function icon(name, size = 20) {
  const d = ICON_PATHS[name] || ICON_PATHS.info;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
}

export const ICON_NAMES = Object.keys(ICON_PATHS);
