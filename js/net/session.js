// ─────────────────────────────────────────────────────────────────────────────
//  Sessions connect the rules engine to the screen.
//
//  Every session (local pass-and-play, online host, online guest) offers:
//    session.state        current game state (or null while in a lobby)
//    session.lobby        online lobby info (null for local games)
//    session.myIds        seat ids this device may act for
//    session.subscribe(fn)  fn(batch) on every change; batch = { events, state } for moves
//    session.act(playerId, action)
//    session.destroy()
// ─────────────────────────────────────────────────────────────────────────────

import { createGame, applyAction, currentPlayer } from '../engine/game.js';
import { chooseBotAction } from '../ai/bot.js';
import { saveJSON } from '../ui/prefs.js';

export const LOCAL_SAVE_KEY = 'oasis-derby:local';

/** How leisurely the bots are. 1 = original speed; 1.3915 = 15% slower, then 10% slower twice more. */
export const BOT_PACE = 1.3915;

export class SessionBase {
  constructor() {
    this.listeners = new Set();
    this.state = null;
    this.lobby = null;
    this.myIds = [];
    this.status = { level: 'ok', text: '' };
    this.idleCheck = () => true;
  }
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit(batch = null) {
    for (const fn of [...this.listeners]) fn(batch);
  }
  /** The game screen tells us when its animations are finished, so bots wait politely. */
  setIdleCheck(fn) {
    this.idleCheck = fn || (() => true);
  }
  setStatus(level, text) {
    this.status = { level, text };
    this.emit();
  }
  destroy() {}
}

/**
 * Plays turns for bot seats (and for disconnected online players the host has
 * handed to a bot). Waits for the screen to finish animating, then "thinks".
 */
export class BotDriver {
  constructor(session, isBotSeat) {
    this.session = session;
    this.isBotSeat = isBotSeat;
    this.timer = null;
    this.waitingSince = 0;
  }
  poke(delay = 650) {
    clearTimeout(this.timer);
    this.waitingSince = Date.now();
    this.timer = setTimeout(() => this.tick(), delay * BOT_PACE);
  }
  tick() {
    const s = this.session.state;
    if (!s || s.status !== 'playing') return;
    const p = currentPlayer(s);
    const level = this.isBotSeat(p);
    if (!level) return;
    const waited = Date.now() - this.waitingSince;
    if (!this.session.idleCheck() && waited < 9000) {
      this.timer = setTimeout(() => this.tick(), 250);
      return;
    }
    // a short, slightly random "thinking" pause feels friendlier
    this.timer = setTimeout(() => {
      const now = this.session.state;
      if (now !== s) return this.poke(100);
      try {
        const action = chooseBotAction(now, p.id, level);
        this.session.act(p.id, action);
      } catch (err) {
        console.error('bot failed', err);
        this.session.act(p.id, { type: 'roll' });
      }
    }, (550 + Math.random() * 650) * BOT_PACE);
  }
  stop() {
    clearTimeout(this.timer);
  }
}

/** Pass-and-play on one device (with optional bots). */
export class LocalSession extends SessionBase {
  constructor({ seats, state = null, seed, mode }) {
    super();
    this.kind = 'local';
    this.seats = seats;
    this.state =
      state ||
      createGame({
        players: seats.map((s) => ({ id: s.id, name: s.name, character: s.character, bot: s.bot || null })),
        seed,
        mode,
      });
    this.myIds = seats.filter((s) => !s.bot).map((s) => s.id);
    this.bots = new BotDriver(this, (p) => p.bot);
    this.persist();
    this.bots.poke(1400);
  }
  act(playerId, action) {
    const { state, events } = applyAction(this.state, playerId, action);
    this.state = state;
    this.persist();
    this.emit({ events, state });
    this.bots.poke();
  }
  rematch() {
    this.state = createGame({
      players: this.seats.map((s) => ({ id: s.id, name: s.name, character: s.character, bot: s.bot || null })),
      mode: this.state.mode,
    });
    this.persist();
    this.emit({ events: [], state: this.state, reset: true });
    this.bots.poke(1400);
  }
  persist() {
    saveJSON(LOCAL_SAVE_KEY, this.state.status === 'playing' ? { seats: this.seats, state: this.state, savedAt: Date.now() } : null);
  }
  destroy() {
    this.bots.stop();
  }
}
