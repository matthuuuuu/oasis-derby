// Pop-up sheets: leg results, the grand finale, secret race bets,
// partnerships, and the in-game menu.
import { html, useEffect, useMemo, useState } from '../../vendor/preact-htm.js';
import { RACING_CAMELS } from '../engine/constants.js';
import { playerById } from '../engine/game.js';
import {
  Sheet,
  Icon,
  Avatar,
  Coins,
  MiniTicket,
  FinishCard,
  CamelSprite,
  CamelDot,
  Switch,
  ThemeDots,
  camelName,
  characterById,
  pyramidTicketIcon,
  Raw,
  Sticker,
  copyText,
  toast,
} from './common.js';
import { getPrefs, setPrefs } from './prefs.js';
import { sfx, confetti } from './fx.js';

const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '±0');
const cls = (n) => (n > 0 ? 'plus' : n < 0 ? 'minus' : '');

// ─── Leg results ─────────────────────────────────────────────────────────────

function ScoreRows({ result, state }) {
  const rows = [...result.rows].sort((a, b) => b.total - a.total);
  return rows.map((r) => {
    const p = playerById(state, r.player);
    const legItems = r.items.filter((i) => i.kind === 'leg');
    const pyr = r.items.filter((i) => i.kind === 'pyramid').length;
    return html`<div class="res-row" key=${r.player}>
      <${Avatar} character=${p.character} bot=${!!p.bot} />
      <div style="min-width:0">
        <b>${p.name}</b>
        <div class="items">
          ${legItems.map(
            (i) => html`<span class="res-item"><${MiniTicket} color=${i.color} value=${i.value} /><span class=${cls(i.reward)}>${signed(i.reward)}</span></span>`
          )}
          ${pyr > 0 &&
          html`<span class="res-item"><span style="width:18px;display:inline-block"><${Raw} svg=${pyramidTicketIcon} /></span>×${pyr} <span class="plus">+${pyr}</span></span>`}
          ${r.bonus &&
          html`<span class="res-item" title="Copied from partner"><${Sticker} name="partner" size=${16} /> ${playerById(state, r.bonus.from)?.name}'s
            ${r.bonus.kind === 'leg' ? html`<${MiniTicket} color=${r.bonus.color} value=${r.bonus.value} />` : 'pyramid ticket'}
            <span class="plus">+${r.bonus.reward}</span></span>`}
          ${!legItems.length && !pyr && !r.bonus && html`<span class="muted" style="font-size:13px;font-weight:700">no tickets this leg</span>`}
        </div>
      </div>
      <div class="res-total">
        <span class=${cls(r.total)}>${signed(r.total)}</span>
        <small>now ${r.after}${r.before + r.total < 0 ? ' (can’t go below 0)' : ''}</small>
      </div>
    </div>`;
  });
}

export function LegResultsSheet({ result, state, onClose, final = false }) {
  return html`<${Sheet} title=${`Leg ${result.leg} results`} subtitle="Betting tickets and pyramid tickets pay out" onClose=${onClose}>
    <div class="podium-mini">
      <div class="place">
        <${CamelSprite} camel=${result.first} />
        <span><${Sticker} name="medal1" size=${18} /> ${camelName(result.first)}</span>
      </div>
      <div class="place second">
        <${CamelSprite} camel=${result.second} />
        <span><${Sticker} name="medal2" size=${18} /> ${camelName(result.second)}</span>
      </div>
    </div>
    <${ScoreRows} result=${result} state=${state} />
    <div class="sheet-foot">
      <button class="btn block" onClick=${onClose}>${final ? 'See the final results' : `On to leg ${result.leg + 1}!`}</button>
    </div>
  </${Sheet}>`;
}

// ─── Finale ──────────────────────────────────────────────────────────────────

