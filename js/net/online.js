// ─────────────────────────────────────────────────────────────────────────────
//  Online play: everyone on their own phone.
//
//  How it works (no server of our own needed):
//  - The HOST's browser runs the real game (rules engine + bots) and is the
//    single source of truth.
//  - Everyone else is a GUEST. Guests connect straight to the host with WebRTC
//    (via the free PeerJS service, which only helps browsers find each other).
//  - Guests send "I'd like to do X"; the host checks it against the rules,
//    applies it, and sends each guest their own view of the game (other
//    players' secret cards stay hidden).
//  - If anyone refreshes or loses signal, they rejoin with the same seat.
// ─────────────────────────────────────────────────────────────────────────────

import { createGame, applyAction, viewFor, eventsFor, validateAction, RuleError } from '../engine/game.js';
import { MAX_PLAYERS, MIN_PLAYERS } from '../engine/constants.js';
import { CHARACTERS } from '../art/characters.js';
import { SessionBase, BotDriver } from './session.js';
import { saveJSON, getPrefs, setPrefs } from '../ui/prefs.js';

const PREFIX = 'oasis-derby-v1-';
const PROTOCOL = 1;
const CODE_ALPHABET = 'BCDFGHJKLMNPQRSTVWXZ';
export const HOST_SAVE_KEY = 'oasis-derby:host';
export const GUEST_SAVE_KEY = 'oasis-derby:guest';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const randomCode = () =>
  Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');
export const cleanCode = (s) => (s || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);

let peerLoading = null;
export function loadPeerJS() {
  if (window.Peer) return Promise.resolve(window.Peer);
  peerLoading ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = new URL('../../vendor/peerjs.min.js', import.meta.url).href;
    s.onload = () => (window.Peer ? resolve(window.Peer) : reject(new Error('The online module did not load.')));
    s.onerror = () => {
      peerLoading = null;
      reject(new Error('Could not load the online module. Check your internet connection.'));
    };
    document.head.appendChild(s);
  });
  return peerLoading;
}

/** Keep the screen awake during online games (where supported). */
class WakeLock {
  constructor() {
    this.lock = null;
    this.wanted = false;
    this.onVis = () => document.visibilityState === 'visible' && this.wanted && this.acquire();
    document.addEventListener('visibilitychange', this.onVis);
  }
  async acquire() {
    this.wanted = true;
    try {
      this.lock = await navigator.wakeLock?.request('screen');
    } catch {
      /* not supported or not allowed */
    }
  }
  release() {
    this.wanted = false;
    try {
      this.lock?.release();
    } catch {
      /* ignore */
    }
    document.removeEventListener('visibilitychange', this.onVis);
  }
}

function freeCharacter(seats, wanted, exceptSeat) {
  const taken = new Set(seats.filter((s) => s.id !== exceptSeat).map((s) => s.character));
  if (wanted && !taken.has(wanted)) return wanted;
  return CHARACTERS.find((c) => !taken.has(c.id))?.id || CHARACTERS[0].id;
}

// ─── Host ────────────────────────────────────────────────────────────────────

export class HostSession extends SessionBase {
  static async create({ name, character, clientId, resume = null }) {
    const Peer = await loadPeerJS();
    const host = new HostSession(Peer, { name, character, clientId, resume });
    await host.open();
    return host;
  }

  constructor(Peer, { name, character, clientId, resume }) {
    super();
    this.kind = 'host';
    this.Peer = Peer;
    this.clientId = clientId;
    this.resumed = !!resume;
    this.code = resume?.code || randomCode();
    this.seats = resume?.seats || [{ id: 'h', name, character, host: true, clientId }];
    this.state = resume?.state || null;
    this.takeover = new Set(resume?.takeover || []);
    this.conns = new Map(); // DataConnection -> { seatId, lastSeen }
    this.seatSeq = resume?.seatSeq || 1;
    this.mode = resume?.mode || getPrefs().mode || 'classic';
    this.myIds = this.seats.some((s) => s.id === 'h') ? ['h'] : [];
    this.bots = new BotDriver(this, (p) => this.botLevel(p.id));
    this.wake = new WakeLock();
    this.wake.acquire();
    this.refreshLobby();
  }

