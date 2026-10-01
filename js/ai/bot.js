// ─────────────────────────────────────────────────────────────────────────────
//  Bots and odds.
//
//  The bots don't cheat: they only look at public information (the board, the
//  tickets left, the number of cards on each pile). They estimate probabilities
//  by simulating the rest of the leg / race thousands of times with random dice,
//  then pick the action with the best expected number of coins.
//
//  The same simulations power the optional "fortune teller" odds in the UI.
// ─────────────────────────────────────────────────────────────────────────────

import { RACING_CAMELS, DICE, DICE_PER_LEG, FINISH_PAYOUTS, FINISH_PAYOUT_LATE, isCrazy } from '../engine/constants.js';
import { moveOnBoard, crazyCamelToMove, rankStacks, validTileSpaces, locate, tileSpaceOf } from '../engine/game.js';

const zeroes = () => Object.fromEntries(RACING_CAMELS.map((c) => [c, 0]));

function copyStacks(stacks) {
  const out = {};
  for (const key in stacks) out[key] = stacks[key].slice();
  return out;
}

/** Roll one random die from `dice` (mutates it) and move a camel on `board`. */
function randomRoll(board, dice, landings) {
  const die = dice.splice(Math.floor(Math.random() * dice.length), 1)[0];
  const value = 1 + Math.floor(Math.random() * 3);
  let camel = die;
  if (die === 'grey') camel = crazyCamelToMove(board.stacks, Math.random() < 0.5 ? 'white' : 'black').camel;
  if (landings) {
    const from = locate(board.stacks, camel).space;
    const to = from + (isCrazy(camel) ? -value : value);
    if (to >= 1 && to <= 16) landings[to] += 1;
  }
  return moveOnBoard(board, camel, value).over;
}

/**
 * Simulate the rest of the current leg `n` times.
 * Returns probabilities that each camel finishes the leg 1st / 2nd, how often a
 * camel unit lands on each space (spectator-tile income), and the chance the
 * whole race ends during this leg.
 */
export function simulateLeg(s, n = 1500) {
  const first = zeroes();
  const second = zeroes();
  const landings = new Array(17).fill(0);
  let ended = 0;
  const rollsLeft = DICE_PER_LEG - s.rolled.length;
  for (let i = 0; i < n; i++) {
    const board = { stacks: copyStacks(s.stacks), tiles: s.tiles };
    const dice = s.diceLeft.slice();
    for (let r = 0; r < rollsLeft; r++) {
      if (randomRoll(board, dice, landings)) {
        ended++;
        break;
      }
    }
    const order = rankStacks(board.stacks);
    first[order[0]]++;
    second[order[1]]++;
  }
  for (const c of RACING_CAMELS) {
    first[c] /= n;
    second[c] /= n;
  }
  return { first, second, landings: landings.map((x) => x / n), ended: ended / n };
}

/** Simulate to the end of the race `n` times: chance each camel wins / loses overall. */
export function simulateRace(s, n = 600) {
  const win = zeroes();
  const lose = zeroes();
  let legsSum = 0;
  for (let i = 0; i < n; i++) {
    const board = { stacks: copyStacks(s.stacks), tiles: s.tiles };
    let dice = s.diceLeft.slice();
    let rollsLeft = DICE_PER_LEG - s.rolled.length;
    let over = false;
    for (let leg = 0; leg < 60 && !over; leg++) {
      for (let r = 0; r < rollsLeft; r++) {
        if (randomRoll(board, dice, null)) {
          over = true;
          break;
        }
      }
      if (!over) {
        // next leg: all dice back in the pyramid, spectator tiles back to owners
        dice = DICE.slice();
        rollsLeft = DICE_PER_LEG;
        board.tiles = {};
        legsSum++;
      }
    }
    const order = rankStacks(board.stacks);
    win[order[0]]++;
    lose[order[order.length - 1]]++;
  }
  for (const c of RACING_CAMELS) {
    win[c] /= n;
    lose[c] /= n;
  }
  return { win, lose, legsLeft: legsSum / n };
}

/** Expected payout for adding one more (correct) card on top of a pile of `pileSize`. */
function expectedFinishPayout(pileSize, chance) {
  // Assume each earlier card is also on the eventual camel about as often as the
  // camel's own chance, so our card's rank among correct cards is ~ pileSize × chance.
  const rank = Math.round(pileSize * Math.min(0.9, chance + 0.15));
  return rank < FINISH_PAYOUTS.length ? FINISH_PAYOUTS[rank] : FINISH_PAYOUT_LATE;
}

