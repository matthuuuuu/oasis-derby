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

/**
 * Little sticker pictures used instead of emoji, in the same ink-outline style as the
 * action icons. All viewBox 0 0 48 48 except the medals (medalSVG).
 */
export const STICKERS = {
  /** A golden winner's cup on a wooden plinth. */
  trophy: () =>
    wrap48(
      // handles
      `<path d="M14,13 H9.5 C6.4,13 5.6,16.6 6.8,19.4 C8.4,23 11.4,24.6 15,25" fill="none" stroke="${INK}" stroke-width="5.6" stroke-linecap="round"/>` +
        `<path d="M14,13 H9.5 C6.4,13 5.6,16.6 6.8,19.4 C8.4,23 11.4,24.6 15,25" fill="none" stroke="#f2b84b" stroke-width="2.4" stroke-linecap="round"/>` +
        `<path d="M34,13 H38.5 C41.6,13 42.4,16.6 41.2,19.4 C39.6,23 36.6,24.6 33,25" fill="none" stroke="${INK}" stroke-width="5.6" stroke-linecap="round"/>` +
        `<path d="M34,13 H38.5 C41.6,13 42.4,16.6 41.2,19.4 C39.6,23 36.6,24.6 33,25" fill="none" stroke="#d99a1e" stroke-width="2.4" stroke-linecap="round"/>` +
        // stem and plinth
        `<path d="M21,30 H27 L26.2,35.5 H21.8 Z" fill="#d99a1e" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<rect x="14" y="35" width="20" height="8.5" rx="2.2" fill="#a4552a" stroke="${INK}" stroke-width="2.2"/>` +
        `<rect x="19" y="37.6" width="10" height="3.4" rx="1" fill="#fbe08a" stroke="${INK}" stroke-width="1.3"/>` +
        // the cup, lit on the left
        `<path d="M12.5,9 H35.5 V18.5 C35.5,26.5 30.5,31 24,31 C17.5,31 12.5,26.5 12.5,18.5 Z" fill="#f2b84b"/>` +
        `<path d="M29,9 H35.5 V18.5 C35.5,26.5 30.5,31 24,31 C28.5,28 30,23 30,17 Z" fill="#d99a1e"/>` +
        `<path d="M16,12 V18.5 C16,21.5 17,24 18.6,25.8" fill="none" stroke="#fff3d4" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>` +
        `<path d="M12.5,9 H35.5 V18.5 C35.5,26.5 30.5,31 24,31 C17.5,31 12.5,26.5 12.5,18.5 Z" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<rect x="11" y="6" width="26" height="4.4" rx="2.2" fill="#fbe08a" stroke="${INK}" stroke-width="2.2"/>` +
        // a star on the cup
        `<path d="M24,13.4 l1.9,3.9 4.3,.6 -3.1,3 .7,4.3 -3.8,-2 -3.8,2 .7,-4.3 -3.1,-3 4.3,-.6 Z" fill="#fff3d4" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>` +
        `<path d="M40,4 l1,2.6 2.6,1 -2.6,1 -1,2.6 -1,-2.6 -2.6,-1 2.6,-1 Z" fill="#fffbe0" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>`
    ),

  /**
   * A chequered finish flag on a wooden pole, in the finish line's own chequers: 4 rows of crisp
   * squares. The cloth ripples column by column, so every square stays whole.
   */
  flag: () => {
    const x0 = 12.6, y0 = 8, s = 4.75, rows = 4, cols = 6;
    const wave = [0, -1.2, -1.5, -0.5, 0.9, 1.3, 0.6]; // vertical shift of each column edge
    const X = (c) => (x0 + c * s).toFixed(2);
    const Y = (c, r) => (y0 + wave[c] + r * s).toFixed(2);
    let dark = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if ((r + c) % 2) continue;
        dark += `M${X(c)},${Y(c, r)} L${X(c + 1)},${Y(c + 1, r)} L${X(c + 1)},${Y(c + 1, r + 1)} L${X(c)},${Y(c, r + 1)} Z`;
      }
    }
    let top = '', bottom = '';
    for (let c = 0; c <= cols; c++) top += `${c ? 'L' : 'M'}${X(c)},${Y(c, 0)} `;
    for (let c = cols; c >= 0; c--) bottom += `L${X(c)},${Y(c, rows)} `;
    const cloth = `${top}${bottom}Z`;
    return wrap48(
      `<ellipse cx="11" cy="44.4" rx="6" ry="1.8" fill="${INK}" opacity=".18"/>` +
        `<path d="${cloth}" fill="#fff6e0"/>` +
        `<path d="${dark}" fill="#2b1d12"/>` +
        `<path d="${cloth}" fill="none" stroke="${INK}" stroke-width="2.3" stroke-linejoin="round"/>` +
        `<rect x="9" y="6" width="3.6" height="38" rx="1.8" fill="#a4552a" stroke="${INK}" stroke-width="2"/>` +
        `<circle cx="10.8" cy="5.4" r="2.9" fill="#f2b84b" stroke="${INK}" stroke-width="1.8"/>`
    );
  },

  /** The crown the race leader wears. */
  crown: () =>
    wrap48(
      `<path d="M8,37 L5.5,15.5 L16,23.5 L24,9.5 L32,23.5 L42.5,15.5 L40,37 Z" fill="#f2b84b" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<path d="M24,9.5 L32,23.5 L42.5,15.5 L40,37 H30 Z" fill="#d99a1e" opacity=".55"/>` +
        `<rect x="7.4" y="31.5" width="33.2" height="7.5" rx="2" fill="#d99a1e" stroke="${INK}" stroke-width="2.2"/>` +
        `<circle cx="16" cy="35.2" r="2" fill="#e0344f" stroke="${INK}" stroke-width="1.3"/><circle cx="24" cy="35.2" r="2.2" fill="#1a9fd6" stroke="${INK}" stroke-width="1.3"/><circle cx="32" cy="35.2" r="2" fill="#2a9a45" stroke="${INK}" stroke-width="1.3"/>` +
        `<circle cx="5.5" cy="14.5" r="2.6" fill="#fbe08a" stroke="${INK}" stroke-width="1.6"/><circle cx="24" cy="8" r="2.8" fill="#fbe08a" stroke="${INK}" stroke-width="1.6"/><circle cx="42.5" cy="14.5" r="2.6" fill="#fbe08a" stroke="${INK}" stroke-width="1.6"/>`
    ),

  /** A slow, happy tortoise (the overall loser pile). */
  tortoise: () =>
    wrap48(
      `<ellipse cx="24" cy="40.6" rx="18" ry="2.2" fill="${INK}" opacity=".16"/>` +
        // feet, tail, head
        `<path d="M11,33 V38.6 Q11,40 12.6,40 H16.4 Q18,40 18,38.6 V33 Z M28,33 V38.6 Q28,40 29.6,40 H33.4 Q35,40 35,38.6 V33 Z" fill="#9ccc6a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M7.5,31 L3.5,33 L7.8,34.4" fill="#9ccc6a" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="M36,30 C37,24 40,21.6 43.4,22.4 C46.6,23.2 47,28 44.6,30.4 C42.6,32.4 39,32.6 36.4,33 Z" fill="#9ccc6a" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<circle cx="42.6" cy="25.8" r="1.4" fill="#2a1a10"/><circle cx="43" cy="25.3" r=".5" fill="#fff"/>` +
        `<path d="M41.6,29 Q43.4,30.2 45,28.8" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/>` +
        `<ellipse cx="40.4" cy="28.6" rx="1.5" ry="1" fill="#f28b82" opacity=".6"/>` +
        // the shell
        `<path d="M7,32 C7,19 15,12.5 22.5,12.5 C30,12.5 38,19 38,32 Z" fill="#4f9a3a" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<path d="M16.5,31.5 L13.5,25 L18,18.5 H27 L31.5,25 L28.5,31.5 M18,18.5 L16,14.6 M27,18.5 L29,14.6 M13.5,25 H8 M31.5,25 H37" fill="none" stroke="#2f6f2a" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="M18.8,20.6 H26.2 L29.4,25.4 L27,30 H18 L15.6,25.4 Z" fill="#78bf4c"/>` +
        `<path d="M12,22 C13.6,18.4 16.4,15.8 19.6,14.6" fill="none" stroke="#a9db7c" stroke-width="2" stroke-linecap="round"/>` +
        `<path d="M5.5,31.4 H39.5 Q40.6,31.4 40.6,32.6 Q40.6,34.4 38.8,34.4 H6.2 Q4.4,34.4 4.4,32.6 Q4.4,31.4 5.5,31.4 Z" fill="#c9e59a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`
    ),

  /** Zara's crystal ball on its little golden stand (the fortune teller odds). */
  crystalBall: () =>
    wrap48(
      `<path d="M14.5,36 H33.5 L37,43 H11 Z" fill="#d99a1e" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<path d="M16,33 H32 L33.5,37 H14.5 Z" fill="#f2b84b" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<circle cx="24" cy="20" r="14" fill="#bfdcf7" stroke="${INK}" stroke-width="2.4"/>` +
        `<path d="M24,6 A14,14 0 0 1 36.2,26.8 C30,30 22,29 17.6,24 C22.6,24.6 27.6,22 29.4,16.6 C30.6,12.6 28.6,8.6 24,6 Z" fill="#a88ae0" opacity=".55"/>` +
        `<path d="M15.6,12.4 A10.5,10.5 0 0 1 22,8.8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>` +
        `<circle cx="15.4" cy="16.6" r="1.4" fill="#fff"/>` +
        `<path d="M27,17 l1,2.4 2.4,1 -2.4,1 -1,2.4 -1,-2.4 -2.4,-1 2.4,-1 Z" fill="#fff" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"/>` +
        `<path d="M41,6 l.9,2.2 2.2,.9 -2.2,.9 -.9,2.2 -.9,-2.2 -2.2,-.9 2.2,-.9 Z" fill="#fffbe0" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"/>`
    ),

  /** A sleepy eye mask: "no peeking!" */
  peek: () =>
    wrap48(
      `<path d="M5,21 C2.5,21.5 1.6,24 2.6,26 M43,21 C45.5,21.5 46.4,24 45.4,26" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>` +
        `<path d="M5,22 C5,15.5 11,12.8 17,14 C20.5,14.7 22.4,16.6 24,16.6 C25.6,16.6 27.5,14.7 31,14 C37,12.8 43,15.5 43,22 C43,29.5 37.4,33 31.6,31.4 C28,30.4 26,28 24,28 C22,28 20,30.4 16.4,31.4 C10.6,33 5,29.5 5,22 Z" fill="#6a45a8" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<path d="M8.6,19.4 C10.6,16.6 14,15.8 17,16.4" fill="none" stroke="#a88ae0" stroke-width="2" stroke-linecap="round"/>` +
        `<path d="M10,22.4 Q14.5,27 19,22.4 M29,22.4 Q33.5,27 38,22.4" fill="none" stroke="#fff3d4" stroke-width="2.4" stroke-linecap="round"/>` +
        `<path d="M11.6,25 l-1.6,2 M14.5,26.2 v2.4 M17.4,25 l1.6,2 M30.6,25 l-1.6,2 M33.5,26.2 v2.4 M36.4,25 l1.6,2" fill="none" stroke="#fff3d4" stroke-width="1.6" stroke-linecap="round"/>` +
        `<path d="M36,6 h5 l-5,5 h5 M28,8.4 h3.4 l-3.4,3.4 h3.4" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
    ),

  /** A striped bazaar tent with a pennant: your own online room. */
  tent: () => {
    const id = nextId('tnt');
    const roof = 'M24,9 L42,36 H6 Z';
    return wrap48(
      `<defs><clipPath id="${id}"><path d="${roof}"/></clipPath></defs>` +
        `<ellipse cx="24" cy="41.4" rx="19" ry="2" fill="${INK}" opacity=".16"/>` +
        `<path d="${roof}" fill="#fff3d4"/>` +
        `<g clip-path="url(#${id})" fill="#d05631"><path d="M24,9 L14,40 H8 Z M24,9 L28,40 H22 Z M24,9 L42,40 H36 Z"/></g>` +
        `<path d="M24,22 C21,26 20,32 20.4,36 H27.6 C28,32 27,26 24,22 Z" fill="#5b3017" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` +
        `<path d="${roof}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<rect x="5" y="35.4" width="38" height="4" rx="2" fill="#a4552a" stroke="${INK}" stroke-width="2"/>` +
        `<path d="M24,9.5 V3" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>` +
        `<path d="M24.6,3 L32,5.2 L24.6,7.6 Z" fill="#2ec4c6" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`
    );
  },

  /** A phone with the dice pyramid on its screen: rejoin a friend's room. */
  phone: () =>
    wrap48(
      `<rect x="12" y="4" width="24" height="40" rx="5" fill="#2e2828" stroke="${INK}" stroke-width="2.4"/>` +
        `<rect x="15" y="9" width="18" height="28" rx="2" fill="#7fd0f0"/>` +
        `<path d="M24,15 L17.6,30 L25.2,31.2 Z" fill="#f4c96b"/><path d="M24,15 L25.2,31.2 L30.6,29.4 Z" fill="#d99a1e"/>` +
        `<path d="M24,15 L17.6,30 L25.2,31.2 L30.6,29.4 Z M24,15 L25.2,31.2" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<rect x="20" y="39.6" width="8" height="1.8" rx=".9" fill="#7d818c"/>` +
        `<path d="M40,10 C42.6,12.6 42.6,17.4 40,20 M43.4,7 C47.4,11 47.4,19 43.4,23" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`
    ),
};

