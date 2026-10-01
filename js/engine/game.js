// ─────────────────────────────────────────────────────────────────────────────
//  Oasis Derby rules engine — follows the Camel Up (2nd edition) rulebook.
//
//  Everything here is pure data in, data out: no screen, no network.
//  The UI, the bots and the online host all call the same functions, so the
//  rules only live in one place.
//
//    createGame(options)                → state
//    applyAction(state, playerId, act)  → { state, events }   (never mutates input)
//    validateAction(state, playerId, act) → null | "reason it's not allowed"
//    ranking(state)                     → racing camels, leader first
//    viewFor(state, playerId)           → state with other players' secrets hidden
//
//  Actions a player can take on their turn (rulebook p.3–6):
//    { type: 'legBet', color }              1. take the top betting ticket of a colour
//    { type: 'tile', space, side }          2. place / move your spectator tile ('cheer' | 'boo')
//    { type: 'roll' }                       3. take a pyramid ticket and reveal a die
//    { type: 'finishBet', pile, color }     4. overall winner/loser card ('winner' | 'loser')
//    { type: 'partner', target }            5. betting partnership (6+ players only)
//
//  Modes (state.mode): 'classic' (the rulebook) or 'crazier' ("Crazier Camels"):
//    • the grey die is NOT in the pyramid; it is rolled right after every coloured
//      die, so a crazy camel moves on every pyramid roll;
//    • a crazy camel passing space 1 loops round to 16 and keeps going; racing
//      camels it was carrying are dropped off on space 1.
// ─────────────────────────────────────────────────────────────────────────────

import {
  RACING_CAMELS,
  DICE_PER_LEG,
  PYRAMID_TICKETS,
  TRACK_SPACES,
  LEG_TICKET_VALUES,
  FINISH_PAYOUTS,
  FINISH_PAYOUT_LATE,
  FINISH_PENALTY,
  STARTING_COINS,
  MIN_PLAYERS,
  MAX_PLAYERS,
  PARTNERSHIP_MIN_PLAYERS,
  isRacing,
  isCrazy,
  pyramidDice,
} from './constants.js';
import { hashSeed, randomSeed, rand, rollDie, shuffle } from './rng.js';

const LOG_LIMIT = 120;

export class RuleError extends Error {}

// ─── Setting up ──────────────────────────────────────────────────────────────

export function freshLegStacks() {
  return Object.fromEntries(RACING_CAMELS.map((c) => [c, [...LEG_TICKET_VALUES]]));
}

/**
 * players: [{ id, name, character, bot? }] in seating (clockwise) order.
 * seed: optional, makes the game reproducible.
 * startPlayer: optional index; otherwise the "youngest player" is picked at random.
 * mode: 'classic' (default) or 'crazier'.
 */
export function createGame({ players, seed, startPlayer, mode } = {}) {
  if (!Array.isArray(players) || players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    throw new RuleError(`A race needs ${MIN_PLAYERS}–${MAX_PLAYERS} players.`);
  }
  const ids = new Set(players.map((p) => p.id));
  if (ids.size !== players.length) throw new RuleError('Player ids must be unique.');

  const s = {
    v: 1,
    mode: mode === 'crazier' ? 'crazier' : 'classic',
    status: 'playing',
    rng: hashSeed(seed ?? randomSeed()),
    seq: 0,
    leg: 1,
    turn: 0,
    startPlayer: 0,
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      character: p.character,
      bot: p.bot || null,
      coins: STARTING_COINS,
      legTickets: [],
      pyramidTickets: 0,
      finishCards: [...RACING_CAMELS],
      partner: null,
    })),
    partnerships: players.length >= PARTNERSHIP_MIN_PLAYERS,
    stacks: {},
    tiles: {},
    legStacks: freshLegStacks(),
    pyramidLeft: PYRAMID_TICKETS,
    diceLeft: pyramidDice(mode),
    rolled: [],
    winnerBets: [],
    loserBets: [],
    legResults: [],
    final: null,
    setup: null,
    log: [],
  };

  // Setup step 7: roll the 5 racing dice once; each camel goes to space 1, 2 or 3.
  // Camels landing on the same space are stacked in the order they come out.
  const racing = [];
  for (const camel of shuffle(s, RACING_CAMELS)) {
    const value = rollDie(s);
    putOnTop(s.stacks, value, [camel]);
    racing.push({ camel, value, space: value });
  }
  // Setup step 8: roll the grey die for each crazy camel: 1 → 16, 2 → 15, 3 → 14.
  // A second crazy camel on the same space goes on top of the first.
  const first = rand(s) < 0.5 ? 'white' : 'black';
  const crazy = [];
  for (const camel of [first, first === 'white' ? 'black' : 'white']) {
    const value = rollDie(s);
    putOnTop(s.stacks, TRACK_SPACES + 1 - value, [camel]);
    crazy.push({ camel, value, space: TRACK_SPACES + 1 - value });
  }
  s.setup = { racing, crazy };

  // Setup step 9: the starting player marker.
  s.startPlayer = Number.isInteger(startPlayer) ? startPlayer : Math.floor(rand(s) * players.length);
  s.turn = s.startPlayer;
  pushLog(s, [{ t: 'start', player: s.players[s.turn].id }]);
  return s;
}

