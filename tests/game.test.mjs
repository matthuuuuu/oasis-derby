// Rules tests. Run with:  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  applyAction,
  validateAction,
  legalActions,
  ranking,
  crazyCamelToMove,
  validTileSpaces,
  viewFor,
  RuleError,
} from '../js/engine/game.js';
import { ALL_CAMELS, RACING_CAMELS } from '../js/engine/constants.js';
import { hashSeed, rand } from '../js/engine/rng.js';

function game(n = 3, patch = {}) {
  const players = Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, character: 'explorer' }));
  const s = createGame({ players, seed: 7, startPlayer: 0 });
  return Object.assign(s, patch);
}
const roll = (s, die, value, shown) =>
  applyAction(s, s.players[s.turn].id, { type: 'roll' }, { roll: { die, value, shown } });

// ─── Setup ───────────────────────────────────────────────────────────────────

test('setup follows the rulebook', () => {
  for (let seed = 0; seed < 300; seed++) {
    const players = [1, 2, 3, 4].map((i) => ({ id: `p${i}`, name: `P${i}`, character: 'x' }));
    const s = createGame({ players, seed });
    for (const c of RACING_CAMELS) {
      const space = Number(Object.keys(s.stacks).find((k) => s.stacks[k].includes(c)));
      assert.ok(space >= 1 && space <= 3, `${c} starts on 1–3`);
    }
    for (const c of ['white', 'black']) {
      const space = Number(Object.keys(s.stacks).find((k) => s.stacks[k].includes(c)));
      assert.ok(space >= 14 && space <= 16, `${c} starts on 14–16`);
    }
    assert.equal(Object.values(s.stacks).flat().length, 7);
    for (const p of s.players) {
      assert.equal(p.coins, 3);
      assert.deepEqual(p.finishCards, RACING_CAMELS);
    }
    for (const c of RACING_CAMELS) assert.deepEqual(s.legStacks[c], [5, 3, 2, 2]);
    assert.equal(s.pyramidLeft, 5);
    assert.equal(s.diceLeft.length, 6);
    assert.equal(s.partnerships, false);
  }
});

test('partnerships switch on at 6 players', () => {
  assert.equal(game(5).partnerships, false);
  assert.equal(game(6).partnerships, true);
  assert.equal(game(8).partnerships, true);
});

test('player count limits', () => {
  assert.throws(() => game(1), RuleError);
  assert.throws(() => game(9), RuleError);
});

// ─── Movement ────────────────────────────────────────────────────────────────

test('a moving camel carries everything on top of it and lands on top', () => {
  let s = game(3, { stacks: { 3: ['blue', 'green'], 5: ['yellow'], 1: ['red', 'purple'], 14: ['white'], 16: ['black'] } });
  ({ state: s } = roll(s, 'blue', 2));
  assert.deepEqual(s.stacks[5], ['yellow', 'blue', 'green']);
  assert.equal(s.stacks[3], undefined);
});

test('a camel in the middle of a stack leaves the ones below behind', () => {
  let s = game(3, { stacks: { 1: ['red', 'blue', 'green'], 2: ['yellow', 'purple'], 14: ['white'], 16: ['black'] } });
  ({ state: s } = roll(s, 'blue', 1));
  assert.deepEqual(s.stacks[1], ['red']);
  assert.deepEqual(s.stacks[2], ['yellow', 'purple', 'blue', 'green']);
});

test('cheering tile: +1 space, lands on top, owner earns 1', () => {
  let s = game(3, {
    stacks: { 2: ['blue'], 5: ['yellow'], 1: ['red', 'green', 'purple'], 14: ['white'], 16: ['black'] },
    tiles: { 4: { owner: 'p2', side: 'cheer' } },
  });
  const before = s.players[2].coins;
  let events;
  ({ state: s, events } = roll(s, 'blue', 2));
  assert.deepEqual(s.stacks[5], ['yellow', 'blue']);
  assert.equal(s.stacks[4], undefined);
  assert.equal(s.players[2].coins, before + 1);
  assert.ok(events.some((e) => e.t === 'tileEffect' && e.side === 'cheer' && e.to === 5));
});