function RevealRow({ title, cards, state, target, delay }) {
  if (!cards.length) {
    return html`<div style="margin-top:14px">
      <h3 style="font-size:19px;color:var(--heading)">${title}</h3>
      <p class="muted" style="font-weight:700;margin-top:4px">Nobody bet on this pile.</p>
    </div>`;
  }
  return html`<div style="margin-top:14px">
    <h3 style="font-size:19px;color:var(--heading);display:flex;align-items:center;gap:8px">${title}
      <span class="muted" style="font-family:var(--font);font-size:13px;font-weight:800">(<${CamelDot} camel=${target} />${camelName(target)})</span></h3>
    <div class="reveal-list">
      ${cards.map((c, i) => {
        const p = playerById(state, c.player);
        return html`<div class="reveal-card" style=${`animation-delay:${delay + i * 0.35}s`} key=${i}>
          <${FinishCard} color=${c.color} character=${p.character} />
          <span class=${`amt ${cls(c.reward)}`}>${signed(c.reward)}</span>
          <span class="muted" style="font-size:12px;font-weight:800">${p.name}</span>
        </div>`;
      })}
    </div>
  </div>`;
}

export function FinaleSheet({ state, canRematch, onRematch, onLobby, onExit, onClose }) {
  const f = state.final;
  const lastLeg = state.legResults[state.legResults.length - 1];
  useEffect(() => {
    sfx.fanfare();
    confetti();
  }, []);
  const winners = f.winners.map((id) => playerById(state, id));
  const revealDelay = 0.4;
  return html`<${Sheet} wide title="The race is over!" onClose=${onClose}>
    <div class="finale-hero">
      <div class="winner-camel"><${CamelSprite} camel=${f.winner} shadow=${false} /></div>
      <h2 class="title-xl" style="font-size:34px;margin-top:6px">${camelName(f.winner)} wins!</h2>
      <p class="muted" style="font-weight:800;margin-top:6px">…and <${CamelDot} camel=${f.loser} />${camelName(f.loser)} trotted in last.</p>
    </div>

    <details style="margin-top:6px">
      <summary style="font-weight:900">Final leg scoring (leg ${lastLeg.leg})</summary>
      <${ScoreRows} result=${lastLeg} state=${state} />
    </details>

    <${RevealRow} title="Overall winner bets" cards=${f.winnerCards} state=${state} target=${f.winner} delay=${revealDelay} />
    <${RevealRow} title="Overall loser bets" cards=${f.loserCards} state=${state} target=${f.loser} delay=${revealDelay + f.winnerCards.length * 0.35 + 0.3} />

    <h3 style="font-size:22px;color:var(--heading);margin-top:18px">
      ${winners.length > 1 ? `A tie! ${winners.map((w) => w.name).join(' & ')} share the victory` : `${winners[0].name} is the richest rider!`}
    </h3>
    <div class="standings">
      ${f.standings.map((row, i) => {
        const p = playerById(state, row.player);
        const win = f.winners.includes(row.player);
        return html`<div class=${`standing ${win ? 'win' : ''}`} style=${`animation-delay:${1 + i * 0.12}s`} key=${row.player}>
          <span class="rank">${win ? html`<${Sticker} name="crown" size=${22} />` : i + 1}</span>
          <${Avatar} character=${p.character} bot=${!!p.bot} />
          <span class="grow">${p.name}<br /><span class="muted" style="font-size:13px">${characterById(p.character).title}</span></span>
          <${Coins} n=${row.coins} />
        </div>`;
      })}
    </div>

    <div class="sheet-foot" style="flex-wrap:wrap">
      ${canRematch && html`<button class="btn" onClick=${onRematch}><${Icon} name="refresh" /> Race again</button>`}
      ${onLobby && html`<button class="btn teal" onClick=${onLobby}><${Icon} name="users" /> Lobby</button>`}
      <button class="btn ghost" onClick=${onExit}><${Icon} name="logout" /> Home</button>
    </div>
  </${Sheet}>`;
}

// ─── Secret race bet ─────────────────────────────────────────────────────────