// ─── Reading the board ───────────────────────────────────────────────────────

export const playerById = (s, id) => s.players.find((p) => p.id === id);
export const currentPlayer = (s) => s.players[s.turn];
export const isOffTrack = (space) => space > TRACK_SPACES || space < 1;

/** Where a camel is: { space, index } (index 0 = bottom of the stack). */
export function locate(stacks, camel) {
  for (const key in stacks) {
    const index = stacks[key].indexOf(camel);
    if (index >= 0) return { space: Number(key), index };
  }
  return null;
}

/**
 * Racing camels from first to last. Farther along the track is ahead; on the
 * same space the higher camel is ahead. Crazy camels are ignored.
 * Camels carried backwards over the finish line sit on spaces ≤ 0, so they
 * automatically count as the least advanced (rulebook p.5 note).
 */
export function ranking(s) {
  return rankStacks(s.stacks);
}

export function rankStacks(stacks) {
  const list = [];
  for (const key in stacks) {
    stacks[key].forEach((camel, index) => {
      if (isRacing(camel)) list.push({ camel, space: Number(key), index });
    });
  }
  list.sort((a, b) => b.space - a.space || b.index - a.index);
  return list.map((x) => x.camel);
}

export function tileSpaceOf(s, playerId) {
  for (const key in s.tiles) if (s.tiles[key].owner === playerId) return Number(key);
  return null;
}

// ─── Moving camels ───────────────────────────────────────────────────────────

function putOnTop(stacks, space, unit) {
  (stacks[space] ||= []).push(...unit);
}
function putUnder(stacks, space, unit) {
  (stacks[space] ||= []).unshift(...unit);
}
function takeFrom(stacks, space, index) {
  const unit = stacks[space].splice(index);
  if (!stacks[space].length) delete stacks[space];
  return unit;
}

function copyStacks(stacks) {
  const out = {};
  for (const key in stacks) out[key] = [...stacks[key]];
  return out;
}

/**
 * Which crazy camel moves when the grey die shows `shown` (rulebook p.4):
 *  - if only ONE crazy camel carries racing camels, that one moves;
 *  - else if one crazy camel sits directly on the other, the top one moves;
 *  - otherwise the colour on the die decides.
 */
export function crazyCamelToMove(stacks, shown) {
  const w = locate(stacks, 'white');
  const b = locate(stacks, 'black');
  const carries = (loc) => stacks[loc.space].slice(loc.index + 1).some(isRacing);
  const wc = carries(w);
  const bc = carries(b);
  if (wc !== bc) return { camel: wc ? 'white' : 'black', reason: 'carrying' };
  if (w.space === b.space && Math.abs(w.index - b.index) === 1) {
    return { camel: w.index > b.index ? 'white' : 'black', reason: 'stacked' };
  }
  return { camel: shown, reason: null };
}

/**
 * Move `camel` and everything sitting on it `steps` spaces in its own direction
 * (racing camels clockwise = up the numbers, crazy camels counter-clockwise).
 * Applies spectator tiles. Works on a bare board { stacks, tiles, mode } so the
 * bots can reuse it for fast simulations.
 *
 * Crazier Camels (board.mode === 'crazier'): a crazy camel never leaves the board.
 * Moving past space 1 it carries its riders to space 1, drops the racing camels
 * off there (on top of whatever is already on 1), then loops round to 16, 15…
 * with any crazy camels still riding on it.
 *
 * Returns { over, tile } — over: a camel unit crossed the finish line;
 * tile: the spectator tile that was triggered (its owner earns 1 coin).
 * `emit(event)` (optional) receives animation events.
 */
