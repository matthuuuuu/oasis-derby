// Everything beside (or under) the board: whose turn it is, the betting
// tickets, the action buttons, the race-bet piles, the players and the log.
import { html, useMemo, useState } from '../../vendor/preact-htm.js';
import { RACING_CAMELS, DICE_PER_LEG } from '../engine/constants.js';
import { currentPlayer, tileSpaceOf, playerById } from '../engine/game.js';
import { simulateLeg, simulateRace } from '../ai/bot.js';
import { ACTION_ICONS, pyramidTicketSVG } from '../art/tokens.js';
import {
  Raw,
  Icon,
  Avatar,
  Coins,
  Ticket,
  MiniTicket,
  FinishCard,
  CamelDot,
  PharaohMarker,
  camelName,
  characterById,
} from './common.js';
import { sfx } from './fx.js';

const actionIcon = Object.fromEntries(Object.entries(ACTION_ICONS).map(([k, f]) => [k, f()]));
const pyrTicket = pyramidTicketSVG();

export const nameOf = (s, id) => playerById(s, id)?.name || 'Someone';

/** CSS class for an element another player is "clicking": same look as a mouse hover, then a press. */
export const pickClass = (phase) => (phase === 'press' ? 'bot-press' : phase ? 'bot-hover' : '');

/** What another player is doing right now, in words, for the turn banner. */
function pickText(pick, state) {
  switch (pick.kind) {
    case 'legBet':
      return `takes the ${camelName(pick.color)} ${pick.value} ticket`;
    case 'roll':
      return 'rolls the pyramid';
    case 'tile':
      return `puts a ${pick.side === 'cheer' ? 'cheering' : 'booing'} tile on space ${pick.space}`;
    case 'finishBet':
      return `bets on the overall ${pick.pile}`;
    case 'partner':
      return `partners up with ${nameOf(state, pick.target)}`;
    default:
      return '';
  }
}

// ─── Turn banner ─────────────────────────────────────────────────────────────

export function TurnBanner({ state, mine, isBot, localMulti, pick }) {
  if (state.status === 'finished') {
    return html`<div class="turn-banner">
      <span style="font-size:34px">🏆</span>
      <div class="grow"><h2>The race is over!</h2><p>${camelName(state.final.winner)} won the race.</p></div>
    </div>`;
  }
  const p = currentPlayer(state);
  const ch = characterById(p.character);
  let title = `${p.name}'s turn`;
  let sub = `${ch.name}, ${ch.title.toLowerCase()}`;
  if (mine) {
    title = localMulti ? `${p.name}, your move!` : 'Your move!';
    sub = 'Pick one action below';
  } else if (isBot) {
    sub = 'is thinking…';
  }
  const doing = pick && pick.player === p.id ? pickText(pick, state) : '';
  return html`<div class=${`turn-banner ${mine ? 'mine' : ''}`}>
    <${Avatar} character=${p.character} size="lg" bot=${!!p.bot} />
    <div class="grow">
      <h2>${title}</h2>
      <p>
        ${doing
          ? html`<span class="pick-say">${p.name} ${doing}</span>`
          : isBot && !mine
            ? html`<span class="thinking-dots"><span></span><span></span><span></span></span> thinking`
            : sub}
      </p>
    </div>
    <${Coins} n=${p.coins} />
  </div>`;
}

// ─── Leg betting tickets ─────────────────────────────────────────────────────

