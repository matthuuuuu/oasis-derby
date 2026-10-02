// Small shared UI pieces: icons, avatars, tokens, sheets, toasts.
import { html, useEffect, useMemo, useState, useRef } from '../../vendor/preact-htm.js';
import { CHARACTERS, portraitSVG, pharaohMaskSVG, crowdSVG } from '../art/characters.js';
import { camelSVG, camelBadgeSVG } from '../art/camels.js';
import { coinSVG, icon, pyramidTicketSVG, pyramidSVG, STICKERS, medalSVG, ACTION_ICONS } from '../art/tokens.js';
import { CAMEL_LABELS } from '../engine/constants.js';
import { getPrefs, setPrefs } from './prefs.js';
import { sfx } from './fx.js';

export { html };

/** Inject a trusted SVG/HTML string. */
export function Raw({ svg, class: cls = '', tag = 'span', style }) {
  const Tag = tag;
  return html`<${Tag} class=${cls} style=${style} dangerouslySetInnerHTML=${{ __html: svg }} />`;
}

const stickers = {};
const stickerSVG = (name) =>
  (stickers[name] ||= name === 'medal1' ? medalSVG(1) : name === 'medal2' ? medalSVG(2) : name === 'partner' ? ACTION_ICONS.partner() : STICKERS[name]());
/**
 * One of the little sticker pictures we use instead of emoji (trophy, flag, crown, tortoise,
 * crystalBall, peek, tent, phone, medal1, medal2, partner), `size` px wide.
 */
export function Sticker({ name, size = 20, class: cls = '' }) {
  const tall = name.startsWith('medal') ? 1.2 : 1;
  return html`<${Raw} svg=${stickerSVG(name)} class=${`sticker ${cls}`} style=${`width:${size}px;height:${size * tall}px`} />`;
}

export function Icon({ name, size = 20 }) {
  return html`<${Raw} svg=${icon(name, size)} class="ico-line" style="display:inline-grid" />`;
}

export const characterById = (id) => CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
export const camelName = (c) => CAMEL_LABELS[c] || c;
export { CHARACTERS };

/** A player's round portrait. Memoised per instance so SVG ids stay unique. */
export function Avatar({ character, size = '', bot = false, status = null, title = '' }) {
  const svg = useMemo(() => portraitSVG(character), [character]);
  return html`<span class=${`avatar ${size}`} title=${title}>
    <${Raw} svg=${svg} tag="span" style="display:block;width:100%;height:100%" />
    ${bot && html`<span class="bot-badge" aria-label="bot"><${Raw} svg=${icon('bot', 12)} /></span>`}
    ${status !== null && html`<span class=${`status-dot ${status ? '' : 'off'}`}></span>`}
  </span>`;
}

export function PharaohMarker() {
  const svg = useMemo(() => pharaohMaskSVG(), []);
  return html`<${Raw} svg=${svg} class="marker" />`;
}

export function CamelSprite({ camel, pose = 'stand', shadow = true, class: cls = 'cam' }) {
  const svg = useMemo(() => camelSVG(camel, { pose, shadow }), [camel, pose, shadow]);
  return html`<${Raw} svg=${svg} class=${cls} />`;
}

/** size: pixels, or a CSS width such as '100%' to fill its box. */
export function CamelBadge({ camel, size = 22 }) {
  const svg = useMemo(() => camelBadgeSVG(camel), [camel]);
  const style = typeof size === 'number' ? `width:${size}px;height:${size}px;display:inline-block` : `width:${size};display:block`;
  return html`<${Raw} svg=${svg} class="badge" style=${style} />`;
}

export function CamelDot({ camel }) {
  return html`<span class=${`cdot ${camel}`} aria-hidden="true"></span>`;
}

const coin5 = coinSVG(5);
export function Coins({ n, small = false }) {
  return html`<span class=${`coins ${small ? 'sm' : ''}`} title=${`${n} Egyptian pounds`}>
    <${Raw} svg=${coin5} />${n}
  </span>`;
}

export const pyramidTicketIcon = pyramidTicketSVG();
export const pyramidArt = pyramidSVG;

export function Die({ die, value, shown, popping = false, style }) {
  const cls = `die c-${die} ${die === 'grey' ? `show-${shown}` : ''} ${popping ? 'popping' : ''}`;
  const label = die === 'grey' ? `grey die: ${shown} ${value}` : `${die} die: ${value}`;
  return html`<div class=${cls} style=${style} aria-label=${label}><span>${value}</span></div>`;
}

/**
 * A leg betting ticket (top of a stack).
 * pick: 'hover' | 'press' while another player is choosing this ticket (same look as a mouse hover).
 */
export function Ticket({ color, value, left, onClick, disabled, selected, pick = null, compact = false }) {
  if (!value) {
    return html`<div class="ticket empty" aria-label=${`${camelName(color)}: no tickets left`}>none left</div>`;
  }
  const Tag = onClick ? 'button' : 'div';
  const picked = pick === 'press' ? 'bot-press' : pick ? 'bot-hover' : '';
  return html`<${Tag}
    class=${`ticket c-${color} ${selected ? 'selected' : ''} ${picked}`}
    onClick=${onClick}
    disabled=${disabled}
    aria-label=${`${camelName(color)} betting ticket worth ${value}${left ? `, ${left} left` : ''}`}
  >
    <div class="inner">
      <${CamelBadge} camel=${color} size=${compact ? 24 : 30} />
      <div class="value">${value}</div>
      <div class="pay"><span>2nd +1</span><span>else −1</span></div>
    </div>
    ${left != null && html`<div class="left">${left} left</div>`}
  </${Tag}>`;
}