export function moveOnBoard(board, camel, steps, emit) {
  const { stacks, tiles } = board;
  const dir = isCrazy(camel) ? -1 : 1;
  const from = locate(stacks, camel);
  const crazier = board.mode === 'crazier';
  let unit = takeFrom(stacks, from.space, from.index);
  let to = from.space + dir * steps;
  if (crazier && dir < 0 && to < 1) {
    const left = 1 - to; // steps still to go once space 1 is reached
    putOnTop(stacks, 1, unit);
    if (emit && from.space > 1) {
      emit({ t: 'move', camel, unit: [...unit], from: from.space, to: 1, dir, under: false, stacks: copyStacks(stacks) });
    }
    const base = stacks[1].length - unit.length;
    const dropped = unit.filter(isRacing);
    const riders = unit.filter(isCrazy);
    stacks[1] = stacks[1].filter((c, i) => i < base || isRacing(c));
    if (!stacks[1].length) delete stacks[1];
    to = TRACK_SPACES + 1 - left; // 1 → 16 → 15 …
    putOnTop(stacks, to, riders);
    if (emit) {
      const path = Array.from({ length: left }, (_, k) => TRACK_SPACES - k);
      emit({ t: 'loop', camel, unit: [...riders], dropped, from: 1, to, path, dir, under: false, stacks: copyStacks(stacks) });
    }
    unit = riders;
  } else {
    putOnTop(stacks, to, unit);
    if (emit) {
      emit({ t: 'move', camel, unit: [...unit], from: from.space, to, dir, under: false, stacks: copyStacks(stacks) });
    }
  }
  // "As soon as any camel unit crosses the finish line, the race ends immediately."
  if (isOffTrack(to)) return { over: true, tile: null };

  const tile = tiles[to];
  if (!tile) return { over: false, tile: null };

  // Spectator tile: cheering pushes the unit 1 more space in its own direction
  // (landing on top); booing pushes it 1 space back (sliding underneath).
  const moved = takeFrom(stacks, to, stacks[to].length - unit.length);
  const cheer = tile.side === 'cheer';
  let to2 = cheer ? to + dir : to - dir;
  // Crazier Camels: crazy camels booed forward off space 16 come round to space 1
  const wrap = crazier && to2 > TRACK_SPACES && moved.every(isCrazy);
  if (wrap) to2 = 1;
  if (cheer) putOnTop(stacks, to2, moved);
  else putUnder(stacks, to2, moved);
  if (emit) {
    emit({
      t: 'tileEffect',
      owner: tile.owner,
      side: tile.side,
      space: to,
      camel,
      unit: [...moved],
      from: to,
      to: to2,
      dir: cheer ? dir : -dir,
      under: !cheer,
      ...(wrap ? { path: [1] } : {}),
      stacks: copyStacks(stacks),
    });
  }
  return { over: isOffTrack(to2), tile };
}

// ─── Validation ──────────────────────────────────────────────────────────────

/** Why `playerId` may not put their spectator tile on `space`, or null if they may. */
export function tileError(s, playerId, space, side = 'cheer') {
  if (side !== 'cheer' && side !== 'boo') return 'Choose the cheering or the booing side.';
  if (!Number.isInteger(space) || space < 2 || space > TRACK_SPACES) {
    return `Spectator tiles go on spaces 2–${TRACK_SPACES} (never space 1).`;
  }
  if (s.stacks[space]?.length) return 'That space has camels on it.';
  const here = s.tiles[space];
  if (here) {
    // your own tile can be flipped over where it is (cheer ↔ boo) instead of being moved
    if (here.owner !== playerId) return 'Another spectator tile is already there.';
    return here.side === side ? `Your tile already shows ${side === 'cheer' ? 'cheering' : 'booing'} there — flip it or pick another space.` : null;
  }
  for (const adj of [space - 1, space + 1]) {
    const t = s.tiles[adj];
    if (t && t.owner !== playerId) return 'Too close: it cannot sit next to another spectator tile.';
  }
  return null;
}

