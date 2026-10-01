// Bot tests. Run with:  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, applyAction, legalActions, validateAction } from '../js/engine/game.js';
import { chooseBotAction, simulateLeg, simulateRace } from '../js/ai/bot.js';

const players = (n) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, character: 'x' }));

test('odds add up to 100%', () => {
  const s = createGame({ players: players(3), seed: 1 });
  const leg = simulateLeg(s, 2000);
  const race = simulateRace(s, 500);
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum(leg.first) - 1) < 1e-9);
  assert.ok(Math.abs(sum(leg.second) - 1) < 1e-9);
  assert.ok(Math.abs(sum(race.win) - 1) < 1e-9);
  assert.ok(Math.abs(sum(race.lose) - 1) < 1e-9);
});

test('bots always choose legal actions, quickly', () => {
  let s = createGame({ players: players(6), seed: 3 });
  let slowest = 0;
  let moves = 0;
  while (s.status === 'playing' && moves < 400) {
    const pid = s.players[s.turn].id;
    const t0 = performance.now();
    const act = chooseBotAction(s, pid, moves % 2 ? 'easy' : 'clever');
    slowest = Math.max(slowest, performance.now() - t0);
    assert.equal(validateAction(s, pid, act), null, JSON.stringify(act));
    s = applyAction(s, pid, act).state;
    moves++;
  }
  assert.equal(s.status, 'finished');
  assert.ok(slowest < 1500, `slowest decision ${slowest.toFixed(0)}ms`);
});

test('clever bots beat random players', () => {
  let clever = 0;
  let random = 0;
  const games = 24;
  for (let g = 0; g < games; g++) {
    let s = createGame({ players: players(4), seed: 100 + g });
    while (s.status === 'playing') {
      const pid = s.players[s.turn].id;
      const isBot = pid === 'p0' || pid === 'p2';
      let act;
      if (isBot) act = chooseBotAction(s, pid, 'clever');
      else {
        const acts = legalActions(s, pid);
        act = Math.random() < 0.4 ? { type: 'roll' } : acts[Math.floor(Math.random() * acts.length)];
      }
      s = applyAction(s, pid, act).state;
    }
    const coins = Object.fromEntries(s.players.map((p) => [p.id, p.coins]));
    clever += coins.p0 + coins.p2;
    random += coins.p1 + coins.p3;
  }
  assert.ok(clever > random * 1.5, `clever ${clever} vs random ${random}`);
});