export function FinishBetSheet({ state, me, initialPile = 'winner', needsGate, onConfirm, onClose }) {
  const [revealed, setRevealed] = useState(!needsGate);
  const [pile, setPile] = useState(initialPile);
  const [color, setColor] = useState(null);
  const hand = me.finishCards || [];

  if (!revealed) {
    return html`<${Sheet} title="Secret bet" onClose=${onClose}>
      <div class="gate">
        <div class="peek"><${Sticker} name="peek" size=${64} /></div>
        <p style="font-weight:800;font-size:18px">Pass the device to <b>${me.name}</b>.</p>
        <p class="muted" style="font-weight:700">Everyone else — no peeking at the cards!</p>
        <button class="btn" onClick=${() => { sfx.tap(); setRevealed(true); }}>I'm ${me.name} — show my cards</button>
      </div>
    </${Sheet}>`;
  }

  // how many cards are already on each pile (earlier right bets pay more), and your own bets so far
  const sofar = (bets) => (bets.length ? `${bets.length} card${bets.length === 1 ? '' : 's'} on it so far` : 'No cards on it yet');
  const mine = [...state.winnerBets.map((b) => ({ ...b, pile: 'winner' })), ...state.loserBets.map((b) => ({ ...b, pile: 'loser' }))].filter(
    (b) => b.player === me.id && b.color
  );
  return html`<${Sheet} title="Bet on the whole race" subtitle="Your card stays face-down until the race ends" onClose=${onClose}>
    <div class="mode-grid">
      <button class="mode-card" aria-pressed=${pile === 'winner'} onClick=${() => setPile('winner')}>
        <h3><${Sticker} name="trophy" size=${24} /> Overall winner</h3><p>First across the finish</p><p class="pile-count">${sofar(state.winnerBets)}</p>
      </button>
      <button class="mode-card" aria-pressed=${pile === 'loser'} onClick=${() => setPile('loser')}>
        <h3><${Sticker} name="tortoise" size=${24} /> Overall loser</h3><p>Furthest behind at the end</p><p class="pile-count">${sofar(state.loserBets)}</p>
      </button>
    </div>
    ${mine.length > 0 &&
    html`<p class="muted" style="font-size:13px;font-weight:800;margin-top:10px">
      Your race bets so far: ${mine.map((b) => html`<span class="nowrap"><${CamelDot} camel=${b.color} />${camelName(b.color)} to ${b.pile === 'winner' ? 'win' : 'lose'} </span>`)}
    </p>`}
    <p class="muted" style="font-weight:800;margin:14px 0 4px;font-size:14px">Pick a card from your hand (one per camel):</p>
    <div class="card-row finish-hand">
      ${RACING_CAMELS.map((c) => {
        const inHand = hand.includes(c);
        return html`<${FinishCard}
          key=${c}
          color=${c}
          character=${me.character}
          used=${!inHand}
          disabled=${!inHand}
          selected=${color === c}
          onClick=${inHand ? () => { sfx.card(); setColor(c); } : undefined}
        />`;
      })}
    </div>
    <p class="muted" style="font-size:13px;font-weight:700;margin-top:8px">
      Correct cards pay <b>8, 5, 3, 2, 1…</b> in the order they were placed — so earlier is better. A wrong card costs <b>1</b>.
    </p>
    <div class="sheet-foot">
      <button class="btn ghost" onClick=${onClose}>Cancel</button>
      <button class="btn" disabled=${!color} onClick=${() => onConfirm({ type: 'finishBet', pile, color })}>
        ${color ? `Bet ${camelName(color)} to ${pile === 'winner' ? 'win' : 'lose'}` : 'Choose a card'}
      </button>
    </div>
  </${Sheet}>`;
}

// ─── Partnership ─────────────────────────────────────────────────────────────

