// "Crazier Camels" mode tests. Run with:  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, applyAction, ranking } from '../js/engine/game.js';
import { RACING_CAMELS } from '../js/engine/constants.js';
import { chooseBotAction, simulateLeg, simulateRace } from '../js/ai/bot.js';

function game(patch = {}, n = 3) {
  const players = Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, character: 'explorer' }));
  const s = createGame({ players, seed: 11, startPlayer: 0, mode: 'crazier' });
  return Object.assign(s, patch);
}
/** Roll a chosen coloured die, then the grey die beside the pyramid. */
const roll = (s, die, value, crazy) =>
  applyAction(s, s.players[s.turn].id, { type: 'roll' }, { roll: { die, value, crazy } });
const spaceOf = (s, camel) => Number(Object.keys(s.stacks).find((k) => s.stacks[k].includes(camel)));

test('the grey die is not in the pyramid: 5 coloured dice per leg', () => {
  const s = game();
  assert.equal(s.mode, 'crazier');
  assert.deepEqual([...s.diceLeft].sort(), [...RACING_CAMELS].sort());
  // classic games still have the grey die in the pyramid
  const classic = createGame({ players: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], seed: 1 });
  assert.equal(classic.mode, 'classic');
  assert.ok(classic.diceLeft.includes('grey'));
});

test('every pyramid roll moves a coloured camel and then a crazy camel', () => {
  let s = game({ stacks: { 1: ['blue'], 2: ['yellow'], 3: ['green', 'red', 'purple'], 10: ['white'], 14: ['black'] } });
  const { state, events } = roll(s, 'blue', 2, { value: 3, shown: 'white' });
  const rolls = events.filter((e) => e.t === 'roll');
  assert.equal(rolls.length, 2);
  assert.equal(rolls[0].die, 'blue');
  assert.equal(rolls[1].die, 'grey');
  assert.equal(rolls[1].side, true);
  assert.equal(spaceOf(state, 'blue'), 3);
  assert.equal(spaceOf(state, 'white'), 7);
  assert.deepEqual(state.rolled[0], { die: 'blue', value: 2, shown: null, crazy: { value: 3, shown: 'white', camel: 'white' } });
  assert.equal(state.players[0].pyramidTickets, 1); // still just one pyramid ticket
});

test('a random roll always moves a crazy camel too', () => {
  let s = game();
  for (let i = 0; i < 5; i++) {
    const before = { w: spaceOf(s, 'white'), b: spaceOf(s, 'black') };
    const { state, events } = applyAction(s, s.players[s.turn].id, { type: 'roll' });
    assert.ok(events.some((e) => e.t === 'roll' && e.side), 'grey die rolled');
    if (state.status === 'playing' && state.leg === 1) {
      assert.ok(spaceOf(state, 'white') !== before.w || spaceOf(state, 'black') !== before.b, 'a crazy camel moved');
    }
    s = state;
  }
});

test('the leg ends once all 5 coloured dice are out, and the pyramid refills without the grey die', () => {
  let s = game({ stacks: { 1: ['blue', 'yellow', 'green', 'red', 'purple'], 10: ['white'], 12: ['black'] } });
  for (const die of ['blue', 'yellow', 'green', 'red']) ({ state: s } = roll(s, die, 1, { value: 1, shown: 'black' }));
  assert.equal(s.leg, 1);
  assert.deepEqual(s.diceLeft, ['purple']);
  const { state, events } = roll(s, 'purple', 1, { value: 1, shown: 'black' });
  assert.ok(events.some((e) => e.t === 'legEnd'));
  assert.equal(state.leg, 2);
  assert.deepEqual([...state.diceLeft].sort(), [...RACING_CAMELS].sort());
});

test('a crazy camel passing space 1 loops round to 16 and keeps going', () => {
  let s = game({ stacks: { 5: RACING_CAMELS.slice(), 2: ['white'], 9: ['black'] } });
  const { state, events } = roll(s, 'blue', 1, { value: 3, shown: 'white' });
  assert.equal(state.status, 'playing', 'the race does not end');
  assert.equal(spaceOf(state, 'white'), 15); // 2 → 1 → 16 → 15
  const loop = events.find((e) => e.t === 'loop');
  assert.deepEqual(loop.path, [16, 15]);
  assert.deepEqual(loop.dropped, []);
});