/**
 * A place medal: 1 = gold on a red ribbon, 2 = silver on a blue ribbon. viewBox 0 0 40 48.
 */
export function medalSVG(place = 1) {
  const gold = place === 1;
  const [face, shade, light] = gold ? ['#f2b84b', '#d99a1e', '#fbe08a'] : ['#c9ced6', '#9aa1ad', '#eef1f5'];
  const [ribbonA, ribbonB] = gold ? ['#e0344f', '#b82640'] : ['#1a9fd6', '#127fb0'];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48">` +
    `<path d="M7,2 H16 L22.6,22 H13.6 Z" fill="${ribbonA}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M33,2 H24 L17.4,22 H26.4 Z" fill="${ribbonB}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M10.4,2 L16.4,20.4" stroke="#fff3d4" stroke-width="1.4" opacity=".6"/>` +
    `<circle cx="20" cy="32" r="13" fill="${face}" stroke="${INK}" stroke-width="2.4"/>` +
    `<path d="M20,19 A13,13 0 0 1 31.4,38.4 C27,41.6 20.4,42 15.6,39.6 C24.6,38.4 30,30.6 28,22.6 C26.6,20.6 23.4,19.4 20,19 Z" fill="${shade}" opacity=".6"/>` +
    `<circle cx="20" cy="32" r="9.2" fill="none" stroke="${light}" stroke-width="1.8"/>` +
    `<text x="20" y="37.6" text-anchor="middle" font-family="'Lilita One', 'Trebuchet MS', sans-serif" font-size="15.5" fill="${INK}">${place}</text>` +
    `<path d="M12.6,26.4 A9,9 0 0 1 17,23" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".85"/>` +
    `</svg>`
  );
}

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