test('booing tile: −1 space, slides UNDER the unit there', () => {
  let s = game(3, {
    stacks: { 1: ['blue'], 3: ['yellow'], 2: ['red', 'green', 'purple'], 14: ['white'], 16: ['black'] },
    tiles: { 4: { owner: 'p1', side: 'boo' } },
  });
  ({ state: s } = roll(s, 'blue', 3));
  assert.deepEqual(s.stacks[3], ['blue', 'yellow']);
  assert.equal(s.players[1].coins, 4);
});

test('crazy camels move counter-clockwise', () => {
  let s = game(3, { stacks: { 1: ['blue', 'yellow', 'green', 'red', 'purple'], 14: ['white'], 16: ['black'] } });
  ({ state: s } = roll(s, 'grey', 2, 'white'));
  assert.deepEqual(s.stacks[12], ['white']);
});

test('crazy die: the only crazy camel carrying racers must move', () => {
  const stacks = { 10: ['black', 'red'], 14: ['white'], 1: ['blue', 'yellow', 'green', 'purple'] };
  assert.deepEqual(crazyCamelToMove(stacks, 'white'), { camel: 'black', reason: 'carrying' });
  let s = game(3, { stacks });
  ({ state: s } = roll(s, 'grey', 3, 'white'));
  assert.deepEqual(s.stacks[7], ['black', 'red']);
  assert.deepEqual(s.stacks[14], ['white']);
});

test('crazy die: a crazy camel sitting directly on the other one moves', () => {
  assert.equal(crazyCamelToMove({ 12: ['white', 'black'], 1: RACING_CAMELS }, 'white').camel, 'black');
  assert.equal(crazyCamelToMove({ 12: ['black', 'white'], 1: RACING_CAMELS }, 'black').camel, 'white');
  // both carrying racers & stacked: top one moves
  assert.equal(crazyCamelToMove({ 12: ['white', 'black', 'red'], 1: ['blue', 'yellow', 'green', 'purple'] }, 'white').camel, 'black');
  // separated by a racing camel: only the lower one carries racers → it moves
  assert.equal(crazyCamelToMove({ 12: ['white', 'red', 'black'], 1: ['blue', 'yellow', 'green', 'purple'] }, 'black').camel, 'white');
});

test('crazy die: otherwise the colour on the die decides', () => {
  const both = { 5: ['white', 'red'], 9: ['black', 'blue'], 1: ['yellow', 'green', 'purple'] };
  assert.equal(crazyCamelToMove(both, 'black').camel, 'black');
  assert.equal(crazyCamelToMove(both, 'white').camel, 'white');
  const neither = { 14: ['white'], 15: ['black'], 1: RACING_CAMELS };
  assert.equal(crazyCamelToMove(neither, 'black').camel, 'black');
});

test('crazy camel on a cheering tile goes 1 further counter-clockwise, on top', () => {
  let s = game(3, {
    stacks: { 12: ['black'], 9: ['green'], 1: ['blue', 'yellow', 'red', 'purple'], 15: ['white'] },
    tiles: { 10: { owner: 'p0', side: 'cheer' } },
  });
  ({ state: s } = roll(s, 'grey', 2, 'black'));
  assert.deepEqual(s.stacks[9], ['green', 'black']);
});

test('crazy camel on a booing tile goes 1 clockwise, underneath', () => {
  let s = game(3, {
    stacks: { 12: ['black'], 11: ['green'], 1: ['blue', 'yellow', 'red', 'purple'], 15: ['white'] },
    tiles: { 10: { owner: 'p0', side: 'boo' } },
  });
  ({ state: s } = roll(s, 'grey', 2, 'black'));
  assert.deepEqual(s.stacks[11], ['black', 'green']);
});

// ─── Race end ────────────────────────────────────────────────────────────────

