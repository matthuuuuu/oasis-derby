// "How to play": the rules in two minutes, with pictures.
import { html, useState } from '../../vendor/preact-htm.js';
import { ACTION_ICONS, pyramidSVG, loopArrowSVG } from '../art/tokens.js';
import { Sheet, Raw, CamelSprite, Ticket, Die, SpectatorTile, Icon, Sticker } from './common.js';
import { pileSlot, STACK_STYLE } from './stacking.js';
import { isCrazy } from '../engine/constants.js';

const icons = Object.fromEntries(Object.entries(ACTION_ICONS).map(([k, f]) => [k, f()]));
const crazyPyramid = pyramidSVG('crazy');
const loop = loopArrowSVG();

const flip = 'transform:scaleX(-1);width:86px';

/**
 * Camels piled up exactly the way the board piles them (same stacking code). In the picture the
 * race runs to the right: coloured camels face right, the crazy camels (white, black) face left.
 * Sizes are multiples of --w (one camel's width), so the picture shrinks to fit small phones.
 */
function Pile({ camels }) {
  const h = 100 / 120; // a camel's height, in camel widths
  const ruleLeft = (i) => isCrazy(camels[i]);
  const slots = camels.map((_, i) => pileSlot(STACK_STYLE, i, camels.length, ruleLeft, { camW: 1, camH: h, room: 99, forwardLeft: false }));
  const minDx = Math.min(0, ...slots.map((s) => s.dx));
  const width = 1 + Math.max(0, ...slots.map((s) => s.dx)) - minDx;
  const height = h + Math.max(...slots.map((s) => s.rise));
  const w = (n) => `calc(var(--w) * ${n.toFixed(3)})`;
  return html`<div class="hc-pile" style=${`width:${w(width)};height:${w(height)}`}>
    ${camels.map(
      (c, i) => html`<div class=${`hc ${slots[i].faceLeft ? 'flip' : ''}`} style=${`left:${w(slots[i].dx - minDx)};bottom:${w(slots[i].rise)};z-index:${i + 1}`}>
        <${CamelSprite} camel=${c} pose=${slots[i].pose} />
      </div>`
    )}
  </div>`;
}

