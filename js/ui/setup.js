// Before the race: seating riders (pass & play) or gathering them in an
// online room (with a room code, share link and QR code).
import { html, useEffect, useMemo, useState } from '../../vendor/preact-htm.js';
import qrcode from '../../vendor/qrcode.mjs';
import { MAX_PLAYERS, MIN_PLAYERS, PARTNERSHIP_MIN_PLAYERS, MODE_LABELS } from '../engine/constants.js';
import { Icon, Avatar, CharacterPicker, Sheet, Raw, CamelSprite, toast, copyText, CHARACTERS, characterById } from './common.js';
import { pyramidSVG, loopArrowSVG } from '../art/tokens.js';
import { getPrefs, setPrefs } from './prefs.js';
import { sfx } from './fx.js';

// ─── Game mode ───────────────────────────────────────────────────────────────

const MODE_ART = { classic: pyramidSVG(), crazier: loopArrowSVG() };
const MODE_BLURB = {
  classic: 'The rulebook race. The grey die hides in the pyramid with the others.',
  crazier: 'The grey die sits by the pyramid: a crazy camel moves on every roll, and they loop round the board.',
};

/** Classic or Crazier Camels. Without onChange it just shows the choice (online guests). */
function ModePicker({ value, onChange }) {
  const modes = onChange ? ['classic', 'crazier'] : [value];
  return html`<div class=${`mode-grid game-modes ${onChange ? '' : 'readonly'}`} aria-label="Game mode">
    ${modes.map((m) => {
      const Tag = onChange ? 'button' : 'div';
      return html`<${Tag}
        class=${`mode-card game-mode ${m}`}
        aria-pressed=${onChange ? value === m : undefined}
        onClick=${onChange ? () => (sfx.tap(), onChange(m)) : undefined}
      >
        <span class="mode-art" aria-hidden="true">
          ${m === 'crazier'
            ? html`<${Raw} svg=${MODE_ART.crazier} class="loop" />
                <span class="rider white"><${CamelSprite} camel="white" /></span>
                <span class="rider black"><${CamelSprite} camel="black" /></span>`
            : html`<${Raw} svg=${MODE_ART.classic} class="pyr" />`}
        </span>
        <h3>${MODE_LABELS[m]}</h3>
        <p>${MODE_BLURB[m]}</p>
      </${Tag}>`;
    })}
  </div>`;
}

function freeCharacter(seats, wanted) {
  const taken = new Set(seats.map((s) => s.character));
  if (wanted && !taken.has(wanted)) return wanted;
  const free = CHARACTERS.filter((c) => !taken.has(c.id));
  return free[Math.floor(Math.random() * free.length)]?.id;
}

function SeatRow({ seat, index, you, onRemove, onEdit, onToggleBot, extra }) {
  const ch = characterById(seat.character);
  return html`<div class="seat">
    <span class="seat-no">${index + 1}</span>
    <${Avatar} character=${seat.character} bot=${!!seat.bot} status=${seat.connected === undefined ? null : seat.connected} />
    <div class="who">
      <b>${seat.name}${you ? ' (you)' : ''}</b>
      <span>${ch.name} · ${ch.title}</span>
    </div>
    ${seat.host && html`<span class="tag gold">Host</span>`}
    ${seat.bot &&
    html`<button class="tag teal" title="Tap to change difficulty" onClick=${onToggleBot} disabled=${!onToggleBot}>
      <${Icon} name="bot" size=${13} /> ${seat.bot === 'easy' ? 'Easy' : 'Clever'}
    </button>`}
    ${extra}
    ${onEdit && html`<button class="icon-btn" aria-label=${`Edit ${seat.name}`} onClick=${onEdit}><${Icon} name="palette" size=${18} /></button>`}
    ${onRemove && html`<button class="icon-btn" aria-label=${`Remove ${seat.name}`} onClick=${onRemove}><${Icon} name="x" size=${18} /></button>`}
  </div>`;
}

function ProfileSheet({ title, initial, taken, onSave, onClose, saveLabel = 'Save' }) {
  const [name, setName] = useState(initial.name || '');
  const [character, setCharacter] = useState(initial.character);
  return html`<${Sheet} title=${title} onClose=${onClose}>
    <input class="field" placeholder="Name" maxlength="18" value=${name} onInput=${(e) => setName(e.target.value)} aria-label="Name" />
    <${CharacterPicker} value=${character} onChange=${setCharacter} taken=${taken} />
    <div class="sheet-foot">
      <button class="btn ghost" onClick=${onClose}>Cancel</button>
      <button class="btn" disabled=${!name.trim()} onClick=${() => onSave({ name: name.trim().slice(0, 18), character })}>${saveLabel}</button>
    </div>
  </${Sheet}>`;
}

function Header({ title, onBack }) {
  return html`<header class="masthead" style="padding-top:4px">
    <button class="icon-btn" aria-label="Back" onClick=${onBack}><${Icon} name="arrowLeft" /></button>
    <h1 class="title-xl" style="font-size:32px;flex:1">${title}</h1>
  </header>`;
}

// ─── Pass & play setup ───────────────────────────────────────────────────────

