// The race track: 16 spaces in a loop around the oasis, camels that hop
// between them, spectator tiles, the dice pyramid and the dice huts.
import { html, useEffect, useLayoutEffect, useMemo, useRef, useState } from '../../vendor/preact-htm.js';
import { ALL_CAMELS, isCrazy, CAMEL_LABELS } from '../engine/constants.js';
import { rankStacks } from '../engine/game.js';
import { camelSVG } from '../art/camels.js';
import { oasisSVG } from '../art/scenery.js';
import { pyramidSVG, hutSVG, hutFrontSVG, icon } from '../art/tokens.js';
import { Raw, Die, SpectatorTile } from './common.js';
import { sfx } from './fx.js';
import { getPrefs } from './prefs.js';
import { pileSlot, STACK_STYLE, CAMEL_SIZE } from './stacking.js';

/**
 * Where each space sits on the 5×5 grid, as [row, col].
 * Racing camels move CLOCKWISE: from space 1 (bottom-right) leftwards along
 * the bottom, up the left side, rightwards along the top and down the right
 * side to the finish line between space 16 and space 1.
 */
export const SPACE_CELLS = {
  1: [4, 4], 2: [4, 3], 3: [4, 2], 4: [4, 1], 5: [4, 0],
  6: [3, 0], 7: [2, 0], 8: [1, 0],
  9: [0, 0], 10: [0, 1], 11: [0, 2], 12: [0, 3], 13: [0, 4],
  14: [1, 4], 15: [2, 4], 16: [3, 4],
};

/** Racing camels face the way they run; crazy camels face the other way. */
function facesLeft(camel, space) {
  const racingLeft = space <= 8; // bottom row & left column run leftwards/upwards
  return isCrazy(camel) ? !racingLeft : racingLeft;
}

const CAMEL_W = CAMEL_SIZE; // camel width as a fraction of the board width

function cellStyle(space) {
  const [row, col] = SPACE_CELLS[space];
  return `left:${col * 20 + 0.2}%;top:${row * 20 + 0.2}%`;
}

/**
 * Pixel position (and pose / facing) of a camel that is `index` up a stack of
 * `count` on `space`. `stack` lists the camels in that pile, bottom first.
 *
 * With the 'lazy' pile style the bottom camel stands (facing its racing
 * direction) and every camel above it lies down on the back of the one below,
 * alternating which way it looks — 2nd right, 3rd left, 4th right… — and
 * shifting toward that side, so every camel's head pokes out of the pile.
 * The layout itself lives in stacking.js.
 */
function camelPos(W, space, index, count, stack) {
  const cell = W / 5;
  const camW = W * CAMEL_W;
  const camH = (camW * 100) / 120;
  let row;
  let col;
  let dx = 0;
  let dy = 0;
  if (space >= 17) {
    [row, col] = [3, 4];
    dy = cell * 0.55;
    dx = cell * 0.3;
  } else if (space <= 0) {
    [row, col] = [4, 4];
    dy = -cell * 0.45;
    dx = cell * 0.3;
  } else {
    [row, col] = SPACE_CELLS[space];
  }
  const cellTop = row * cell + dy;
  const baseTop = cellTop + cell * 0.96 - camH; // sprite top of the bottom camel
  const centreX = col * cell + (cell - camW) / 2 + dx;

  // How far above its own space a pile may reach: on the left/right sides
  // another track space sits right above; the top row shouldn't climb into
  // the menu bar; the bottom row can rise into the oasis.
  const onTrack = space >= 1 && space <= 16;
  const boxed = onTrack && (col === 0 || col === 4) && row >= 1;
  const allowance = boxed ? 0.04 : row === 0 ? 0.12 : 0.35;
  const room = baseTop - (cellTop - cell * allowance);
  const forwardLeft = space <= 8; // the race runs leftwards along the bottom row and up the left side
  const slot = pileSlot(STACK_STYLE, index, count, (i) => facesLeft(stack[i], space), { camW, camH, room, forwardLeft });

  let x = centreX + slot.dx;
  if (onTrack && count > 1) {
    // stay inside the space (and never poke over the board's outer rim)
    const minX = col === 0 ? cell * 0.04 : col * cell - cell * 0.03;
    const maxX = col === 4 ? W - camW - cell * 0.04 : col * cell + cell - camW + cell * 0.03;
    x = Math.max(minX, Math.min(maxX, x));
  }
  return { x, y: baseTop - slot.rise, z: 10 + row * 20 + index, lying: slot.pose === 'sit', faceLeft: slot.faceLeft };
}

function positionsFor(W, stacks) {
  const out = {};
  for (const key in stacks) {
    const space = Number(key);
    const stack = stacks[key];
    stack.forEach((camel, index) => {
      out[camel] = { ...camelPos(W, space, index, stack.length, stack), space };
    });
  }
  return out;
}