test('crossing the finish line ends the race immediately and scores everything', () => {
  let s = game(3, { stacks: { 15: ['blue'], 10: ['yellow', 'green'], 2: ['red', 'purple'], 14: ['white'], 16: ['black'] } });
  s.winnerBets = [{ player: 'p1', color: 'blue' }];
  s.loserBets = [{ player: 'p2', color: 'purple' }];
  ({ state: s } = roll(s, 'blue', 3));
  assert.equal(s.status, 'finished');
  assert.equal(s.final.winner, 'blue');
  assert.equal(s.final.loser, 'red'); // bottom of the last stack
  assert.deepEqual(ranking(s), ['blue', 'green', 'yellow', 'purple', 'red']);
  assert.equal(s.legResults.length, 1);
});

test('a cheering tile on space 16 can push a camel over the line', () => {
  let s = game(3, {
    stacks: { 14: ['green'], 3: ['blue', 'yellow', 'red', 'purple'], 12: ['white'], 13: ['black'] },
    tiles: { 16: { owner: 'p2', side: 'cheer' } },
  });
  ({ state: s } = roll(s, 'green', 2));
  assert.equal(s.status, 'finished');
  assert.equal(s.final.winner, 'green');
});

test('crazy camel carrying racers backwards over the line: they become the least advanced', () => {
  let s = game(3, { stacks: { 2: ['white', 'red', 'blue'], 5: ['yellow', 'green', 'purple'], 15: ['black'] } });
  ({ state: s } = roll(s, 'grey', 3, 'white'));
  assert.equal(s.status, 'finished');
  const order = ranking(s);
  assert.deepEqual(order.slice(-2), ['blue', 'red']);
  assert.equal(s.final.loser, 'red');
  assert.equal(s.final.winner, 'purple');
});

test('a lone crazy camel crossing the line counter-clockwise still ends the race', () => {
  let s = game(3, { stacks: { 1: ['black'], 5: ['blue', 'yellow', 'green', 'red', 'purple'], 15: ['white'] } });
  ({ state: s } = roll(s, 'grey', 2, 'black'));
  assert.equal(s.status, 'finished');
});

// ─── Scoring ─────────────────────────────────────────────────────────────────

test('leg scoring matches the rulebook example (Martina gets 9)', () => {
  let s = game(3, {
    stacks: { 9: ['yellow', 'green'], 6: ['blue', 'red'], 4: ['purple'], 14: ['white'], 16: ['black'] },
  });
  s.players[1].legTickets = [
    { color: 'green', value: 5 },
    { color: 'green', value: 2 },
    { color: 'yellow', value: 3 },
    { color: 'blue', value: 2 },
  ];
  s.players[1].pyramidTickets = 1; // + the one taken with the final roll below
  s.players[1].coins = 0;
  s.rolled = [
    { die: 'red', value: 1 },
    { die: 'blue', value: 1 },
    { die: 'purple', value: 1 },
    { die: 'green', value: 1 },
  ];
  s.diceLeft = ['yellow', 'grey'];
  s.pyramidLeft = 1;
  s.turn = 1;
  // p1 rolls the 5th die: white moves 1 (14 → 13), green stays in front of yellow.
  const { state, events } = roll(s, 'grey', 1, 'white');
  const row = state.legResults[0].rows.find((r) => r.player === 'p1');
  assert.equal(state.legResults[0].first, 'green');
  assert.equal(state.legResults[0].second, 'yellow');
  assert.equal(row.total, 9);
  assert.equal(state.players[1].coins, 9);
  assert.ok(events.some((e) => e.t === 'newLeg'));
});

test('leg end resets tickets, tiles and dice, and the next player starts', () => {
  let s = game(4);
  s.players[0].legTickets = [{ color: 'blue', value: 5 }];
  s.legStacks.blue = [3, 2, 2];
  s.tiles = { 10: { owner: 'p0', side: 'cheer' } };
  const rolls = ['blue', 'yellow', 'green', 'red', 'purple'];
  for (let i = 0; i < 5; i++) {
    const out = roll(s, rolls[i], 1);
    s = out.state;
    if (s.status !== 'playing') break;
  }
  assert.equal(s.leg, 2);
  assert.equal(s.rolled.length, 0);
  assert.equal(s.diceLeft.length, 6);
  assert.equal(s.pyramidLeft, 5);
  assert.deepEqual(s.tiles, {});
  assert.deepEqual(s.legStacks.blue, [5, 3, 2, 2]);
  for (const p of s.players) {
    assert.deepEqual(p.legTickets, []);
    assert.equal(p.pyramidTickets, 0);
  }
  // p0 took rolls 1 and 5 (4 players): the marker goes to p1, who is also next.
  assert.equal(s.startPlayer, 1);
  assert.equal(s.turn, 1);
});