  async open() {
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        await this.startPeer();
        this.setStatus('ok', '');
        this.persist();
        this.bots.poke(1200);
        return;
      } catch (err) {
        if (err?.type === 'unavailable-id') {
          if (this.resumed) {
            // our old connection is still registered; wait for it to expire
            this.setStatus('warn', 'Re-opening your room…');
            await sleep(2500);
          } else {
            this.code = randomCode();
          }
          continue;
        }
        throw new Error(friendlyError(err));
      }
    }
    throw new Error('Could not open a room right now. Please try again.');
  }

  startPeer() {
    return new Promise((resolve, reject) => {
      const peer = new this.Peer(PREFIX + this.code, { debug: 1 });
      const onError = (err) => {
        peer.destroy();
        reject(err);
      };
      peer.on('error', onError);
      peer.once('open', () => {
        peer.off('error', onError);
        this.peer = peer;
        this.wirePeer(peer);
        resolve();
      });
    });
  }

  wirePeer(peer) {
    peer.on('connection', (conn) => this.onConnection(conn));
    peer.on('disconnected', () => {
      if (this.closed) return;
      this.setStatus('warn', 'Lost the lobby server — reconnecting…');
      setTimeout(() => !this.closed && !peer.destroyed && peer.reconnect(), 1500);
    });
    peer.on('open', () => this.setStatus('ok', ''));
    peer.on('error', (err) => {
      if (this.closed) return;
      if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(err.type)) {
        this.setStatus('warn', 'Connection trouble — retrying…');
      }
    });
    clearInterval(this.heartbeat);
    this.heartbeat = setInterval(() => this.beat(), 4000);
  }

  beat() {
    const now = Date.now();
    let changed = false;
    for (const [conn, info] of this.conns) {
      if (now - info.lastSeen > 15000) {
        this.dropConn(conn, false);
        changed = true;
        continue;
      }
      this.send(conn, { t: 'ping', ts: now });
    }
    if (changed) this.broadcastLobby();
  }

  onConnection(conn) {
    this.conns.set(conn, { seatId: undefined, lastSeen: Date.now() });
    conn.on('data', (msg) => this.onMessage(conn, msg));
    conn.on('close', () => this.dropConn(conn, true));
    conn.on('error', () => this.dropConn(conn, true));
  }

  dropConn(conn, broadcast) {
    const info = this.conns.get(conn);
    if (!info) return;
    this.conns.delete(conn);
    try {
      conn.close();
    } catch {
      /* ignore */
    }
    const seat = this.seats.find((s) => s.id === info.seatId);
    if (seat && ![...this.conns.values()].some((i) => i.seatId === seat.id)) {
      seat.connected = false;
      if (!this.state) {
        // still in the lobby: free the seat after a short grace period
        setTimeout(() => {
          if (!seat.connected && !this.state) {
            this.seats = this.seats.filter((s) => s !== seat);
            this.broadcastLobby();
          }
        }, 20000);
      }
    }
    if (broadcast) this.broadcastLobby();
  }

  send(conn, msg) {
    try {
      if (conn.open) conn.send(msg);
    } catch {
      /* ignore */
    }
  }

  onMessage(conn, msg) {
    const info = this.conns.get(conn);
    if (!info || !msg || typeof msg !== 'object') return;
    info.lastSeen = Date.now();
    switch (msg.t) {
      case 'hello':
        return this.onHello(conn, info, msg);
      case 'profile': {
        const seat = this.seats.find((s) => s.id === info.seatId);
        if (!seat || this.state) return;
        seat.name = String(msg.name || seat.name).slice(0, 18) || seat.name;
        seat.character = freeCharacter(this.seats, msg.character, seat.id);
        return this.broadcastLobby();
      }
      case 'act': {
        if (!this.state || !info.seatId) return;
        try {
          this.act(info.seatId, msg.action);
        } catch (err) {
          this.send(conn, { t: 'error', message: err instanceof RuleError ? err.message : 'That did not work.' });
        }
        return;
      }
      case 'bye': {
        const seat = this.seats.find((s) => s.id === info.seatId);
        this.conns.delete(conn);
        if (seat && !this.state) this.seats = this.seats.filter((s) => s !== seat);
        else if (seat) seat.connected = false;
        return this.broadcastLobby();
      }
      default:
        return; // 'pong' just refreshes lastSeen
    }
  }

  onHello(conn, info, msg) {
    if (msg.v !== PROTOCOL) {
      this.send(conn, { t: 'error', fatal: true, message: 'This room runs a different version of the game. Please refresh the page.' });
      return;
    }
    let seat = this.seats.find((s) => s.clientId && s.clientId === msg.clientId && !s.host);
    if (!seat && !this.state) {
      if (this.seats.length >= MAX_PLAYERS) {
        this.send(conn, { t: 'full' });
        return;
      }
      seat = {
        id: `g${this.seatSeq++}`,
        name: String(msg.name || 'Guest').slice(0, 18),
        character: freeCharacter(this.seats, msg.character),
        clientId: msg.clientId,
      };
      this.seats.push(seat);
    }
    info.seatId = seat ? seat.id : null; // null = watching only
    if (seat) {
      seat.connected = true;
      if (this.takeover.delete(seat.id)) this.bots.poke();
    }
    this.send(conn, { t: 'welcome', seatId: info.seatId, lobby: this.lobbyInfo() });
    if (this.state) {
      this.send(conn, { t: 'game', state: viewFor(this.state, info.seatId), events: [], lobby: this.lobbyInfo(), reset: true });
    }
    this.broadcastLobby();
  }

  lobbyInfo() {
    return {
      code: this.code,
      started: !!this.state,
      mode: this.mode,
      seats: this.seats.map((s) => ({
        id: s.id,
        name: s.name,
        character: s.character,
        bot: s.bot || null,
        host: !!s.host,
        connected: s.host || s.bot ? true : !!s.connected,
        takeover: this.takeover.has(s.id),
      })),
    };
  }

  refreshLobby() {
    this.lobby = this.lobbyInfo();
    this.myIds = this.seats.some((s) => s.id === 'h') ? ['h'] : [];
  }

  broadcastLobby() {
    this.refreshLobby();
    for (const conn of this.conns.keys()) this.send(conn, { t: 'lobby', lobby: this.lobby });
    this.persist();
    this.emit();
  }

  broadcastGame(events, reset = false) {
    const finished = this.state.status === 'finished';
    this.refreshLobby();
    for (const [conn, info] of this.conns) {
      if (info.seatId === undefined) continue;
      this.send(conn, {
        t: 'game',
        state: viewFor(this.state, info.seatId),
        events: eventsFor(events, info.seatId, finished),
        lobby: this.lobby,
        reset,
      });
    }
  }

  botLevel(seatId) {
    const seat = this.seats.find((s) => s.id === seatId);
    if (!seat) return null;
    return seat.bot || (this.takeover.has(seatId) ? 'clever' : null);
  }

  // ── host controls ──
  addBot(level = 'clever') {
    if (this.seats.length >= MAX_PLAYERS || this.state) return;
    const character = freeCharacter(this.seats);
    const ch = CHARACTERS.find((c) => c.id === character);
    this.seats.push({ id: `b${this.seatSeq++}`, name: ch.name, character, bot: level });
    this.broadcastLobby();
  }
  setBotLevel(seatId, level) {
    const seat = this.seats.find((s) => s.id === seatId);
    if (seat?.bot) seat.bot = level;
    this.broadcastLobby();
  }
  removeSeat(seatId) {
    if (this.state || seatId === 'h') return;
    for (const [conn, info] of this.conns) {
      if (info.seatId === seatId) {
        this.send(conn, { t: 'kicked' });
        this.conns.delete(conn);
        setTimeout(() => conn.close(), 300);
      }
    }
    this.seats = this.seats.filter((s) => s.id !== seatId);
    this.broadcastLobby();
  }
  setHostPlaying(playing, profile) {
    if (this.state) return;
    const has = this.seats.some((s) => s.id === 'h');
    if (playing && !has && this.seats.length < MAX_PLAYERS) {
      this.seats.unshift({ id: 'h', host: true, clientId: this.clientId, name: profile.name, character: freeCharacter(this.seats, profile.character) });
    } else if (!playing && has) {
      this.seats = this.seats.filter((s) => s.id !== 'h');
    }
    this.broadcastLobby();
  }
  setHostProfile({ name, character }) {
    const seat = this.seats.find((s) => s.id === 'h');
    if (!seat || this.state) return;
    seat.name = name || seat.name;
    seat.character = freeCharacter(this.seats, character, 'h');
    this.broadcastLobby();
  }
  shuffleSeats() {
    if (this.state) return;
    for (let i = this.seats.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.seats[i], this.seats[j]] = [this.seats[j], this.seats[i]];
    }
    this.broadcastLobby();
  }
  setMode(mode) {
    if (this.state) return;
    this.mode = mode;
    setPrefs({ mode });
    this.broadcastLobby();
  }
  setTakeover(seatId, on) {
    if (on) this.takeover.add(seatId);
    else this.takeover.delete(seatId);
    this.broadcastLobby();
    this.bots.poke(300);
  }
  startGame() {
    if (this.seats.length < MIN_PLAYERS) throw new Error(`You need at least ${MIN_PLAYERS} riders.`);
    this.state = createGame({
      players: this.seats.map((s) => ({ id: s.id, name: s.name, character: s.character, bot: s.bot || null })),
      mode: this.mode,
    });
    this.broadcastGame([], true);
    this.persist();
    this.emit({ events: [], state: this.state, reset: true });
    this.bots.poke(1400);
  }
  rematch() {
    this.state = null;
    this.startGame();
  }
  backToLobby() {
    this.state = null;
    this.takeover.clear();
    this.seats = this.seats.filter((s) => s.host || s.bot || s.connected);
    this.broadcastLobby();
    for (const conn of this.conns.keys()) this.send(conn, { t: 'lobbyReset', lobby: this.lobby });
    this.emit({ events: [], state: null, reset: true });
  }

  act(playerId, action) {
    const { state, events } = applyAction(this.state, playerId, action);
    this.state = state;
    this.persist();
    this.broadcastGame(events);
    this.emit({ events, state });
    this.bots.poke();
  }

  persist() {
    saveJSON(HOST_SAVE_KEY, {
      code: this.code,
      seats: this.seats.map(({ connected, ...s }) => s),
      state: this.state,
      takeover: [...this.takeover],
      seatSeq: this.seatSeq,
      mode: this.mode,
      savedAt: Date.now(),
    });
  }

  destroy({ forget = true } = {}) {
    this.closed = true;
    for (const conn of this.conns.keys()) this.send(conn, { t: 'closed' });
    clearInterval(this.heartbeat);
    this.bots.stop();
    this.wake.release();
    setTimeout(() => this.peer?.destroy(), 300);
    if (forget) saveJSON(HOST_SAVE_KEY, null);
  }
}