/** Point a camel element the right way and pick its pose (standing or lying on the pile). */
function dress(el, p) {
  el.classList.toggle('face-left', !!p.faceLeft);
  el.classList.toggle('sitting', !!p.lying);
}

const T = (p) => `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Board props:
 *  view       { stacks, rolled, tiles } — what to draw right now
 *  players    list of players (for tile portraits)
 *  pickSpaces spaces that can be tapped (spectator tile placement), or null
 *  picked     currently chosen space
 *  onPick(space)
 *  canRoll, onRoll  — the pyramid is a big "roll" button on your turn
 *  controller ref: filled with { animateMove, shake, flashTile, float }
 */
export function Board({ view, players, pickSpaces, picked, onPick, canRoll, onRoll, rollPick = null, controller, theme }) {
  const boardRef = useRef();
  const camelEls = useRef({});
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const animating = useRef(false);
  const stacksRef = useRef(view.stacks);
  const [floats, setFloats] = useState([]);
  const [flash, setFlash] = useState(null);
  const [shaking, setShaking] = useState(false);

  const oasis = useMemo(() => oasisSVG(theme), [theme]);
  const pyramid = useMemo(() => pyramidSVG(), []);
  const hutBack = useMemo(() => hutSVG(), []);
  const hutFront = useMemo(() => hutFrontSVG(), []);
  const sprites = useMemo(
    () =>
      Object.fromEntries(
        ALL_CAMELS.map((c) => [
          c,
          { stand: camelSVG(c, { title: `${CAMEL_LABELS[c]} camel` }), sit: camelSVG(c, { pose: 'sit', title: `${CAMEL_LABELS[c]} camel` }) },
        ])
      ),
    []
  );

  // keep track of the board size
  useLayoutEffect(() => {
    const el = boardRef.current;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      widthRef.current = w;
      setWidth(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // snap camels to where the view says they are (when not mid-animation)
  const snap = (stacks) => {
    const W = widthRef.current;
    if (!W) return;
    const pos = positionsFor(W, stacks);
    for (const camel of ALL_CAMELS) {
      const el = camelEls.current[camel];
      const p = pos[camel];
      if (!el || !p) continue;
      el.style.transform = T(p);
      el.style.zIndex = p.z;
      dress(el, p);
    }
  };
  useLayoutEffect(() => {
    stacksRef.current = view.stacks;
    if (!animating.current) snap(view.stacks);
  }, [view.stacks, width]);

  // a little crown floats over whoever is leading
  const leader = useMemo(() => rankStacks(view.stacks)[0], [view.stacks]);
  useLayoutEffect(() => {
    for (const camel of ALL_CAMELS) camelEls.current[camel]?.classList.toggle('leader', camel === leader);
  }, [leader]);

  // ── imperative animation API used by the game screen ──
  const api = {
    async animateMove(e) {
      const W = widthRef.current;
      if (!W) return;
      animating.current = true;
      const fast = getPrefs().fast;
      const hopMs = fast ? 150 : 250;
      const before = stacksRef.current;
      const steps = Math.abs(e.to - e.from);
      const path = Array.from({ length: steps }, (_, k) => e.from + e.dir * (k + 1));
      // stacks with the moving unit lifted out
      const base = {};
      for (const key in before) {
        const list = before[key].filter((c) => !e.unit.includes(c));
        if (list.length) base[key] = list;
      }
      const startPos = positionsFor(W, before);
      const endPos = positionsFor(W, e.stacks);
      const hopH = (W / 5) * 0.42;
      const anims = e.unit.map((camel, j) => {
        const el = camelEls.current[camel];
        if (!el) return null;
        const pts = [startPos[camel]];
        path.forEach((space, k) => {
          if (k === path.length - 1) pts.push(endPos[camel]);
          else {
            const pile = [...(base[space] || []), ...e.unit];
            pts.push(camelPos(W, space, pile.length - e.unit.length + j, pile.length, pile));
          }
        });
        const frames = [{ transform: T(pts[0]), offset: 0, easing: 'ease-out' }];
        for (let k = 1; k < pts.length; k++) {
          const a = pts[k - 1];
          const b = pts[k];
          frames.push({ transform: T({ x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - hopH }), offset: (k - 0.5) / (pts.length - 1), easing: 'ease-in' });
          frames.push({ transform: T(b), offset: k / (pts.length - 1), easing: 'ease-out' });
        }
        el.style.zIndex = 300 + j;
        dress(el, endPos[camel]); // the hopping group takes its landing pose as it sets off
        return el.animate(frames, { duration: hopMs * steps, fill: 'forwards' });
      });
      for (let k = 0; k < steps; k++) setTimeout(() => sfx.hop(), k * hopMs);
      // Browsers pause animations in hidden tabs; never let that stall the game.
      await Promise.race([Promise.all(anims.map((a) => a?.finished.catch(() => {}))), wait(hopMs * steps + 400)]);
      // settle everything (other camels may shift when a unit slides underneath)
      for (const camel of ALL_CAMELS) {
        const el = camelEls.current[camel];
        const p = endPos[camel];
        if (!el || !p) continue;
        el.style.transition = e.unit.includes(camel) ? '' : 'transform .22s ease-out';
        el.style.transform = T(p);
        el.style.zIndex = p.z;
        dress(el, p);
      }
      anims.forEach((a) => a?.cancel());
      sfx.land();
      stacksRef.current = e.stacks;
      await wait(fast ? 60 : 140);
      for (const camel of ALL_CAMELS) {
        const el = camelEls.current[camel];
        if (el) el.style.transition = '';
      }
      animating.current = false;
    },
    shake() {
      setShaking(true);
      setTimeout(() => setShaking(false), 520);
    },
    flashTile(space) {
      setFlash(space);
      setTimeout(() => setFlash((f) => (f === space ? null : f)), 650);
    },
    float(space, text, kind = 'cheer') {
      const id = Math.random();
      const [row, col] = SPACE_CELLS[space] || [4, 4];
      setFloats((f) => [...f, { id, text, kind, left: col * 20 + 10, top: row * 20 + 4 }]);
      setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1400);
    },
  };
  if (controller) controller.current = api;

  const tileOwner = (id) => players.find((p) => p.id === id);
  const pickable = new Set(pickSpaces || []);

  return html`<div class="board-wrap">
    <div class="board" ref=${boardRef}>
      ${Object.keys(SPACE_CELLS).map((k) => {
        const space = Number(k);
        const can = pickable.has(space);
        const cls = [
          'track-cell',
          space % 2 ? '' : 'alt',
          space === 1 ? 'start-cell' : '',
          can ? 'pickable' : '',
          picked === space ? 'picked' : '',
          pickSpaces && !can ? 'dim' : '',
        ].join(' ');
        return html`<div
          key=${space}
          class=${cls}
          style=${cellStyle(space)}
          onClick=${can ? () => onPick(space) : undefined}
          onKeyDown=${can ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onPick(space)) : undefined}
          tabindex=${can ? 0 : undefined}
          role=${can ? 'button' : undefined}
          aria-label=${`Space ${space}${can ? ', tap to place your spectator tile' : ''}`}
        >
          <span class="num">${space}</span>
        </div>`;
      })}

      <div class="finish-line" style="left:80.2%;top:78.7%;width:19.6%" title="Finish line"></div>

      <div class="board-center">
        <${Raw} svg=${oasis} class="oasis" tag="div" />
        ${canRoll && html`<div class="pyramid-hint">Tap to roll!</div>`}
        <button
          class=${`pyramid-btn ${canRoll ? 'can-roll' : ''} ${shaking ? 'shaking' : ''} ${rollPick === 'press' ? 'bot-press' : rollPick ? 'bot-hover' : ''}`}
          onClick=${canRoll ? onRoll : undefined}
          disabled=${!canRoll}
          aria-label=${canRoll ? 'Take a pyramid ticket and roll a die' : 'The dice pyramid'}
        >
          <${Raw} svg=${pyramid} />
        </button>
        <div class="huts">
          ${[0, 1, 2, 3, 4].map((i) => {
            const d = view.rolled[i];
            return html`<div class="hut" key=${i}>
              <${Raw} svg=${hutBack} class="hut-back" tag="div" />
              ${d && html`<${Die} key=${`${i}-${d.die}`} die=${d.die} value=${d.value} shown=${d.shown} popping=${d.popping} />`}
              <${Raw} svg=${hutFront} class="hut-front" tag="div" />
            </div>`;
          })}
        </div>
      </div>

      ${Object.entries(view.tiles).map(([space, t]) => {
        const owner = tileOwner(t.owner);
        return html`<div key=${`tile-${t.owner}`} class=${`board-tile ${flash === Number(space) ? 'flash' : ''}`} style=${cellStyle(Number(space))}>
          <${SpectatorTile} side=${t.side} character=${owner?.character} />
        </div>`;
      })}

      <div class="camel-layer">
        ${ALL_CAMELS.map(
          (camel) => html`<div
            key=${camel}
            class="camel"
            style=${`width:${CAMEL_W * 100}%`}
            ref=${(el) => el && (camelEls.current[camel] = el)}
          >
            <${Raw} svg=${sprites[camel].stand} class="sprite stand" tag="div" />
            <${Raw} svg=${sprites[camel].sit} class="sprite sit" tag="div" />
          </div>`
        )}
      </div>

      ${floats.map(
        (f) => html`<div key=${f.id} class=${`float-fx ${f.kind === 'boo' ? 'boo' : ''}`} style=${`left:${f.left}%;top:${f.top}%`}>${f.text}</div>`
      )}
    </div>
  </div>`;
}

export function viewFromState(s) {
  return { stacks: s.stacks, rolled: s.rolled, tiles: s.tiles };
}

export const ARROW_ICON = icon('arrowRight', 14);