let seatCounter = 0;
const newId = (prefix) => `${prefix}${Date.now().toString(36)}${++seatCounter}`;

export function LocalSetup({ profile, onBack, onStart, onHowTo }) {
  // start with two friendly bots so a solo player can jump right in
  const [seats, setSeats] = useState(() => {
    const out = [{ id: newId('p'), name: profile.name, character: profile.character }];
    for (let i = 0; i < 2; i++) {
      const character = freeCharacter(out);
      out.push({ id: newId('b'), name: characterById(character).name, character, bot: 'clever' });
    }
    return out;
  });
  const [sheet, setSheet] = useState(null);
  const [mode, setModeState] = useState(() => getPrefs().mode || 'crazier');
  const setMode = (m) => {
    setModeState(m);
    setPrefs({ mode: m });
  };

  const taken = (except) => seats.filter((s) => s.id !== except).map((s) => s.character);
  const full = seats.length >= MAX_PLAYERS;

  const addBot = () => {
    if (full) return;
    sfx.tap();
    const character = freeCharacter(seats);
    setSeats([...seats, { id: newId('b'), name: characterById(character).name, character, bot: 'clever' }]);
  };
  const shuffle = () => {
    sfx.tap();
    const a = [...seats];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    setSeats(a);
  };

  return html`<main class="page">
    <${Header} title="Set up the race" onBack=${onBack} />
    <section class="card">
      <h2 class="section-title" style="margin:0 0 10px">Game mode</h2>
      <${ModePicker} value=${mode} onChange=${setMode} />
    </section>
    <section class="card">
      <div class="row" style="margin-bottom:12px">
        <h2 class="section-title grow" style="margin:0">Riders <span class="muted" style="font-family:var(--font);font-size:15px">${seats.length}/${MAX_PLAYERS}</span></h2>
        <button class="chip-btn" onClick=${shuffle} disabled=${seats.length < 2}><${Icon} name="refresh" size=${16} /> Shuffle seats</button>
      </div>
      <div class="seat-list">
        ${seats.map(
          (s, i) => html`<${SeatRow}
            key=${s.id}
            seat=${s}
            index=${i}
            onToggleBot=${s.bot ? () => setSeats(seats.map((x) => (x.id === s.id ? { ...x, bot: x.bot === 'easy' ? 'clever' : 'easy' } : x))) : null}
            onEdit=${s.bot ? null : () => setSheet({ edit: s })}
            onRemove=${seats.length > 1 ? () => setSeats(seats.filter((x) => x.id !== s.id)) : null}
          />`
        )}
      </div>
      <div class="seat-actions">
        <button class="btn ghost small" disabled=${full} onClick=${() => setSheet({ add: true })}><${Icon} name="plus" size=${18} /> Add a player</button>
        <button class="btn ghost small" disabled=${full} onClick=${addBot}><${Icon} name="bot" size=${18} /> Add a bot</button>
      </div>
      <p class="muted" style="font-size:13px;font-weight:700;margin-top:12px">
        Players take turns on this device (seats go clockwise from the top). Race bets are secret, so a
        “no peeking” screen appears when you place one.
        ${seats.length >= PARTNERSHIP_MIN_PLAYERS ? ' With 6+ riders, betting partnerships are in play.' : ''}
      </p>
    </section>
    <button class="btn block" disabled=${seats.length < MIN_PLAYERS} onClick=${() => onStart(seats, mode)}>
      Start the race! <${Icon} name="flag" />
    </button>
    <button class="btn ghost block" onClick=${onHowTo}><${Icon} name="book" /> How to play</button>

    ${sheet?.add &&
    html`<${ProfileSheet}
      title="Add a player"
      initial=${{ name: '', character: freeCharacter(seats) }}
      taken=${taken()}
      saveLabel="Add"
      onClose=${() => setSheet(null)}
      onSave=${(p) => {
        setSeats([...seats, { id: newId('p'), ...p }]);
        setSheet(null);
      }}
    />`}
    ${sheet?.edit &&
    html`<${ProfileSheet}
      title="Edit rider"
      initial=${sheet.edit}
      taken=${taken(sheet.edit.id)}
      onClose=${() => setSheet(null)}
      onSave=${(p) => {
        setSeats(seats.map((x) => (x.id === sheet.edit.id ? { ...x, ...p } : x)));
        if (seats[0]?.id === sheet.edit.id) setPrefs(p);
        setSheet(null);
      }}
    />`}
  </main>`;
}

// ─── Online lobby ────────────────────────────────────────────────────────────

function QR({ text }) {
  const svg = useMemo(() => {
    try {
      const qr = qrcode(0, 'M');
      qr.addData(text);
      qr.make();
      return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    } catch {
      return '';
    }
  }, [text]);
  if (!svg) return null;
  return html`<div class="qr" aria-label="QR code to join" dangerouslySetInnerHTML=${{ __html: svg }}></div>`;
}