// ─── Guest ───────────────────────────────────────────────────────────────────

export class GuestSession extends SessionBase {
  static async join({ code, name, character, clientId }) {
    const Peer = await loadPeerJS();
    const guest = new GuestSession(Peer, { code, name, character, clientId });
    await guest.connect(true);
    return guest;
  }

  constructor(Peer, { code, name, character, clientId }) {
    super();
    this.kind = 'guest';
    this.Peer = Peer;
    this.code = code;
    this.profile = { name, character };
    this.clientId = clientId;
    this.seatId = null;
    this.retry = 0;
    this.wake = new WakeLock();
    this.wake.acquire();
  }

  ensurePeer() {
    if (this.peer && !this.peer.destroyed && !this.peer.disconnected) return Promise.resolve(this.peer);
    try {
      this.peer?.destroy();
    } catch {
      /* ignore */
    }
    return new Promise((resolve, reject) => {
      const peer = new this.Peer({ debug: 1 });
      const timer = setTimeout(() => reject(new Error('Could not reach the online service. Check your internet.')), 12000);
      peer.on('open', () => {
        clearTimeout(timer);
        this.peer = peer;
        resolve(peer);
      });
      peer.on('error', (err) => {
        clearTimeout(timer);
        if (err.type === 'peer-unavailable') this.onPeerUnavailable?.();
        else if (!this.peer) reject(new Error(friendlyError(err)));
      });
      peer.on('disconnected', () => {
        if (!this.closed) setTimeout(() => !peer.destroyed && peer.reconnect(), 1000);
      });
    });
  }