/**
 * Score every sensible action for `playerId` and return them best first:
 * [{ action, ev, why }]. `ev` is the expected coins.
 */
export function evaluateActions(s, playerId, { legSims = 1500, raceSims = 600 } = {}) {
  const me = s.players.find((p) => p.id === playerId);
  const leg = simulateLeg(s, legSims);
  const race = simulateRace(s, raceSims);
  const options = [];

  // 3. Roll: a guaranteed coin at leg end.
  options.push({ action: { type: 'roll' }, ev: 1, why: 'safe coin' });

  // 1. Leg betting tickets.
  for (const c of RACING_CAMELS) {
    const value = s.legStacks[c][0];
    if (!value) continue;
    const p1 = leg.first[c];
    const p2 = leg.second[c];
    options.push({
      action: { type: 'legBet', color: c },
      ev: value * p1 + p2 - (1 - p1 - p2),
      why: `${Math.round(p1 * 100)}% to lead the leg`,
    });
  }

  // 2. Spectator tile: 1 coin every time a camel unit lands on it.
  const current = tileSpaceOf(s, playerId);
  const currentValue = current ? leg.landings[current] : 0;
  const myColors = new Set(me.legTickets.map((t) => t.color));
  for (const space of validTileSpaces(s, playerId)) {
    const income = leg.landings[space] - currentValue;
    // Cheer if camels just behind the space are ones we backed, else boo.
    const behind = [space - 1, space - 2, space - 3].flatMap((sp) => s.stacks[sp] || []);
    const backers = behind.filter((c) => myColors.has(c)).length;
    const others = behind.filter((c) => !isCrazy(c) && !myColors.has(c)).length;
    const side = backers >= others ? 'cheer' : 'boo';
    if (space === current && s.tiles[current].side === side) continue; // its own tile already shows that side
    options.push({ action: { type: 'tile', space, side }, ev: income * 0.95 + 0.05 * (backers + others), why: 'spectator coins' });
  }

  // 4. Overall winner / loser cards. Worth more late in the race.
  const urgency = race.legsLeft < 1 ? 1 : race.legsLeft < 2 ? 0.8 : 0.55;
  for (const c of me.finishCards || []) {
    const pw = race.win[c];
    const pl = race.lose[c];
    const evW = pw * expectedFinishPayout(s.winnerBets.length, pw) - (1 - pw);
    const evL = pl * expectedFinishPayout(s.loserBets.length, pl) - (1 - pl);
    options.push({ action: { type: 'finishBet', pile: 'winner', color: c }, ev: evW * urgency, why: `${Math.round(pw * 100)}% to win` });
    options.push({ action: { type: 'finishBet', pile: 'loser', color: c }, ev: evL * urgency, why: `${Math.round(pl * 100)}% to lose` });
  }

  // 5. Partnership: copy the partner's best ticket at leg end.
  if (s.partnerships && !me.partner) {
    const rollsLeft = DICE_PER_LEG - s.rolled.length;
    for (const q of s.players) {
      if (q.id === playerId || q.partner) continue;
      let best = q.pyramidTickets > 0 ? 1 : 0;
      for (const t of q.legTickets) {
        const e = t.value * leg.first[t.color] + leg.second[t.color] - (1 - leg.first[t.color] - leg.second[t.color]);
        best = Math.max(best, e);
      }
      // the partner will likely pick up more tickets before the leg ends
      options.push({ action: { type: 'partner', target: q.id }, ev: best + 0.25 * rollsLeft, why: 'partnership' });
    }
  }

  options.sort((a, b) => b.ev - a.ev);
  return { options, leg, race };
}

/** Pick the bot's move. `level`: 'easy' plays looser, 'clever' plays the numbers. */
export function chooseBotAction(s, playerId, level = 'clever') {
  const easy = level === 'easy';
  const { options } = evaluateActions(s, playerId, easy ? { legSims: 300, raceSims: 150 } : {});
  const noise = easy ? 0.9 : 0.12;
  let best = options[0];
  let bestScore = -Infinity;
  for (const o of options.slice(0, 12)) {
    const score = o.ev + (Math.random() - 0.5) * 2 * noise;
    if (score > bestScore) {
      bestScore = score;
      best = o;
    }
  }
  return best.action;
}