export function PartnerSheet({ state, me, onConfirm, onClose }) {
  const [target, setTarget] = useState(null);
  const options = state.players.filter((q) => q.id !== me.id && !q.partner);
  return html`<${Sheet} title="Partner up for this leg" subtitle="Both of you copy one of the other's tickets at leg scoring" onClose=${onClose}>
    <div class="seat-list">
      ${options.map(
        (q) => html`<button class="seat" style=${target === q.id ? 'border-color:var(--accent-2);box-shadow:0 0 0 2px var(--accent-2)' : ''} onClick=${() => setTarget(q.id)}>
          <${Avatar} character=${q.character} bot=${!!q.bot} />
          <span class="who" style="text-align:left"><b>${q.name}</b>
            <span class="mini-tickets" style="margin-top:3px">${q.legTickets.length ? q.legTickets.map((t) => html`<${MiniTicket} color=${t.color} value=${t.value} />`) : html`<span>no tickets yet</span>`}
            ${q.pyramidTickets ? html`<span>+ ${q.pyramidTickets} pyramid</span>` : ''}</span>
          </span>
        </button>`
      )}
    </div>
    <p class="muted" style="font-size:13px;font-weight:700;margin-top:10px">They can't refuse! At the end of the leg each of you adds the reward of the partner's best ticket to your own. Partnerships end after leg scoring.</p>
    <div class="sheet-foot">
      <button class="btn ghost" onClick=${onClose}>Cancel</button>
      <button class="btn" disabled=${!target} onClick=${() => onConfirm({ type: 'partner', target })}>Shake hands <${Sticker} name="partner" size=${22} /></button>
    </div>
  </${Sheet}>`;
}

// ─── Menu ────────────────────────────────────────────────────────────────────

export function MenuSheet({ session, onClose, onRules, onLeave }) {
  const [prefs, setLocal] = useState(getPrefs());
  const set = (patch) => {
    setPrefs(patch);
    setLocal(getPrefs());
  };
  const code = session.lobby?.code;
  const link = code ? `${location.origin}${location.pathname}?room=${code}` : '';
  return html`<${Sheet} title="Menu" onClose=${onClose}>
    ${code &&
    html`<div class="box" style="margin-bottom:12px">
      <div class="row">
        <div class="grow"><b>Room ${code}</b><br /><span class="muted" style="font-size:13px;font-weight:700">Friends can join from their phones</span></div>
        <button class="btn small teal" onClick=${async () => (await copyText(link)) && toast('Link copied!', 'good')}><${Icon} name="link" size=${16} /> Copy link</button>
      </div>
    </div>`}
    <div class="switch-row"><span class="grow">Color theme</span><${ThemeDots} /></div>
    <div class="switch-row">
      <span class="grow">Sound & vibration</span>
      <${Switch} checked=${prefs.sound} label="Sound" onChange=${(v) => set({ sound: v })} />
    </div>
    <div class="switch-row">
      <span class="grow"><${Sticker} name="crystalBall" size=${20} /> Fortune teller odds<small>Shows each camel's chances (great for learning)</small></span>
      <${Switch} checked=${prefs.odds} label="Show odds" onChange=${(v) => set({ odds: v })} />
    </div>
    <div class="switch-row">
      <span class="grow">Speedy camels<small>Faster animations</small></span>
      <${Switch} checked=${prefs.fast} label="Fast animations" onChange=${(v) => set({ fast: v })} />
    </div>
    <div class="sheet-foot" style="flex-wrap:wrap">
      <button class="btn teal" onClick=${onRules}><${Icon} name="book" /> How to play</button>
      <button class="btn danger" onClick=${onLeave}><${Icon} name="logout" /> Leave race</button>
    </div>
  </${Sheet}>`;
}

export function ConfirmSheet({ title, text, yes = 'Yes', no = 'Cancel', danger = false, onYes, onNo }) {
  return html`<${Sheet} title=${title} onClose=${onNo}>
    <p style="font-weight:700">${text}</p>
    <div class="sheet-foot">
      <button class="btn ghost" onClick=${onNo}>${no}</button>
      <button class=${`btn ${danger ? 'danger' : ''}`} onClick=${onYes}>${yes}</button>
    </div>
  </${Sheet}>`;
}

export function EndedSheet({ message, onHome }) {
  return html`<${Sheet} title="Room closed" dismissable=${false}>
    <p style="font-weight:700">${message}</p>
    <div class="sheet-foot"><button class="btn block" onClick=${onHome}>Back to the oasis</button></div>
  </${Sheet}>`;
}