  connect(first = false) {
    return new Promise(async (resolve, reject) => {
      let settled = false;
      const done = (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.onPeerUnavailable = null;
        err ? reject(err) : resolve();
      };
      const timer = setTimeout(
        () => done(new Error("Couldn't reach the host. Make sure the host's screen is on, then try again.")),
        16000
      );
      try {
        const peer = await this.ensurePeer();
        this.onPeerUnavailable = () =>
          done(new Error(first ? `No room called ${this.code}. Check the code with the host.` : 'The room is not available right now.'));
        try {
          this.conn?.close();
        } catch {
          /* ignore */
        }
        const conn = peer.connect(PREFIX + this.code, { reliable: true, serialization: 'json' });
        this.conn = conn;
        this.welcomed = () => done();
        conn.on('open', () => {
          this.lastHeard = Date.now();
          conn.send({ t: 'hello', v: PROTOCOL, clientId: this.clientId, ...this.profile });
        });
        conn.on('data', (msg) => this.onMessage(msg, done));
        conn.on('close', () => conn === this.conn && this.onLost());
        conn.on('error', () => conn === this.conn && this.onLost());
      } catch (err) {
        done(err);
      }
    });
  }

  onMessage(msg, done) {
    if (!msg || typeof msg !== 'object') return;
    this.lastHeard = Date.now();
    switch (msg.t) {
      case 'welcome':
        this.seatId = msg.seatId;
        this.myIds = msg.seatId ? [msg.seatId] : [];
        this.lobby = msg.lobby;
        this.retry = 0;
        this.setStatus('ok', '');
        this.startWatchdog();
        saveJSON(GUEST_SAVE_KEY, { code: this.code, savedAt: Date.now() });
        this.welcomed?.();
        this.emit();
        return;
      case 'lobby':
        this.lobby = msg.lobby;
        return this.emit();
      case 'lobbyReset':
        this.lobby = msg.lobby;
        this.state = null;
        return this.emit({ events: [], state: null, reset: true });
      case 'game': {
        const prev = this.state;
        this.state = msg.state;
        if (msg.lobby) this.lobby = msg.lobby;
        const gap = !prev || msg.reset || msg.state.seq !== prev.seq + 1;
        return this.emit({ events: msg.events || [], state: msg.state, reset: gap });
      }
      case 'ping':
        try {
          this.conn.send({ t: 'pong', ts: msg.ts });
        } catch {
          /* ignore */
        }
        return;
      case 'error':
        if (msg.fatal) {
          this.closed = true;
          done?.(new Error(msg.message));
        }
        return this.emit({ error: msg.message });
      case 'full':
        this.closed = true;
        done?.(new Error('That room is full (8 riders max).'));
        return this.emit({ error: 'That room is full.' });
      case 'kicked':
        this.closed = true;
        saveJSON(GUEST_SAVE_KEY, null);
        return this.emit({ ended: 'The host removed you from the room.' });
      case 'closed':
        this.closed = true;
        saveJSON(GUEST_SAVE_KEY, null);
        return this.emit({ ended: 'The host closed the room.' });
      default:
        return;
    }
  }