test('from space 1: one step lands on 16, three steps on 14', () => {
  let s = game({ stacks: { 5: RACING_CAMELS.slice(), 1: ['white'], 9: ['black'] } });
  assert.equal(spaceOf(roll(s, 'blue', 1, { value: 1, shown: 'white' }).state, 'white'), 16);
  assert.equal(spaceOf(roll(s, 'blue', 1, { value: 3, shown: 'white' }).state, 'white'), 14);
});

test('landing exactly on space 1 keeps the riders on board', () => {
  let s = game({ stacks: { 3: ['white', 'red'], 6: ['blue', 'yellow', 'green', 'purple'], 9: ['black'] } });
  const { state } = roll(s, 'blue', 1, { value: 2, shown: 'black' }); // white carries red, so white must move
  assert.deepEqual(state.stacks[1], ['white', 'red']);
});

test('racing camels carried past space 1 are dropped off there; the crazy camel carries on', () => {
  let s = game({ stacks: { 1: ['yellow'], 2: ['white', 'red', 'black', 'green'], 6: ['blue', 'purple'] } });
  // white is the only crazy camel carrying racers... black carries green too, so the die decides: white
  const { state, events } = roll(s, 'blue', 1, { value: 3, shown: 'white' });
  // white took red, black and green with it; red and green get off at 1 (on top of yellow),
  // black keeps riding white round to 15
  assert.deepEqual(state.stacks[1], ['yellow', 'red', 'green']);
  assert.deepEqual(state.stacks[15], ['white', 'black']);
  const loop = events.find((e) => e.t === 'loop');
  assert.deepEqual(loop.dropped, ['red', 'green']);
  assert.deepEqual(loop.unit, ['white', 'black']);
  assert.equal(state.status, 'playing');
  // the dropped camels are simply on space 1 now
  assert.equal(ranking(state).at(-1), 'yellow');
});

test('spectator tiles still work after the loop', () => {
  let s = game({ stacks: { 5: RACING_CAMELS.slice(), 2: ['white'], 9: ['black'] }, tiles: { 15: { owner: 'p1', side: 'cheer' } } });
  const { state } = roll(s, 'blue', 1, { value: 3, shown: 'white' });
  assert.equal(spaceOf(state, 'white'), 14); // cheered one more space round the loop
  assert.equal(state.players[1].coins, 4);
});

test('a crazy camel booed forward off space 16 comes round to space 1, underneath', () => {
  let s = game({ stacks: { 1: ['purple'], 5: ['blue', 'yellow', 'green', 'red'], 3: ['white'], 9: ['black'] }, tiles: { 16: { owner: 'p2', side: 'boo' } } });
  const { state, events } = roll(s, 'blue', 1, { value: 3, shown: 'white' }); // 3 → 2 → 1 → 16, booed → 1
  assert.deepEqual(state.stacks[1], ['white', 'purple']);
  assert.equal(state.status, 'playing');
  assert.deepEqual(events.find((e) => e.t === 'tileEffect').path, [1]);
});

test('no grey roll when the coloured camel ends the race', () => {
  let s = game({ stacks: { 16: ['blue'], 2: ['yellow', 'green', 'red', 'purple'], 10: ['white'], 12: ['black'] } });
  const { state, events } = roll(s, 'blue', 1, { value: 2, shown: 'white' });
  assert.equal(state.status, 'finished');
  assert.equal(events.filter((e) => e.t === 'roll').length, 1);
  assert.equal(spaceOf(state, 'white'), 10);
});

test('bots and odds understand Crazier Camels', () => {
  const s = game();
  const leg = simulateLeg(s, 200);
  const race = simulateRace(s, 100);
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum(leg.first) - 1) < 1e-9);
  assert.ok(Math.abs(sum(race.win) - 1) < 1e-9);
  let g = s;
  for (let i = 0; i < 40 && g.status === 'playing'; i++) {
    const pid = g.players[g.turn].id;
    g = applyAction(g, pid, chooseBotAction(g, pid, i % 2 ? 'easy' : 'clever')).state;
  }
  assert.ok(g.leg > 1 || g.status === 'finished');
});