export function MiniTicket({ color, value }) {
  return html`<span class=${`mini-ticket c-${color}`} title=${`${camelName(color)} ${value}`}>${value}</span>`;
}

/** Overall winner/loser card. `back` shows the face-down side. */
export function FinishCard({ color, character, back = false, onClick, disabled, selected, used, style }) {
  const portrait = useMemo(() => (character ? portraitSVG(character) : ''), [character]);
  const Tag = onClick ? 'button' : 'div';
  if (back) {
    return html`<${Tag} class="fcard back" style=${style} onClick=${onClick} disabled=${disabled} aria-label="face-down card">
      <${Raw} svg=${pyramidTicketIcon} class="back-emblem" />
    </${Tag}>`;
  }
  return html`<${Tag}
    class=${`fcard c-${color} ${selected ? 'selected' : ''} ${used ? 'used' : ''}`}
    style=${style}
    onClick=${onClick}
    disabled=${disabled}
    aria-label=${`${camelName(color)} card`}
  >
    <span class="badge"><${CamelBadge} camel=${color} size="100%" /></span>
    ${character && html`<${Raw} svg=${portrait} class="who" />`}
  </${Tag}>`;
}

const crowds = { cheer: null, boo: null };
/** A player's spectator tile. */
export function SpectatorTile({ side, character, style }) {
  crowds[side] ||= crowdSVG(side);
  // no built-in ring: the CSS outline matches the +1/−1 circle beside it exactly
  const portrait = useMemo(() => portraitSVG(character, { ring: false }), [character]);
  return html`<div class=${`stile ${side}`} style=${style} aria-label=${`${side === 'cheer' ? 'cheering' : 'booing'} spectator tile`}>
    <${Raw} svg=${crowds[side]} class="crowd" />
    <${Raw} svg=${portrait} class="who" />
    <span class="val">${side === 'cheer' ? '+1' : '−1'}</span>
  </div>`;
}

/** The 8-character picker (like Aviary's avatar row). */
export function CharacterPicker({ value, onChange, taken = [] }) {
  const ch = characterById(value);
  return html`<div>
    <div class="char-grid" role="radiogroup" aria-label="Choose your character">
      ${CHARACTERS.map(
        (c) => html`<button
          class="char-option"
          aria-pressed=${c.id === value}
          aria-label=${`${c.name}, ${c.title}`}
          title=${`${c.name} · ${c.title}`}
          disabled=${taken.includes(c.id) && c.id !== value}
          onClick=${() => {
            sfx.tap();
            onChange(c.id);
          }}
        >
          <${CharPortrait} id=${c.id} />
        </button>`
      )}
    </div>
    <p class="char-caption"><b>${ch.name}</b> · ${ch.title}</p>
  </div>`;
}

function CharPortrait({ id }) {
  const svg = useMemo(() => portraitSVG(id), [id]);
  return html`<${Raw} svg=${svg} tag="span" class="char-face" />`;
}

export function ThemeDots() {
  const [theme, setTheme] = useState(getPrefs().theme);
  const pick = (t) => {
    setPrefs({ theme: t });
    setTheme(t);
    sfx.tap();
  };
  return html`<div class="theme-dots" role="group" aria-label="Colour theme">
    <span class="palette-ico"><${Icon} name="palette" size=${18} /></span>
    ${['sand', 'sunset', 'night'].map(
      (t) => html`<button class=${`theme-dot ${t}`} aria-pressed=${theme === t} aria-label=${`${t} theme`} title=${t} onClick=${() => pick(t)}></button>`
    )}
  </div>`;
}

export function Switch({ checked, onChange, label }) {
  return html`<button class="switch" role="switch" aria-checked=${checked} aria-label=${label} onClick=${() => onChange(!checked)}></button>`;
}

/** Bottom sheet on phones, centred dialog on bigger screens. */
export function Sheet({ title, subtitle, onClose, children, wide = false, dismissable = true, class: cls = '' }) {
  const ref = useRef();
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && dismissable && onClose?.();
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return html`<div class="overlay" onClick=${(e) => e.target === e.currentTarget && dismissable && onClose?.()}>
    <div class=${`sheet ${wide ? 'wide' : ''} ${cls}`} role="dialog" aria-modal="true" aria-label=${title} tabindex="-1" ref=${ref}>
      <div class="sheet-grip"></div>
      ${title &&
      html`<div class="sheet-head">
        <div style="flex:1">
          <h2>${title}</h2>
          ${subtitle && html`<p>${subtitle}</p>`}
        </div>
        ${dismissable && onClose && html`<button class="icon-btn" onClick=${onClose} aria-label="Close"><${Icon} name="x" /></button>`}
      </div>`}
      ${children}
    </div>
  </div>`;
}

// ─── Toasts ──────────────────────────────────────────────────────────────────
let toastSetter = null;
let toastId = 0;
export function toast(message, kind = '') {
  if (!toastSetter) return;
  const id = ++toastId;
  toastSetter((list) => [...list.slice(-2), { id, message, kind }]);
  setTimeout(() => toastSetter((list) => list.filter((t) => t.id !== id)), 3200);
}
export function Toasts() {
  const [list, setList] = useState([]);
  toastSetter = setList;
  return html`<div class="toasts" aria-live="polite">
    ${list.map((t) => html`<div key=${t.id} class=${`toast ${t.kind}`}>${t.message}</div>`)}
  </div>`;
}

export function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text).then(() => true, () => false);
  } catch {
    /* fall through */
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return Promise.resolve(ok);
}