  startWatchdog() {
    clearInterval(this.watchdog);
    this.watchdog = setInterval(() => {
      if (!this.closed && Date.now() - this.lastHeard > 15000) this.onLost();
    }, 3000);
  }

  onLost() {
    if (this.closed || this.reconnecting) return;
    this.reconnecting = true;
    this.setStatus('warn', 'Connection lost — reconnecting…');
    const attempt = async () => {
      if (this.closed) return;
      try {
        await this.connect(false);
        this.reconnecting = false;
      } catch {
        this.retry++;
        this.setStatus('warn', `Reconnecting… (try ${this.retry})`);
        setTimeout(attempt, Math.min(8000, 1000 * 2 ** Math.min(this.retry, 3)));
      }
    };
    setTimeout(attempt, 800);
  }

  act(playerId, action) {
    if (this.state) {
      const problem = validateAction(this.state, playerId, action);
      if (problem) throw new RuleError(problem);
    }
    if (!this.conn?.open) throw new Error('Not connected to the host right now.');
    this.conn.send({ t: 'act', action });
  }

  setProfile(profile) {
    this.profile = profile;
    try {
      this.conn?.send({ t: 'profile', ...profile });
    } catch {
      /* ignore */
    }
  }

  destroy() {
    this.closed = true;
    clearInterval(this.watchdog);
    this.wake.release();
    try {
      this.conn?.send({ t: 'bye' });
    } catch {
      /* ignore */
    }
    saveJSON(GUEST_SAVE_KEY, null);
    setTimeout(() => this.peer?.destroy(), 300);
  }
}

function friendlyError(err) {
  switch (err?.type) {
    case 'browser-incompatible':
      return 'This browser cannot play online. Try Chrome, Safari or Edge.';
    case 'network':
    case 'server-error':
    case 'socket-error':
    case 'socket-closed':
      return 'Could not reach the online service. Check your internet and try again.';
    case 'ssl-unavailable':
      return 'Online play needs a secure (https) address.';
    default:
      return err?.message || 'Something went wrong going online.';
  }
}