/** Spaces where `playerId` may put their tile with at least one side up (their own space: flipped). */
export function validTileSpaces(s, playerId) {
  const out = [];
  for (let sp = 2; sp <= TRACK_SPACES; sp++) {
    if (!tileError(s, playerId, sp, 'cheer') || !tileError(s, playerId, sp, 'boo')) out.push(sp);
  }
  return out;
}

export function validateAction(s, playerId, action) {
  if (s.status !== 'playing') return 'The race is already over.';
  const p = currentPlayer(s);
  if (!p || p.id !== playerId) return "It's not your turn.";
  switch (action?.type) {
    case 'legBet':
      if (!RACING_CAMELS.includes(action.color)) return 'Pick one of the five racing camels.';
      if (!s.legStacks[action.color].length) return 'No betting tickets are left for that camel.';
      return null;
    case 'tile':
      return tileError(s, playerId, action.space, action.side);
    case 'roll':
      return s.pyramidLeft > 0 ? null : 'No pyramid tickets are left.';
    case 'finishBet':
      if (action.pile !== 'winner' && action.pile !== 'loser') return 'Choose the winner or the loser pile.';
      if (!p.finishCards.includes(action.color)) return 'You have already played that card.';
      return null;
    case 'partner': {
      if (!s.partnerships) return `Partnerships are only used with ${PARTNERSHIP_MIN_PLAYERS} or more players.`;
      if (p.partner) return 'You already have a partner this leg.';
      const q = playerById(s, action.target);
      if (!q || q.id === p.id) return 'Choose another player.';
      if (q.partner) return 'That player already has a partner this leg.';
      return null;
    }
    default:
      return 'Unknown action.';
  }
}

/** Every legal action for the current player (used by bots and tests). */
export function legalActions(s, playerId) {
  if (s.status !== 'playing' || currentPlayer(s).id !== playerId) return [];
  const p = currentPlayer(s);
  const acts = [{ type: 'roll' }];
  for (const color of RACING_CAMELS) if (s.legStacks[color].length) acts.push({ type: 'legBet', color });
  for (const space of validTileSpaces(s, p.id)) {
    for (const side of ['cheer', 'boo']) if (!tileError(s, p.id, space, side)) acts.push({ type: 'tile', space, side });
  }
  for (const color of p.finishCards) {
    acts.push({ type: 'finishBet', pile: 'winner', color }, { type: 'finishBet', pile: 'loser', color });
  }
  if (s.partnerships && !p.partner) {
    for (const q of s.players) if (q.id !== p.id && !q.partner) acts.push({ type: 'partner', target: q.id });
  }
  return acts;
}

// ─── Doing things ────────────────────────────────────────────────────────────

/**
 * Apply one action for `playerId`. Returns a NEW state plus a list of events
 * (for animations and the game log). Throws RuleError if the action is illegal.
 * `options.roll` ({ die, value, shown, crazy?: { value, shown } }) forces a die result — tests only.
 */
export function applyAction(state, playerId, action, options = {}) {
  const problem = validateAction(state, playerId, action);
  if (problem) throw new RuleError(problem);

  const s = structuredClone(state);
  const events = [];
  const emit = (e) => events.push(e);
  const turnIndex = s.turn;
  const legAtStart = s.leg;
  const p = s.players[turnIndex];

  switch (action.type) {
    case 'legBet': {
      const value = s.legStacks[action.color].shift();
      p.legTickets.push({ color: action.color, value });
      emit({ t: 'legBet', player: p.id, color: action.color, value });
      break;
    }
    case 'tile': {
      const from = tileSpaceOf(s, p.id);
      if (from !== null) delete s.tiles[from];
      s.tiles[action.space] = { owner: p.id, side: action.side };
      emit({ t: 'placeTile', player: p.id, space: action.space, side: action.side, from });
      break;
    }
    case 'finishBet': {
      p.finishCards.splice(p.finishCards.indexOf(action.color), 1);
      (action.pile === 'winner' ? s.winnerBets : s.loserBets).push({ player: p.id, color: action.color });
      emit({ t: 'finishBet', player: p.id, pile: action.pile, color: action.color });
      break;
    }
    case 'partner': {
      const q = playerById(s, action.target);
      p.partner = q.id;
      q.partner = p.id;
      emit({ t: 'partner', player: p.id, target: q.id });
      break;
    }
    case 'roll': {
      const over = rollPyramid(s, p, emit, options.roll);
      if (over) {
        // One more leg scoring round, then the overall winner/loser scoring.
        scoreLeg(s, emit);
        scoreFinal(s, emit);
      } else if (s.rolled.length >= DICE_PER_LEG) {
        scoreLeg(s, emit);
        startNextLeg(s, turnIndex, emit);
      }
      break;
    }
  }

  if (s.status === 'playing') s.turn = (turnIndex + 1) % s.players.length;
  s.seq += 1;
  pushLog(s, events, legAtStart);
  return { state: s, events };
}

