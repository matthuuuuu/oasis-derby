// The app's "router": home → setup/lobby → game.
import { html, useEffect, useMemo, useState } from '../../vendor/preact-htm.js';
import { Home } from './home.js';
import { LocalSetup, Lobby } from './setup.js';
import { GameScreen } from './game.js';
import { HowToSheet } from './howto.js';
import { Toasts, toast } from './common.js';
import { LocalSession, LOCAL_SAVE_KEY } from '../net/session.js';
import { HostSession, GuestSession, HOST_SAVE_KEY, GUEST_SAVE_KEY, cleanCode } from '../net/online.js';
import { getPrefs, loadJSON, saveJSON } from './prefs.js';

const HOURS = 3600 * 1000;

function resumables() {
  const out = [];
  const local = loadJSON(LOCAL_SAVE_KEY);
  if (local?.state?.status === 'playing') {
    out.push({
      kind: 'local',
      data: local,
      art: 'camel',
      title: 'Resume your race',
      subtitle: `Pass & play · leg ${local.state.leg} · ${local.state.players.length} riders`,
    });
  }
  const host = loadJSON(HOST_SAVE_KEY);
  if (host?.code && Date.now() - host.savedAt < 12 * HOURS) {
    out.push({
      kind: 'host',
      data: host,
      art: 'tent',
      title: `Reopen room ${host.code}`,
      subtitle: host.state ? `Online race in progress · leg ${host.state.leg}` : 'Your online room',
    });
  }
  const guest = loadJSON(GUEST_SAVE_KEY);
  if (guest?.code && Date.now() - guest.savedAt < 6 * HOURS) {
    out.push({ kind: 'guest', data: guest, art: 'phone', title: `Rejoin room ${guest.code}`, subtitle: 'Hop back into the race' });
  }
  return out;
}

export function App() {
  const initialCode = useMemo(() => cleanCode(new URL(location.href).searchParams.get('room') || ''), []);
  const [screen, setScreen] = useState('home');
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [howto, setHowto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  const saved = useMemo(resumables, [tick, screen]);
  // handy for debugging in the browser console: __oasis.session.state
  window.__oasis = { session };

  // ?resume=local jumps straight back into a saved pass & play race
  // (used by tools/scenario.html to preview game situations).
  useEffect(() => {
    if (new URL(location.href).searchParams.get('resume') === 'local') {
      const r = resumables().find((x) => x.kind === 'local');
      if (r) onResume(r);
    }
  }, []);

  const exit = () => {
    session?.destroy();
    setSession(null);
    setScreen('home');
    setTick((t) => t + 1);
    if (location.search) history.replaceState(null, '', location.pathname);
  };

  // follow the session between lobby and game
  useEffect(() => {
    if (!session || session.kind === 'local') return;
    const sync = () => setScreen(session.state ? 'game' : 'lobby');
    sync();
    return session.subscribe((batch) => {
      if (!session.state) {
        if (batch?.error) toast(batch.error, 'bad');
        if (batch?.ended) {
          toast(batch.ended);
          exit();
          return;
        }
      }
      sync();
    });
  }, [session]);

  const goOnline = async (make) => {
    setBusy(true);
    try {
      const s = await make();
      setSession(s);
      setScreen(s.state ? 'game' : 'lobby');
    } catch (err) {
      toast(err.message || 'Could not connect.', 'bad');
      setTick((t) => t + 1);
    } finally {
      setBusy(false);
    }
  };

  const onResume = (r) => {
    const prefs = getPrefs();
    if (r.kind === 'local') {
      setSession(new LocalSession({ seats: r.data.seats, state: r.data.state }));
      setScreen('game');
    } else if (r.kind === 'host') {
      goOnline(() => HostSession.create({ name: prefs.name, character: prefs.character, clientId: prefs.clientId, resume: r.data }));
    } else {
      goOnline(() =>
        GuestSession.join({ code: r.data.code, name: prefs.name || 'Guest', character: prefs.character, clientId: prefs.clientId })
      ).then(() => {});
      saveJSON(GUEST_SAVE_KEY, null);
    }
  };

  let body;
  if (screen === 'setup') {
    body = html`<${LocalSetup}
      profile=${profile}
      onBack=${() => setScreen('home')}
      onHowTo=${() => setHowto(true)}
      onStart=${(seats, mode) => {
        setSession(new LocalSession({ seats, mode }));
        setScreen('game');
      }}
    />`;
  } else if (screen === 'lobby' && session) {
    body = html`<${Lobby} session=${session} onLeave=${exit} onHowTo=${() => setHowto(true)} />`;
  } else if (screen === 'game' && session?.state) {
    body = html`<${GameScreen} key=${session.kind + (session.code || '')} session=${session} onExit=${exit} onLobby=${() => setScreen('lobby')} />`;
  } else {
    body = html`<${Home}
      initialCode=${initialCode}
      saved=${saved}
      busy=${busy}
      onHowTo=${() => setHowto(true)}
      onResume=${onResume}
      onLocal=${(p) => {
        setProfile(p);
        setScreen('setup');
      }}
      onHost=${(p) => goOnline(() => HostSession.create({ ...p, clientId: getPrefs().clientId }))}
      onJoin=${(p, code) => goOnline(() => GuestSession.join({ ...p, code, clientId: getPrefs().clientId }))}
    />`;
  }

  return html`${body}${howto && html`<${HowToSheet} onClose=${() => setHowto(false)} />`}<${Toasts} />`;
}