export function Lobby({ session, onLeave, onHowTo }) {
  const [, force] = useState(0);
  const [sheet, setSheet] = useState(null);
  useEffect(() => session.subscribe(() => force((n) => n + 1)), [session]);

  const lobby = session.lobby || { seats: [], code: session.code };
  const isHost = session.kind === 'host';
  const link = `${location.origin}${location.pathname}?room=${lobby.code}`;
  const seats = lobby.seats;
  const mySeat = seats.find((s) => session.myIds.includes(s.id));
  const hostPlaying = seats.some((s) => s.id === 'h');
  const status = session.status || {};

  const share = async () => {
    sfx.tap();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Oasis Derby', text: `Join my camel race! Room code ${lobby.code}`, url: link });
        return;
      } catch {
        /* cancelled — fall back to copy */
      }
    }
    if (await copyText(link)) toast('Invite link copied!', 'good');
  };

  const start = () => {
    try {
      session.startGame();
    } catch (err) {
      toast(err.message, 'bad');
    }
  };

  return html`<main class="page">
    <${Header} title=${isHost ? 'Your room' : 'Room'} onBack=${onLeave} />
    <section class="card" style="text-align:center">
      <p class="muted" style="font-weight:800">Share this code with your friends</p>
      <div class="room-code">${lobby.code}</div>
      <div class="room-share" style="margin-top:10px">
        <${QR} text=${link} />
        <div style="display:flex;flex-direction:column;gap:10px;align-items:stretch">
          <button class="btn teal" onClick=${share}><${Icon} name="share" /> Invite</button>
          <button class="btn ghost small" onClick=${async () => (await copyText(link)) && toast('Link copied!', 'good')}><${Icon} name="copy" size=${16} /> Copy link</button>
        </div>
      </div>
      <div class="status-line" style="margin-top:14px">
        <span class=${`pulse-dot ${status.level === 'warn' ? 'warn' : status.level === 'bad' ? 'bad' : ''}`}></span>
        ${status.text || (isHost ? 'Room open — friends can join now' : 'Connected to the host')}
      </div>
    </section>

    <section class="card">
      <div class="row" style="margin-bottom:12px">
        <h2 class="section-title grow" style="margin:0">Riders <span class="muted" style="font-family:var(--font);font-size:15px">${seats.length}/${MAX_PLAYERS}</span></h2>
        ${isHost && html`<button class="chip-btn" onClick=${() => session.shuffleSeats()} disabled=${seats.length < 2}><${Icon} name="refresh" size=${16} /> Shuffle</button>`}
      </div>
      <div class="seat-list">
        ${seats.map(
          (s, i) => html`<${SeatRow}
            key=${s.id}
            seat=${s}
            index=${i}
            you=${session.myIds.includes(s.id)}
            onToggleBot=${isHost && s.bot ? () => session.setBotLevel(s.id, s.bot === 'easy' ? 'clever' : 'easy') : null}
            onEdit=${session.myIds.includes(s.id) ? () => setSheet({ edit: s }) : null}
            onRemove=${isHost && s.id !== 'h' ? () => session.removeSeat(s.id) : null}
          />`
        )}
        ${!seats.length && html`<p class="muted" style="font-weight:700">Nobody here yet…</p>`}
      </div>
      ${isHost &&
      html`<div class="seat-actions" style="grid-template-columns:1fr">
        <button class="btn ghost small" disabled=${seats.length >= MAX_PLAYERS} onClick=${() => session.addBot()}><${Icon} name="bot" size=${18} /> Add a bot</button>
      </div>
      <div class="switch-row">
        <span class="grow">I'm playing too<small>Turn off to use this screen as the shared race board (great on a projector)</small></span>
        <button class="switch" role="switch" aria-checked=${hostPlaying} aria-label="Host is playing" onClick=${() => session.setHostPlaying(!hostPlaying, getPrefs())}></button>
      </div>`}
      ${seats.length >= PARTNERSHIP_MIN_PLAYERS && html`<p class="muted" style="font-size:13px;font-weight:700;margin-top:8px">6+ riders: betting partnerships are in play.</p>`}
    </section>

    <section class="card">
      <h2 class="section-title" style="margin:0 0 10px">Game mode</h2>
      <${ModePicker} value=${lobby.mode || 'crazier'} onChange=${isHost ? (m) => session.setMode(m) : null} />
    </section>

    ${isHost
      ? html`<button class="btn block" disabled=${seats.length < MIN_PLAYERS} onClick=${start}>Start the race! <${Icon} name="flag" /></button>`
      : html`<div class="card tight status-line" style="font-size:15px">
          <span class="thinking-dots"><span></span><span></span><span></span></span> Waiting for the host to start the race…
        </div>`}
    <button class="btn ghost block" onClick=${onHowTo}><${Icon} name="book" /> How to play</button>

    ${sheet?.edit &&
    html`<${ProfileSheet}
      title="Your rider"
      initial=${sheet.edit}
      taken=${seats.filter((s) => s.id !== sheet.edit.id).map((s) => s.character)}
      onClose=${() => setSheet(null)}
      onSave=${(p) => {
        setPrefs(p);
        isHost ? session.setHostProfile(p) : session.setProfile(p);
        setSheet(null);
      }}
    />`}
  </main>`;
}