/**
 * Action 3: take a pyramid ticket, reveal a random die, move a camel.
 * Crazier Camels: then roll the grey die beside the pyramid and move a crazy camel too
 * (unless the coloured camel already ended the race).
 */
function rollPyramid(s, p, emit, forced) {
  s.pyramidLeft -= 1;
  p.pyramidTickets += 1;

  let die;
  let value;
  let shown = null;
  if (forced) {
    die = forced.die;
    value = forced.value;
    shown = forced.shown ?? null;
    if (!s.diceLeft.includes(die)) throw new RuleError(`The ${die} die is not in the pyramid.`);
    s.diceLeft.splice(s.diceLeft.indexOf(die), 1);
  } else {
    die = s.diceLeft.splice(Math.floor(rand(s) * s.diceLeft.length), 1)[0];
    value = rollDie(s);
    if (die === 'grey') shown = rand(s) < 0.5 ? 'white' : 'black';
  }

  let camel = die;
  let reason = null;
  if (die === 'grey') ({ camel, reason } = crazyCamelToMove(s.stacks, shown));
  s.rolled.push({ die, value, shown });
  emit({ t: 'roll', player: p.id, die, value, shown, camel, reason });

  const { over, tile } = moveOnBoard(s, camel, value, emit);
  if (tile) playerById(s, tile.owner).coins += 1; // tile owner gets 1 coin from the bank
  if (over || s.mode !== 'crazier') return over;

  // the grey die, rolled off to the side
  const greyValue = forced?.crazy ? forced.crazy.value : rollDie(s);
  const greyShown = forced?.crazy ? forced.crazy.shown : rand(s) < 0.5 ? 'white' : 'black';
  const pickCrazy = crazyCamelToMove(s.stacks, greyShown);
  s.rolled[s.rolled.length - 1].crazy = { value: greyValue, shown: greyShown, camel: pickCrazy.camel };
  emit({ t: 'roll', side: true, player: p.id, die: 'grey', value: greyValue, shown: greyShown, camel: pickCrazy.camel, reason: pickCrazy.reason });
  const second = moveOnBoard(s, pickCrazy.camel, greyValue, emit);
  if (second.tile) playerById(s, second.tile.owner).coins += 1;
  return second.over;
}

/** Reward of one betting ticket once we know the leg's 1st and 2nd camels. */
function ticketReward(ticket, first, second) {
  if (ticket.color === first) return ticket.value;
  if (ticket.color === second) return 1;
  return -1;
}

function ticketItems(player, first, second) {
  const items = player.legTickets.map((t) => ({
    kind: 'leg',
    color: t.color,
    value: t.value,
    reward: ticketReward(t, first, second),
  }));
  for (let i = 0; i < player.pyramidTickets; i++) items.push({ kind: 'pyramid', reward: 1 });
  return items;
}

/** Leg scoring round (rulebook p.5), including partnership bonuses (p.6). */
function scoreLeg(s, emit) {
  const order = ranking(s);
  const [first, second] = order;
  const rows = s.players.map((p) => {
    const items = ticketItems(p, first, second);
    let bonus = null;
    if (p.partner) {
      // Copy the reward of one of the partner's tickets — naturally the best one,
      // and nothing at all if every partner ticket would lose money.
      const partner = playerById(s, p.partner);
      for (const item of ticketItems(partner, first, second)) {
        if (item.reward > 0 && (!bonus || item.reward > bonus.reward)) bonus = { from: partner.id, ...item };
      }
    }
    const total = items.reduce((sum, i) => sum + i.reward, 0) + (bonus ? bonus.reward : 0);
    const before = p.coins;
    p.coins = Math.max(0, p.coins + total); // nobody drops below 0
    return { player: p.id, items, bonus, total, before, after: p.coins };
  });
  const result = { leg: s.leg, first, second, order, rows };
  s.legResults.push(result);
  emit({ t: 'legEnd', leg: s.leg, result });
  return result;
}