test('nobody drops below 0 coins in leg scoring', () => {
  let s = game(3, { stacks: { 9: ['green'], 6: ['yellow'], 4: ['blue', 'red', 'purple'], 14: ['white'], 16: ['black'] } });
  s.players[2].coins = 1;
  s.players[2].legTickets = [
    { color: 'red', value: 5 },
    { color: 'purple', value: 3 },
    { color: 'blue', value: 2 },
  ];
  s.rolled = [{ die: 'red', value: 1 }, { die: 'blue', value: 1 }, { die: 'purple', value: 1 }, { die: 'green', value: 1 }];
  s.diceLeft = ['yellow', 'grey'];
  s.pyramidLeft = 1;
  ({ state: s } = roll(s, 'grey', 1, 'white'));
  const row = s.legResults[0].rows.find((r) => r.player === 'p2');
  assert.equal(row.total, -3);
  assert.equal(s.players[2].coins, 0);
});

test('partners copy their partner’s best positive ticket, or nothing', () => {
  let s = game(6, { stacks: { 9: ['green'], 6: ['yellow'], 4: ['blue', 'red', 'purple'], 14: ['white'], 16: ['black'] } });
  ({ state: s } = applyAction(s, 'p0', { type: 'partner', target: 'p3' }));
  assert.equal(s.players[0].partner, 'p3');
  assert.equal(s.players[3].partner, 'p0');
  assert.match(validateAction({ ...s, turn: 3 }, 'p3', { type: 'partner', target: 'p1' }), /already/);
  s.players[0].legTickets = [{ color: 'purple', value: 5 }]; // -1
  s.players[3].legTickets = [{ color: 'green', value: 5 }, { color: 'yellow', value: 3 }]; // 5 and 1
  s.rolled = [{ die: 'red', value: 1 }, { die: 'blue', value: 1 }, { die: 'purple', value: 1 }, { die: 'green', value: 1 }];
  s.diceLeft = ['yellow', 'grey'];
  s.pyramidLeft = 1;
  s.turn = 1;
  ({ state: s } = roll(s, 'grey', 1, 'white')); // p1 rolls (+1 pyramid ticket for p1)
  const rows = Object.fromEntries(s.legResults[0].rows.map((r) => [r.player, r]));
  assert.equal(rows.p0.bonus.reward, 5);
  assert.equal(rows.p0.total, -1 + 5);
  assert.equal(rows.p3.bonus, null); // p0 only had a losing ticket
  assert.equal(rows.p3.total, 6);
  // partnership cards flip back
  assert.equal(s.players[0].partner, null);
});

test('final scoring pays 8/5/3/2/1/1 in placing order, −1 for wrong cards', () => {
  let s = game(7, { stacks: { 15: ['blue'], 10: ['yellow'], 8: ['green'], 5: ['red'], 2: ['purple'], 14: ['white'], 16: ['black'] } });
  for (const p of s.players) p.coins = 10;
  s.winnerBets = [
    { player: 'p0', color: 'green' }, // wrong
    { player: 'p1', color: 'blue' }, // 8
    { player: 'p2', color: 'blue' }, // 5
    { player: 'p3', color: 'blue' }, // 3
    { player: 'p4', color: 'blue' }, // 2
    { player: 'p5', color: 'blue' }, // 1
    { player: 'p6', color: 'blue' }, // 1
  ];
  s.loserBets = [
    { player: 'p0', color: 'purple' }, // 8
    { player: 'p1', color: 'red' }, // wrong
  ];
  ({ state: s } = roll(s, 'blue', 2));
  const w = s.final.winnerCards.map((c) => c.reward);
  assert.deepEqual(w, [-1, 8, 5, 3, 2, 1, 1]);
  assert.deepEqual(s.final.loserCards.map((c) => c.reward), [8, -1]);
  // p0 made the final roll: 10 + 1 (pyramid ticket) − 1 (wrong winner card) + 8 (first right loser card)
  assert.equal(s.players[0].coins, 18);
  // p1: 10 + 8 − 1 = 17
  assert.equal(s.players[1].coins, 17);
});