export function TicketBar({ state, canAct, selected, onPick, pick }) {
  return html`<div class=${`box ${canAct ? 'box-live' : ''}`}>
    <div class="box-title">
      <span class="grow">${canAct ? 'Take a leg ticket…' : 'Leg tickets'}</span>
      <small>Back the camel that leads when this leg ends</small>
    </div>
    <div class="ticket-bar">
      ${RACING_CAMELS.map((c) => {
        const stack = state.legStacks[c];
        return html`<${Ticket}
          key=${c}
          color=${c}
          value=${stack[0]}
          left=${stack.length}
          disabled=${!canAct}
          selected=${selected === c}
          pick=${pick?.kind === 'legBet' && pick.color === c ? pick.phase : null}
          onClick=${canAct ? () => onPick(c) : undefined}
        />`;
      })}
    </div>
  </div>`;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * The action buttons. On your turn they're live; on everyone else's turn they stay on screen
 * (not clickable) so you can watch which one a bot — or a friend online — "clicks".
 * `me` is whoever's turn it is.
 */
export function ActionBox({ state, me, mine, canAct, pending, pick, setPending, act, openFinish, openPartner }) {
  if (state.status !== 'playing') return null;

  // confirmation bars for the two-step actions (only on your own turn)
  if (canAct && pending?.kind === 'legBet') {
    const value = state.legStacks[pending.color][0];
    return html`<div class="box action-box">
      <div class="hint-bar">
        <${Ticket} color=${pending.color} value=${value} compact />
        <span class="grow">Take the <b>${camelName(pending.color)} ${value}</b> ticket? It pays ${value} if ${camelName(pending.color)} leads this leg, +1 if 2nd, −1 otherwise.</span>
      </div>
      <div class="sheet-foot">
        <button class="btn ghost" onClick=${() => setPending(null)}>Cancel</button>
        <button class="btn" onClick=${() => act({ type: 'legBet', color: pending.color })}>Take it</button>
      </div>
    </div>`;
  }
  if (canAct && pending?.kind === 'roll') {
    return html`<div class="box action-box">
      <div class="hint-bar">
        <span style="width:40px;flex:none"><${Raw} svg=${pyrTicket} /></span>
        <span class="grow">Take a pyramid ticket (worth <b>+1</b> at the end of the leg) and shake out a die.</span>
      </div>
      <div class="sheet-foot">
        <button class="btn ghost" onClick=${() => setPending(null)}>Cancel</button>
        <button class="btn" onClick=${() => act({ type: 'roll' })}>Shake it!</button>
      </div>
    </div>`;
  }
  if (canAct && pending?.kind === 'tile') {
    const from = tileSpaceOf(state, me.id);
    if (!pending.space) {
      return html`<div class="box action-box">
        <div class="hint-bar">
          <span style="font-size:24px">👆</span>
          <span class="grow">Tap a glowing space on the track for your spectator tile${from ? ` (it moves from space ${from})` : ''}.</span>
        </div>
        <div class="sheet-foot"><button class="btn ghost" onClick=${() => setPending(null)}>Cancel</button></div>
      </div>`;
    }
    return html`<div class="box action-box">
      <div class="box-title"><span class="grow">Space ${pending.space}: cheer or boo?</span></div>
      <div class="piles" style="margin-top:0">
        <button class="pile" onClick=${() => act({ type: 'tile', space: pending.space, side: 'cheer' })}>
          <span style="font-size:28px">📣</span>
          <span><b>Cheer +1</b><span>Camels landing here jump 1 forward</span></span>
        </button>
        <button class="pile" onClick=${() => act({ type: 'tile', space: pending.space, side: 'boo' })}>
          <span style="font-size:28px">👎</span>
          <span><b>Boo −1</b><span>Camels landing here slip 1 back, underneath</span></span>
        </button>
      </div>
      <p class="muted" style="font-size:13px;font-weight:700;margin-top:10px">Either way, you earn 1 coin every time a camel lands on it.</p>
      <div class="sheet-foot"><button class="btn ghost" onClick=${() => setPending({ kind: 'tile' })}>Pick another space</button></div>
    </div>`;
  }

  const partnerOk = state.partnerships && !me.partner && state.players.some((q) => q.id !== me.id && !q.partner);
  const tileMoved = tileSpaceOf(state, me.id);
  const cards = me.finishCards?.length ?? me.handCount ?? 0;
  const watching = !canAct;
  const cls = (kind, extra = '') => `action ${extra} ${pick?.kind === kind ? pickClass(pick.phase) : ''}`;
  const click = (fn) => (watching ? undefined : () => { sfx.tap(); fn(); });
  return html`<div class=${`box action-box ${watching ? 'watching' : ''}`}>
    <div class="box-title">
      <span class="grow">${mine ? '…or do something else' : `${me.name} is choosing…`}</span>
      <small>One action per turn</small>
    </div>
    <div class=${`actions ${state.partnerships ? 'five' : ''}`}>
      <button class=${cls('roll', 'primary')} disabled=${watching} onClick=${click(() => setPending({ kind: 'roll' }))}>
        <${Raw} svg=${actionIcon.roll} class="ico" />
        <b>Roll the pyramid</b><small>+1 coin at leg end</small>
      </button>
      <button class=${cls('tile')} disabled=${watching} onClick=${click(() => setPending({ kind: 'tile' }))}>
        <${Raw} svg=${actionIcon.tile} class="ico" />
        <b>${tileMoved ? (mine ? 'Move your tile' : 'Move their tile') : 'Spectator tile'}</b><small>Cheer or boo a space</small>
      </button>
      <button class=${cls('finishBet')} disabled=${watching || !cards} onClick=${click(() => openFinish())}>
        <${Raw} svg=${actionIcon.finishBet} class="ico" />
        <b>Race bet</b><small>${cards ? `Overall winner / loser` : 'No cards left'}</small>
      </button>
      ${state.partnerships &&
      html`<button class=${cls('partner')} disabled=${watching || !partnerOk} onClick=${click(() => openPartner())}>
        <${Raw} svg=${actionIcon.partner} class="ico" />
        <b>Partner up</b><small>${me.partner ? `With ${nameOf(state, me.partner)}` : 'Share a ticket at leg end'}</small>
      </button>`}
    </div>
  </div>`;
}

// ─── Race bet piles ──────────────────────────────────────────────────────────

export function RaceBets({ state, canAct, openFinish, myId, pick }) {
  const picked = (key) => (pick?.kind === 'finishBet' && pick.pile === key ? pickClass(pick.phase) : '');
  const pile = (key, label, emoji, bets) => html`<button class=${`pile ${picked(key)}`} disabled=${!canAct} onClick=${canAct ? () => openFinish(key) : undefined}>
    <span class="stack">
      ${bets.length
        ? bets.slice(-3).map((b, i) => html`<${FinishCard} back style=${`left:${i * 2}px;top:${i * -2 + 4}px`} />`)
        : html`<span style="font-size:26px;display:grid;place-items:center;height:100%">${emoji}</span>`}
    </span>
    <span style="min-width:0">
      <b>${label}</b>
      <span>${bets.length ? `${bets.length} card${bets.length === 1 ? '' : 's'}` : 'No cards yet'}</span>
      <span class="placers">${bets.slice(-5).map((b) => html`<${Avatar} character=${playerById(state, b.player)?.character} size="xs" />`)}</span>
    </span>
  </button>`;
  const me = playerById(state, myId);
  const mine = [...state.winnerBets.map((b) => ({ ...b, pile: 'winner' })), ...state.loserBets.map((b) => ({ ...b, pile: 'loser' }))].filter(
    (b) => b.player === myId && b.color
  );
  return html`<div class="box">
    <div class="box-title"><span class="grow">Race bets</span><small>Pays 8 · 5 · 3 · 2 · 1 — first right bets earn most</small></div>
    <div class="piles" style="margin-top:0">
      ${pile('winner', 'Overall winner', '🏆', state.winnerBets)}
      ${pile('loser', 'Overall loser', '🐢', state.loserBets)}
    </div>
    ${me && mine.length > 0 &&
    html`<p class="muted" style="font-size:13px;font-weight:800;margin-top:10px">
      Your secret bets: ${mine.map((b) => html`<span class="nowrap"><${CamelDot} camel=${b.color} />${camelName(b.color)} to ${b.pile === 'winner' ? 'win' : 'lose'} </span>`)}
    </p>`}
  </div>`;
}

// ─── Players ─────────────────────────────────────────────────────────────────

export function PlayerList({ state, lobby, myIds, onOpen }) {
  const seat = (id) => lobby?.seats?.find((s) => s.id === id);
  return html`<div class="box">
    <div class="box-title"><span class="grow">Riders</span><small>${state.players.length} betting</small></div>
    <div class="players">
      ${state.players.map((p, i) => {
        const tile = tileSpaceOf(state, p.id);
        const t = tile ? state.tiles[tile] : null;
        const st = seat(p.id);
        const offline = st && !st.connected;
        const cards = p.finishCards ? p.finishCards.length : p.handCount;
        return html`<button class=${`pcard ${state.status === 'playing' && state.turn === i ? 'turn' : ''}`} onClick=${() => onOpen?.(p.id)}>
          <${Avatar} character=${p.character} bot=${!!p.bot || st?.takeover} />
          <span class="name">
            ${p.name}${myIds.includes(p.id) && myIds.length === 1 ? ' (you)' : ''}
            ${state.startPlayer === i && html`<span class="marker" title="Starting player"><${PharaohMarker} /></span>`}
            ${offline && html`<span class="offline" title="Offline">● offline</span>`}
          </span>
          <${Coins} n=${p.coins} small />
          <span class="meta">
            ${p.legTickets.length > 0 && html`<span class="mini-tickets">${p.legTickets.map((t) => html`<${MiniTicket} color=${t.color} value=${t.value} />`)}</span>`}
            ${p.pyramidTickets > 0 && html`<span class="pill" title="Pyramid tickets"><${Raw} svg=${pyrTicket} />×${p.pyramidTickets}</span>`}
            ${t && html`<span class="pill" title="Spectator tile"><${Raw} svg=${actionIcon.tile} /><b class=${t.side === 'cheer' ? 'plus' : 'minus'}>${t.side === 'cheer' ? '+1' : '−1'}</b> on ${tile}</span>`}
            <span class="pill" title="Race-bet cards left in hand"><${Raw} svg=${actionIcon.finishBet} />${cards} left</span>
            ${p.partner && html`<span class="pill" title="Betting partner"><${Raw} svg=${actionIcon.partner} />${nameOf(state, p.partner)}</span>`}
          </span>
        </button>`;
      })}
    </div>
  </div>`;
}

// ─── Odds (optional "fortune teller") ────────────────────────────────────────

export function OddsBox({ state }) {
  const odds = useMemo(() => {
    if (state.status !== 'playing') return null;
    return { leg: simulateLeg(state, 1500), race: simulateRace(state, 500) };
  }, [state.seq, state.status]);
  if (!odds) return null;
  return html`<div class="box">
    <div class="box-title"><span class="grow">🔮 Fortune teller</span><small>chance to lead this leg · win the race</small></div>
    <div class="odds">
      ${RACING_CAMELS.map(
        (c) => html`<div>
          <div class="bar"><i style=${`height:${Math.round(odds.leg.first[c] * 100)}%;--c:var(--${c})`}></i></div>
          <div class="pct">${Math.round(odds.leg.first[c] * 100)}%</div>
          <div class="muted">🏆 ${Math.round(odds.race.win[c] * 100)}%</div>
        </div>`
      )}
    </div>
  </div>`;
}

// ─── Log ─────────────────────────────────────────────────────────────────────

/** `secretOk(playerId)` says whether this screen may show that player's secret card colours. */
export function describe(e, s, secretOk = () => false) {
  const n = (id) => html`<b>${nameOf(s, id)}</b>`;
  const cam = (c) => html`<span class="nowrap"><${CamelDot} camel=${c} /><b>${camelName(c)}</b></span>`;
  switch (e.t) {
    case 'start':
      return html`${n(e.player)} got the Pharaoh's mask and starts the race!`;
    case 'legBet':
      return html`${n(e.player)} took the ${cam(e.color)} <b>${e.value}</b> ticket.`;
    case 'placeTile':
      return html`${n(e.player)} ${e.from ? 'moved their' : 'placed a'} ${e.side === 'cheer' ? 'cheering 📣' : 'booing 👎'} tile ${e.from ? `from ${e.from} ` : ''}to space <b>${e.space}</b>.`;
    case 'roll':
      if (e.die === 'grey') {
        const why = e.reason === 'carrying' ? ' (it carries racers, so it must go)' : e.reason === 'stacked' ? ' (it sits right on the other one)' : '';
        return html`${n(e.player)} rolled the grey die: <b>${e.value}</b> ${e.shown} → ${cam(e.camel)} runs backwards${why}.`;
      }
      return html`${n(e.player)} rolled ${cam(e.die)} <b>${e.value}</b>.`;
    case 'move': {
      const riders = e.unit.slice(1);
      if (e.to > 16 || e.to < 1) return html`${cam(e.camel)} crossed the finish line!`;
      return html`${cam(e.camel)} ${e.dir > 0 ? 'hops' : 'staggers back'} to space <b>${e.to}</b>${riders.length ? html` carrying ${riders.map((c, i) => html`${i ? ', ' : ''}${cam(c)}`)}` : ''}.`;
    }
    case 'tileEffect':
      return html`${n(e.owner)}'s crowd ${e.side === 'cheer' ? 'cheered 📣' : 'booed 👎'} ${cam(e.camel)} to space ${e.to}! <span class="plus">+1</span> for ${n(e.owner)}.`;
    case 'finishBet':
      return html`${n(e.player)} placed a secret card on the <b>${e.pile === 'winner' ? 'overall winner' : 'overall loser'}</b> pile${
        e.color && (s.status === 'finished' || secretOk(e.player)) ? html` (${cam(e.color)})` : ''
      }.`;
    case 'partner':
      return html`${n(e.player)} and ${n(e.target)} are betting partners this leg 🤝`;
    case 'legEnd':
      return null;
    case 'newLeg':
      return null;
    case 'gameEnd':
      return html`🏆 The race is over!`;
    default:
      return null;
  }
}

export function LogBox({ state, myIds = [] }) {
  const [open, setOpen] = useState(true);
  // Only reveal your own secret bets, and only when you're alone on this device.
  const secretOk = (id) => myIds.length === 1 && myIds[0] === id;
  const items = useMemo(() => {
    const out = [];
    const list = state.log.slice(-60);
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      if (e.t === 'newLeg') {
        out.push({ key: `leg${e.leg}-${i}`, leg: e.leg });
        continue;
      }
      if (e.t === 'legEnd') {
        const r = state.legResults.find((x) => x.leg === e.leg);
        if (r) out.push({ key: `end${e.leg}-${i}`, text: html`Leg ${e.leg} ends: ${html`<${CamelDot} camel=${r.first} />`}<b>${camelName(r.first)}</b> leads, <${CamelDot} camel=${r.second} /><b>${camelName(r.second)}</b> is 2nd.`, who: null });
        continue;
      }
      const text = describe(e, state, secretOk);
      if (text) out.push({ key: `${e.seq}-${i}`, text, who: e.player || e.owner });
    }
    return out;
  }, [state.seq, state.log.length, state.status, myIds.join()]);
  return html`<div class="box">
    <button class="box-title" style="width:100%" onClick=${() => setOpen(!open)} aria-expanded=${open}>
      <span class="grow" style="text-align:left">Race log</span>
      <${Icon} name=${open ? 'chevronUp' : 'chevronDown'} />
    </button>
    ${open &&
    html`<div class="log">
      ${items.map((it) =>
        it.leg
          ? html`<div class="log-item leg" key=${it.key}>— Leg ${it.leg} —</div>`
          : html`<div class="log-item" key=${it.key}>
              ${it.who ? html`<${Avatar} character=${playerById(state, it.who)?.character} size="xs" />` : html`<span style="width:22px"></span>`}
              <span class="txt">${it.text}</span>
            </div>`
      )}
    </div>`}
  </div>`;
}

export function diceLeftIndicator(state) {
  return html`<span class="dice-left" title=${`${DICE_PER_LEG - state.rolled.length} dice left this leg`}>
    ${Array.from({ length: DICE_PER_LEG }, (_, i) => html`<i class=${i < state.rolled.length ? 'used' : ''}></i>`)}
  </span>`;
}