/** Clean up after a leg and hand the starting player marker on. */
function startNextLeg(s, lastRollerIndex, emit) {
  s.legStacks = freshLegStacks();
  for (const p of s.players) {
    p.legTickets = [];
    p.pyramidTickets = 0;
    p.partner = null; // partnership cards flip back to "available"
  }
  s.tiles = {}; // spectator tiles go back to their owners
  s.diceLeft = pyramidDice(s.mode);
  s.rolled = [];
  s.pyramidLeft = PYRAMID_TICKETS;
  s.leg += 1;
  // The marker goes to the player left of whoever took the last pyramid ticket.
  s.startPlayer = (lastRollerIndex + 1) % s.players.length;
  emit({ t: 'newLeg', leg: s.leg, player: s.players[s.startPlayer].id });
}

/** End of game scoring for the overall winner and loser piles (rulebook p.5). */
function scoreFinal(s, emit) {
  const order = ranking(s);
  const winner = order[0];
  const loser = order[order.length - 1];

  // Cards are revealed in the order they were placed. Each correct card pays
  // 8, 5, 3, 2, then 1; each wrong card costs 1 (never below 0 coins).
  const reveal = (bets, target) => {
    let correct = 0;
    return bets.map((bet) => {
      const p = playerById(s, bet.player);
      const right = bet.color === target;
      let reward = -FINISH_PENALTY;
      if (right) {
        reward = correct < FINISH_PAYOUTS.length ? FINISH_PAYOUTS[correct] : FINISH_PAYOUT_LATE;
        correct += 1;
      }
      const before = p.coins;
      p.coins = Math.max(0, p.coins + reward);
      return { player: p.id, color: bet.color, correct: right, reward, change: p.coins - before };
    });
  };
  const winnerCards = reveal(s.winnerBets, winner);
  const loserCards = reveal(s.loserBets, loser);

  const best = Math.max(...s.players.map((p) => p.coins));
  const standings = [...s.players]
    .sort((a, b) => b.coins - a.coins)
    .map((p) => ({ player: p.id, coins: p.coins }));
  const winners = s.players.filter((p) => p.coins === best).map((p) => p.id);

  s.final = { winner, loser, order, winnerCards, loserCards, standings, winners };
  s.status = 'finished';
  emit({ t: 'gameEnd', final: s.final });
}

// ─── Log & privacy ───────────────────────────────────────────────────────────

function pushLog(s, events, leg = s.leg) {
  for (const e of events) {
    const { stacks, result, final, ...rest } = e; // keep the log light
    s.log.push({ ...rest, seq: s.seq, leg: e.t === 'newLeg' ? e.leg : leg });
  }
  if (s.log.length > LOG_LIMIT) s.log.splice(0, s.log.length - LOG_LIMIT);
}

/**
 * A copy of the state that is safe to show `playerId` (online play):
 * other players' finish cards and the colours on the face-down winner/loser
 * piles stay secret until the race is over. The dice seed is never shared.
 */
export function viewFor(s, playerId) {
  const v = structuredClone(s);
  delete v.rng;
  for (const p of v.players) p.handCount = p.finishCards.length;
  if (v.status !== 'finished') {
    for (const p of v.players) if (p.id !== playerId) p.finishCards = null;
    const hide = (b) => (b.player === playerId ? b : { player: b.player });
    v.winnerBets = v.winnerBets.map(hide);
    v.loserBets = v.loserBets.map(hide);
    v.log = v.log.map((e) => (e.t === 'finishBet' && e.player !== playerId ? { ...e, color: null } : e));
  }
  return v;
}

/** Hide secret colours inside a batch of events before sending it to `playerId`. */
export function eventsFor(events, playerId, finished) {
  if (finished) return events;
  return events.map((e) => (e.t === 'finishBet' && e.player !== playerId ? { ...e, color: null } : e));
}