test('the winner is whoever has the most coins; ties share the victory', () => {
  let s = game(3, { stacks: { 15: ['blue'], 10: ['yellow'], 8: ['green'], 5: ['red'], 2: ['purple'], 14: ['white'], 16: ['black'] } });
  s.players[0].coins = 4; // will get +1 pyramid ticket
  s.players[1].coins = 5;
  s.players[2].coins = 2;
  ({ state: s } = roll(s, 'blue', 3));
  assert.deepEqual(s.final.winners.sort(), ['p0', 'p1']);
});

// ─── Actions & validation ────────────────────────────────────────────────────

test('betting tickets come off the stack 5, 3, 2, 2 and then run out', () => {
  let s = game(2);
  const values = [];
  for (let i = 0; i < 4; i++) {
    const pid = s.players[s.turn].id;
    ({ state: s } = applyAction(s, pid, { type: 'legBet', color: 'red' }));
    values.push(s.players.find((p) => p.id === pid).legTickets.at(-1).value);
  }
  assert.deepEqual(values, [5, 3, 2, 2]);
  assert.match(validateAction(s, s.players[s.turn].id, { type: 'legBet', color: 'red' }), /No betting tickets/);
});

test('spectator tile placement rules', () => {
  const s = game(3, { stacks: { 1: ['blue'], 3: ['yellow', 'green'], 6: ['red', 'purple'], 14: ['white'], 16: ['black'] } });
  s.tiles = { 9: { owner: 'p1', side: 'cheer' } };
  const err = (space, pid = 'p0') => validateAction({ ...s, turn: Number(pid[1]) }, pid, { type: 'tile', space, side: 'boo' });
  assert.match(err(1), /never space 1/);
  assert.match(err(3), /camels/);
  assert.match(err(9), /Another spectator tile/);
  assert.match(err(8), /Too close/);
  assert.match(err(10), /Too close/);
  assert.equal(err(11), null);
  assert.equal(err(2), null);
  // p1 may move its own tile next to where it currently is…
  assert.equal(err(10, 'p1'), null);
  // …or flip it over where it is (its cheering tile on 9 → booing), but not "flip" it to the side it already shows
  assert.equal(err(9, 'p1'), null);
  assert.match(validateAction({ ...s, turn: 1 }, 'p1', { type: 'tile', space: 9, side: 'cheer' }), /already shows cheering/);
  assert.deepEqual(validTileSpaces(s, 'p0'), [2, 4, 5, 7, 11, 12, 13, 15]);
  assert.ok(validTileSpaces(s, 'p1').includes(9));
});

test('a spectator tile can be flipped over on its own space', () => {
  let s = game(3, { stacks: { 1: RACING_CAMELS, 14: ['white'], 16: ['black'] } });
  ({ state: s } = applyAction(s, 'p0', { type: 'tile', space: 5, side: 'cheer' }));
  s.turn = 0;
  assert.deepEqual(legalActions(s, 'p0').filter((a) => a.type === 'tile' && a.space === 5), [{ type: 'tile', space: 5, side: 'boo' }]);
  let events;
  ({ state: s, events } = applyAction(s, 'p0', { type: 'tile', space: 5, side: 'boo' }));
  assert.deepEqual(s.tiles, { 5: { owner: 'p0', side: 'boo' } });
  assert.deepEqual(events[0], { t: 'placeTile', player: 'p0', space: 5, side: 'boo', from: 5 });
});

test('moving a spectator tile removes it from its old space', () => {
  let s = game(3, { stacks: { 1: RACING_CAMELS, 14: ['white'], 16: ['black'] } });
  ({ state: s } = applyAction(s, 'p0', { type: 'tile', space: 5, side: 'cheer' }));
  s.turn = 0;
  ({ state: s } = applyAction(s, 'p0', { type: 'tile', space: 6, side: 'boo' }));
  assert.deepEqual(s.tiles, { 6: { owner: 'p0', side: 'boo' } });
});