const PAGES = [
  {
    title: 'The craziest camel race',
    art: () => html`<div class="howto-art howto-camels">
      <${Pile} camels=${['blue']} />
      <${Pile} camels=${['red', 'purple', 'yellow']} />
      <${Pile} camels=${['green', 'white']} />
      <${Pile} camels=${['black']} />
    </div>`,
    points: [
      html`Five <b>racing camels</b> run <b>clockwise</b> around the oasis. Nobody owns a camel: you <b>bet</b> on them.`,
      html`Two <b>crazy camels</b> (black and white) run the wrong way. You can't bet on them, but they can carry racers backwards!`,
      html`Camels on the same space <b>stack up</b>. A moving camel carries everyone on its back, and the camel on <b>top</b> counts as ahead.`,
      html`The richest rider when the race ends wins.`,
    ],
  },
  {
    title: 'On your turn, do ONE thing',
    art: () => html`<div class="howto-art" style="gap:14px;align-items:center">
      ${['legBet', 'tile', 'roll', 'finishBet', 'partner'].map((k) => html`<span style="width:min(58px, 13vw)"><${Raw} svg=${icons[k]} /></span>`)}
    </div>`,
    points: [
      html`<b>1. Take a leg ticket</b> for the camel you think will lead this leg. The first pays 5, then 3, 2, 2, so be early!`,
      html`<b>2. Place your spectator tile</b> on an empty space: cheer +1 or boo −1. Earn 1 coin each time a camel lands on it during this leg.`,
      html`<b>3. Roll the pyramid</b>: a random die pops out and a camel moves 1–3 spaces. You get a pyramid ticket worth 1 coin.`,
      html`<b>4. Bet on the whole race</b>: secretly pick the overall <b>winner</b> or <b>loser</b>.`,
      html`<b>5. Partner up</b> (6+ players only): choose a partner. At the end of the leg, you each also collect what the other's best ticket pays.`,
    ],
  },
  {
    title: 'Legs and payouts',
    art: () => html`<div class="howto-art" style="gap:10px;align-items:center">
      <div class="howto-ticket"><${Ticket} color="blue" value=${5} /></div>
      <div class="howto-ticket"><${Ticket} color="red" value=${3} /></div>
      <div class="howto-ticket"><${Ticket} color="green" value=${2} /></div>
    </div>`,
    points: [
      html`A <b>leg</b> ends as soon as 5 of the 6 dice have left the pyramid.`,
      html`Tickets on the <b>leading</b> camel pay what's printed (5, 3 or 2). The <b>2nd</b> camel pays 1. Any other camel <b>costs 1</b>.`,
      html`Each pyramid ticket pays 1. Then everything resets and the next leg begins.`,
      html`Nobody can drop below 0 coins. If you can't pay, you're let off.`,
    ],
  },
  {
    title: 'Crowds and crazy camels',
    art: () => html`<div class="howto-art" style="gap:12px;align-items:center">
      <div style="width:74px"><${SpectatorTile} side="cheer" character="merchant" /></div>
      <div style="width:74px"><${SpectatorTile} side="boo" character="mystic" /></div>
      <div style=${flip}><${CamelSprite} camel="white" /></div>
      <${Die} die="grey" value=${2} shown="black" style="width:42px" />
    </div>`,
    points: [
      html`Camels landing on a <b>cheering</b> tile jump 1 more space (on top). On a <b>booing</b> tile they slip back 1 space and slide <b>underneath</b>.`,
      html`The <b>gray die</b> shows a black or white number, and that crazy camel moves backwards.`,
      html`But if only one crazy camel is carrying racing camels, <b>that one</b> moves. And if one crazy camel sits right on the other, the <b>top</b> one moves.`,
    ],
  },
  {
    title: 'The finish line',
    art: () => html`<div class="howto-art even-3">
      <${Sticker} name="trophy" size=${64} />
      <span style="transform:translateX(-4px)"><${CamelSprite} camel="green" /></span>
      <${Sticker} name="flag" size=${64} />
    </div>`,
    points: [
      html`The moment any camel crosses the finish line, the race ends. There's one last leg scoring.`,
      html`Then the race bets are revealed <b>in the order they were placed</b>. Correct cards pay <b>8, 5, 3, 2</b>, then 1 each. Wrong cards cost 1.`,
      html`Count your coins: the richest rider wins! A tie means a shared victory.`,
    ],
  },
  {
    title: 'Crazier Camels mode',
    art: () => html`<div class="howto-art" style="gap:16px;align-items:center">
      <div class="crazy-pyramid howto-pyr"><${Raw} svg=${crazyPyramid} class="pyr" tag="div" /><${Die} die="grey" value=${3} shown="black" /></div>
      <div style="width:58px"><${Raw} svg=${loop} /></div>
      <div style=${flip}><${CamelSprite} camel="black" /></div>
    </div>`,
    points: [
      html`Everything is the same as the classic race, except for the crazy camels.`,
      html`The <b>gray die</b> isn't in the big pyramid. It has its own little <b>black-and-white pyramid</b>, and is rolled <b>right after every colored die</b>, so a crazy camel moves on <b>every</b> pyramid roll.`,
      html`A leg still ends after 5 rolls, so this time <b>all five</b> colored dice come out.`,
      html`Crazy camels never leave the board: passing space <b>1</b> they <b>loop around to 16</b> and keep going. Any racing camels they carry that far <b>hop off on space 1</b>.`,
    ],
  },
];

export function HowToSheet({ onClose, startPage = 0 }) {
  const [page, setPage] = useState(startPage);
  const last = page === PAGES.length - 1;
  // All six pages are drawn in the same spot (only the current one visible), so the sheet is always
  // as tall as the longest page: the same size on every page, with Back / Next never moving.
  return html`<${Sheet} title="How to play" subtitle=${`${page + 1} of ${PAGES.length}`} onClose=${onClose} class="howto-sheet">
    <div class="howto-pages">
      ${PAGES.map(
        (p, i) => html`<div class=${`howto-page ${i === page ? 'on' : ''}`} aria-hidden=${i === page ? undefined : 'true'}>
          ${p.art()}
          <h3>${p.title}</h3>
          <ul>${p.points.map((t) => html`<li>${t}</li>`)}</ul>
        </div>`
      )}
    </div>
    <div class="dots-nav">${PAGES.map((_, i) => html`<i class=${i === page ? 'on' : ''}></i>`)}</div>
    <div class="sheet-foot">
      <button class="btn ghost small" disabled=${page === 0} onClick=${() => setPage(page - 1)}><${Icon} name="arrowLeft" /> Back</button>
      <button class="btn small" onClick=${() => (last ? onClose() : setPage(page + 1))}>${last ? "Let's race!" : 'Next'} ${!last && html`<${Icon} name="arrowRight" />`}</button>
    </div>
  </${Sheet}>`;
}
