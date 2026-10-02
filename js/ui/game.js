// The game screen: board + side panel, and the "animator" that plays each
// batch of game events (dice, hops, cheers) before updating the panels.
import { html, useEffect, useRef, useState, useCallback } from '../../vendor/preact-htm.js';
import { currentPlayer, validTileSpaces, playerById } from '../engine/game.js';
import { Board, viewFromState } from './board.js';
import { TurnBanner, TicketBar, ActionBox, PlayerList, OddsBox, LogBox, diceLeftIndicator, nameOf } from './panels.js';
import { LegResultsSheet, FinaleSheet, FinishBetSheet, PartnerSheet, MenuSheet, ConfirmSheet, EndedSheet } from './modals.js';
import { HowToSheet } from './howto.js';
import { Icon, Raw, toast, camelName } from './common.js';
import { loopArrowSVG } from '../art/tokens.js';

const LOOP_ICON = loopArrowSVG();
import { sfx, buzz } from './fx.js';
import { getPrefs, setPrefs, onPrefs } from './prefs.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** How long a bot's (or an online friend's) choice is shown before it happens: hover, then a quick press. */
const PICK_MS = { normal: 1000, fast: 550 };

/** What someone else "clicked", read from the first event of their move. */
function pickOf(e) {
  switch (e.t) {
    case 'legBet':
      return { kind: 'legBet', player: e.player, color: e.color, value: e.value };
    case 'roll':
      return { kind: 'roll', player: e.player };
    case 'placeTile':
      return { kind: 'tile', player: e.player, space: e.space, side: e.side, flip: e.from === e.space };
    case 'finishBet':
      return { kind: 'finishBet', player: e.player, pile: e.pile };
    case 'partner':
      return { kind: 'partner', player: e.player, target: e.target };
    default:
      return null;
  }
}

export function GameScreen({ session, onExit, onLobby }) {
  const [shown, setShown] = useState(session.state);
  const [view, setView] = useState(() => viewFromState(session.state));
  const [modal, setModal] = useState(null);
  const [pending, setPending] = useState(null);
  // someone else's choice, shown with the same hover look you get with the mouse: { kind, …, phase: 'hover' | 'press' }
  const [pick, setPick] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [, force] = useState(0);
  const [prefs, setPrefsState] = useState(getPrefs());
  const board = useRef(null);
  const queue = useRef([]);
  const busy = useRef(false);
  const modalRef = useRef(null);
  const modalResolve = useRef(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  modalRef.current = modal;

  useEffect(() => onPrefs((p) => setPrefsState({ ...p })), []);

  const openBlocking = (m) =>
    new Promise((resolve) => {
      modalResolve.current = resolve;
      setModal(m);
    });
  const closeModal = () => {
    setModal(null);
    const r = modalResolve.current;
    modalResolve.current = null;
    r?.();
  };

  // ── the animator ──
  const playBatch = async (batch) => {
    const fast = getPrefs().fast;
    const s0 = viewRef.current;
    let legResult = null;
    let final = null;
    // A move made by someone not on this device (a bot, or a friend online): first show what they
    // "clicked" — the ticket / action / pile / space / pyramid lifts like a mouse hover, then presses.
    const first = batch.events[0];
    const p = first?.player && !session.myIds.includes(first.player) ? pickOf(first) : null;
    if (p) {
      const ms = fast ? PICK_MS.fast : PICK_MS.normal;
      setPick({ ...p, phase: 'hover' });
      await wait(ms * 0.8);
      setPick({ ...p, phase: 'press' });
      sfx.tap();
      await wait(ms * 0.2);
      setPick(null);
    }
    for (const e of batch.events) {
      switch (e.t) {
        case 'roll': {
          sfx.shake();
          if (e.side) {
            // Crazier Camels: the grey die is rolled by the little black-and-white pyramid
            board.current?.shakeSide();
            await wait(fast ? 220 : 420);
            setView((v) => ({ ...v, crazy: { value: e.value, shown: e.shown, popping: true } }));
          } else {
            board.current?.shake();
            await wait(fast ? 260 : 480);
            setView((v) => ({ ...v, rolled: [...v.rolled, { die: e.die, value: e.value, shown: e.shown, popping: true }] }));
          }
          sfx.pop();
          await wait(fast ? 320 : 620);
          break;
        }
        case 'move':
          await board.current?.animateMove(e);
          setView((v) => ({ ...v, stacks: e.stacks }));
          break;
        case 'loop':
          // a crazy camel runs past space 1 and round to 16; racing riders hop off on space 1
          if (e.dropped.length) {
            board.current?.float(1, 'hop off!', 'loop');
            sfx.boo();
          }
          await board.current?.animateMove(e);
          setView((v) => ({ ...v, stacks: e.stacks }));
          break;
        case 'tileEffect': {
          const owner = nameOf(batch.state, e.owner);
          board.current?.flashTile(e.space);
          board.current?.float(e.space, `+1 ${owner}`, e.side);
          e.side === 'cheer' ? sfx.cheer() : sfx.boo();
          setTimeout(() => sfx.coin(), 180);
          await wait(fast ? 200 : 380);
          await board.current?.animateMove(e);
          setView((v) => ({ ...v, stacks: e.stacks }));
          break;
        }
        case 'placeTile':
          setView((v) => {
            const tiles = Object.fromEntries(Object.entries(v.tiles).filter(([, t]) => t.owner !== e.player));
            tiles[e.space] = { owner: e.player, side: e.side };
            return { ...v, tiles };
          });
          sfx.card();
          setTimeout(() => board.current?.flashTile(e.space), 30);
          await wait(fast ? 250 : 500);
          break;
        case 'legBet':
          sfx.ticket();
          await wait(fast ? 150 : 320);
          break;
        case 'finishBet':
          sfx.card();
          await wait(fast ? 150 : 320);
          break;
        case 'partner':
          sfx.cheer();
          toast(`${nameOf(batch.state, e.player)} & ${nameOf(batch.state, e.target)} are partners this leg`);
          await wait(fast ? 200 : 400);
          break;
        case 'legEnd':
          legResult = e.result;
          break;
        case 'gameEnd':
          final = e.final;
          break;
        default:
          break;
      }
    }
    if (legResult && !final) {
      sfx.fanfare();
      await wait(350);
      await openBlocking({ type: 'leg', result: legResult, state: batch.state });
    }
    setShown(batch.state);
    setView(viewFromState(batch.state));
    if (final) {
      await wait(500);
      setModal({ type: 'final' });
    }
    return s0;
  };

  const pump = async () => {
    if (busy.current) return;
    busy.current = true;
    setAnimating(true);
    while (queue.current.length) {
      const batch = queue.current.shift();
      const skip = batch.reset || !batch.state || document.hidden || queue.current.length > 4;
      if (skip) {
        if (batch.state) {
          setShown(batch.state);
          setView(viewFromState(batch.state));
          if (batch.state.status === 'finished' && !modalRef.current) setModal({ type: 'final' });
        }
        continue;
      }
      try {
        await playBatch(batch);
      } catch (err) {
        console.error(err);
        setShown(batch.state);
        setView(viewFromState(batch.state));
      }
    }
    busy.current = false;
    setAnimating(false);
  };

  useEffect(() => {
    session.setIdleCheck(() => !busy.current && !modalRef.current);
    const off = session.subscribe((batch) => {
      if (batch?.error) {
        toast(batch.error, 'bad');
        sfx.error();
      }
      if (batch?.ended) setModal({ type: 'ended', message: batch.ended });
      if (batch && 'state' in batch) {
        if (!batch.state) {
          onLobby?.();
          return;
        }
        if (batch.reset) queue.current = [];
        queue.current.push(batch);
        pump();
      } else force((n) => n + 1);
    });
    return () => {
      off();
      session.setIdleCheck(null);
    };
  }, [session]);

  // "your turn" chime
  const lastTurnKey = useRef('');
  useEffect(() => {
    if (!shown || shown.status !== 'playing' || animating) return;
    const p = currentPlayer(shown);
    const key = `${shown.seq}:${p.id}`;
    if (session.myIds.includes(p.id) && lastTurnKey.current !== key) {
      lastTurnKey.current = key;
      sfx.turn();
      buzz([30, 60, 30]);
    }
  }, [shown?.seq, animating]);

  if (!shown) return null;
  const cur = shown.status === 'playing' ? currentPlayer(shown) : null;
  const mine = !!cur && session.myIds.includes(cur.id);
  const canAct = mine && !animating && !modal;
  const me = mine ? cur : playerById(shown, session.myIds[0]);
  const localMulti = session.kind === 'local' && session.myIds.length > 1;

  const act = (action) => {
    try {
      session.act(cur.id, action);
      setPending(null);
    } catch (err) {
      toast(err.message || 'That move is not allowed.', 'bad');
      sfx.error();
    }
  };

  const tileMode = canAct && pending?.kind === 'tile';
  const pickSpaces = tileMode && !pending.space ? validTileSpaces(shown, cur.id) : tileMode ? [pending.space] : null;

  const leave = () =>
    setModal({
      type: 'confirm',
      title: 'Leave the race?',
      text:
        session.kind === 'host'
          ? 'You are the host — leaving closes the room for everyone.'
          : session.kind === 'local'
            ? 'Your race is saved on this device, so you can resume it later from the home screen.'
            : 'You can rejoin with the same room code while the race is running.',
      yes: 'Leave',
      danger: true,
      onYes: () => onExit(),
    });

  const canRematch = session.kind !== 'guest';
  const modalEl = (() => {
    if (!modal) return null;
    switch (modal.type) {
      case 'leg':
        return html`<${LegResultsSheet} result=${modal.result} state=${modal.state} onClose=${closeModal} />`;
      case 'final':
        return html`<${FinaleSheet}
          state=${shown}
          canRematch=${canRematch}
          onRematch=${() => {
            setModal(null);
            session.rematch();
          }}
          onLobby=${session.kind === 'host' ? () => session.backToLobby() : null}
          onExit=${onExit}
          onClose=${() => setModal(null)}
        />`;
      case 'finish':
        return html`<${FinishBetSheet}
          state=${shown}
          me=${cur}
          initialPile=${modal.pile}
          needsGate=${localMulti}
          onClose=${() => setModal(null)}
          onConfirm=${(a) => {
            setModal(null);
            act(a);
          }}
        />`;
      case 'partner':
        return html`<${PartnerSheet}
          state=${shown}
          me=${cur}
          onClose=${() => setModal(null)}
          onConfirm=${(a) => {
            setModal(null);
            act(a);
          }}
        />`;
      case 'menu':
        return html`<${MenuSheet} session=${session} onClose=${() => setModal(null)} onRules=${() => setModal({ type: 'rules' })} onLeave=${leave} />`;
      case 'rules':
        return html`<${HowToSheet} onClose=${() => setModal(null)} />`;
      case 'confirm':
        return html`<${ConfirmSheet} ...${modal} onNo=${() => setModal(null)} />`;
      case 'ended':
        return html`<${EndedSheet} message=${modal.message} onHome=${onExit} />`;
      default:
        return null;
    }
  })();

  return html`<div class="game">
    <div class="topbar">
      <button class="icon-btn" aria-label="Menu" onClick=${() => setModal({ type: 'menu' })}><${Icon} name="menu" /></button>
      <div class="leg-pill"><b>Leg ${shown.leg}</b>${diceLeftIndicator(shown)}</div>
      ${shown.mode === 'crazier' &&
      html`<div class="leg-pill mode-pill" title="Crazier Camels: a crazy camel moves on every roll and they loop around the board"><${Raw} svg=${LOOP_ICON} class="mode-ico" /> Crazier</div>`}
      ${session.lobby?.code && html`<div class="leg-pill" title="Room code">Room <b>${session.lobby.code}</b></div>`}
      <span class="spacer"></span>
      ${session.status?.level && session.status.level !== 'ok' &&
      html`<div class="leg-pill"><span class=${`pulse-dot ${session.status.level === 'bad' ? 'bad' : 'warn'}`}></span>${session.status.text}</div>`}
      ${shown.status === 'finished' &&
      html`<button class="btn small" onClick=${() => setModal({ type: 'final' })}><${Icon} name="trophy" size=${16} /> Results</button>`}
      <button class="icon-btn" aria-label="How to play" onClick=${() => setModal({ type: 'rules' })}><${Icon} name="book" /></button>
      <button
        class="icon-btn"
        aria-label=${prefs.sound ? 'Mute' : 'Unmute'}
        onClick=${() => setPrefs({ sound: !prefs.sound })}
      ><${Icon} name=${prefs.sound ? 'volume' : 'volumeOff'} /></button>
    </div>

    <div class="board-area">
      <${Board}
        view=${view}
        players=${shown.players}
        theme=${prefs.theme}
        controller=${board}
        pickSpaces=${pickSpaces}
        picked=${pending?.space ?? (pick?.kind === 'tile' ? pick.space : undefined)}
        rollPick=${pick?.kind === 'roll' ? pick.phase : null}
        onPick=${(space) => {
          sfx.tap();
          setPending({ kind: 'tile', space });
        }}
        canRoll=${canAct && !pending}
        onRoll=${() => act({ type: 'roll' })}
      />
    </div>

    <div class="panel">
      <${TurnBanner}
        state=${shown}
        mine=${mine}
        isBot=${!!cur?.bot || !!session.lobby?.seats?.find((s) => s.id === cur?.id)?.takeover}
        localMulti=${localMulti}
        pick=${pick}
      />
      <${TicketBar}
        state=${shown}
        canAct=${canAct && !pending}
        selected=${pending?.kind === 'legBet' ? pending.color : null}
        pick=${pick}
        onPick=${(color) => {
          sfx.tap();
          setPending({ kind: 'legBet', color });
        }}
      />
      <${ActionBox}
        state=${shown}
        me=${cur}
        mine=${mine}
        canAct=${canAct}
        pending=${pending}
        pick=${pick}
        setPending=${setPending}
        act=${act}
        openFinish=${(pile = 'winner') => setModal({ type: 'finish', pile })}
        openPartner=${() => setModal({ type: 'partner' })}
      />
      ${prefs.odds && html`<${OddsBox} state=${shown} />`}
      <${PlayerList} state=${shown} lobby=${session.lobby} myIds=${session.myIds} />
      <${HostTools} session=${session} state=${shown} />
      <${LogBox} state=${shown} myIds=${session.myIds} />
    </div>
    ${modalEl}
  </div>`;
}

/** Online host: hand a disconnected player's seat to a bot so the race can go on. */
function HostTools({ session, state }) {
  if (session.kind !== 'host' || state.status !== 'playing') return null;
  const offline = (session.lobby?.seats || []).filter((s) => !s.bot && !s.host && (!s.connected || s.takeover));
  if (!offline.length) return null;
  return html`<div class="box">
    <div class="box-title"><span class="grow">Someone dropped out</span></div>
    ${offline.map(
      (s) => html`<div class="switch-row">
        <span class="grow">${s.name}<small>${s.connected ? 'back online' : 'offline'}${s.takeover ? ' · a bot is playing for them' : ''}</small></span>
        <button class=${`btn small ${s.takeover ? 'ghost' : 'teal'}`} onClick=${() => session.setTakeover(s.id, !s.takeover)}>
          ${s.takeover ? 'Stop bot' : 'Bot plays'}
        </button>
      </div>`
    )}
  </div>`;
}