test('finish cards: one per colour, piles keep placing order', () => {
  let s = game(2);
  ({ state: s } = applyAction(s, 'p0', { type: 'finishBet', pile: 'winner', color: 'blue' }));
  ({ state: s } = applyAction(s, 'p1', { type: 'finishBet', pile: 'winner', color: 'green' }));
  ({ state: s } = applyAction(s, 'p0', { type: 'finishBet', pile: 'loser', color: 'red' }));
  assert.deepEqual(s.winnerBets, [{ player: 'p0', color: 'blue' }, { player: 'p1', color: 'green' }]);
  assert.deepEqual(s.players[0].finishCards, ['yellow', 'green', 'purple']);
  assert.match(validateAction(s, 'p1', { type: 'finishBet', pile: 'loser', color: 'green' }), /already played/);
});

test('only the current player may act', () => {
  const s = game(3);
  assert.throws(() => applyAction(s, 'p1', { type: 'roll' }), /not your turn/);
});

test('viewFor hides other players’ secrets but not your own', () => {
  let s = game(3);
  ({ state: s } = applyAction(s, 'p0', { type: 'finishBet', pile: 'winner', color: 'blue' }));
  const v1 = viewFor(s, 'p1');
  assert.equal(v1.rng, undefined);
  assert.equal(v1.players[0].finishCards, null);
  assert.equal(v1.players[0].handCount, 4);
  assert.deepEqual(v1.winnerBets, [{ player: 'p0' }]);
  assert.equal(v1.log.find((e) => e.t === 'finishBet').color, null);
  const v0 = viewFor(s, 'p0');
  assert.deepEqual(v0.winnerBets, [{ player: 'p0', color: 'blue' }]);
});

// ─── Whole games ─────────────────────────────────────────────────────────────

test('thousands of random games keep every invariant and always finish', () => {
  const holder = { rng: hashSeed('fuzz') };
  let legsTotal = 0;
  for (let g = 0; g < 1500; g++) {
    const n = 2 + (g % 7);
    const players = Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, character: 'x' }));
    let s = createGame({ players, seed: g });
    let steps = 0;
    while (s.status === 'playing') {
      const pid = s.players[s.turn].id;
      const acts = legalActions(s, pid);
      assert.ok(acts.length > 0);
      // Roll often so games finish; otherwise any legal action.
      const act = rand(holder) < 0.55 ? { type: 'roll' } : acts[Math.floor(rand(holder) * acts.length)];
      const legBefore = s.leg;
      s = applyAction(s, pid, act).state;
      if (s.leg !== legBefore) legsTotal++;
      // invariants
      const all = Object.values(s.stacks).flat();
      assert.equal(all.length, 7);
      assert.deepEqual([...all].sort(), [...ALL_CAMELS].sort());
      for (const key in s.tiles) assert.ok(!s.stacks[key], 'no camel rests on a spectator tile');
      for (const p of s.players) assert.ok(p.coins >= 0);
      assert.ok(s.rolled.length <= 5);
      assert.equal(s.pyramidLeft, 5 - s.rolled.length);
      if (s.status === 'playing') {
        for (const key in s.stacks) assert.ok(Number(key) >= 1 && Number(key) <= 16);
      }
      assert.ok(++steps < 5000, 'game terminates');
    }
    assert.equal(ranking(s).length, 5);
    assert.ok(s.final.winners.length >= 1);
  }
  assert.ok(legsTotal > 1500);
});

test('the same seed replays the same game', () => {
  const players = [0, 1, 2].map((i) => ({ id: `p${i}`, name: `P${i}`, character: 'x' }));
  const a = createGame({ players, seed: 'same' });
  const b = createGame({ players, seed: 'same' });
  assert.deepEqual(a.stacks, b.stacks);
  const ra = applyAction(a, a.players[a.turn].id, { type: 'roll' }).state;
  const rb = applyAction(b, b.players[b.turn].id, { type: 'roll' }).state;
  assert.deepEqual(ra.stacks, rb.stacks);
  assert.deepEqual(ra.rolled, rb.rolled);
});
