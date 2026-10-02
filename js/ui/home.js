// Home screen: who you are, and how you want to play.
import { html, useEffect, useMemo, useRef, useState } from '../../vendor/preact-htm.js';
import { logoSVG, ACTION_ICONS } from '../art/tokens.js';
import { Raw, Icon, CharacterPicker, ThemeDots, Sticker, CamelSprite, toast, characterById } from './common.js';
import { getPrefs, setPrefs } from './prefs.js';
import { cleanCode } from '../net/online.js';
import { sfx } from './fx.js';

const bookIcon = ACTION_ICONS.finishBet();

export const APP_NAME = 'Oasis Derby';
export const TAGLINE = 'Bet on the craziest camel race in the desert.';

export function Home({ initialCode = '', saved, busy, onHowTo, onLocal, onHost, onJoin, onResume }) {
  const prefs = getPrefs();
  const [name, setName] = useState(prefs.name);
  const [character, setCharacter] = useState(prefs.character);
  const [mode, setMode] = useState(initialCode ? 'online' : prefs.lastMode || 'local');
  const [code, setCode] = useState(cleanCode(initialCode));
  const nameRef = useRef();
  const logo = useMemo(() => logoSVG(), []);

  useEffect(() => setPrefs({ name: name.trim().slice(0, 18) }), [name]);
  useEffect(() => setPrefs({ character }), [character]);
  useEffect(() => setPrefs({ lastMode: mode }), [mode]);

  const profile = () => {
    const n = name.trim();
    if (!n) {
      toast('Pick a display name first');
      nameRef.current?.focus();
      return null;
    }
    return { name: n.slice(0, 18), character };
  };

  const start = () => {
    const p = profile();
    if (!p) return;
    sfx.tap();
    mode === 'local' ? onLocal(p) : onHost(p);
  };
  const join = (e) => {
    e?.preventDefault();
    const p = profile();
    if (!p) return;
    if (cleanCode(code).length !== 4) {
      toast('Room codes have 4 letters.');
      return;
    }
    sfx.tap();
    onJoin(p, cleanCode(code));
  };

  return html`<main class="page">
    <header class="masthead">
      <${Raw} svg=${logo} class="logo" tag="div" />
      <div class="masthead-text">
        <h1 class="title-xl">${APP_NAME}</h1>
        <p>${TAGLINE}</p>
      </div>
      <${ThemeDots} />
    </header>

    <button class="card link-card" onClick=${onHowTo}>
      <${Raw} svg=${bookIcon} class="ico" />
      <span><h3>New here? How to play</h3><p>The rules in two minutes</p></span>
      <span class="chev"><${Icon} name="arrowRight" /></span>
    </button>

    ${saved.map(
      (s) => html`<button class="card link-card" onClick=${() => onResume(s)} disabled=${busy}>
        <span class="ico" style="display:grid;place-items:center">${s.art === 'camel' ? html`<${CamelSprite} camel="yellow" />` : html`<${Sticker} name=${s.art} size=${44} />`}</span>
        <span><h3>${s.title}</h3><p>${s.subtitle}</p></span>
        <span class="chev"><${Icon} name="arrowRight" /></span>
      </button>`
    )}

    <section class="card">
      <h2 class="section-title">You at the table</h2>
      <input
        class="field"
        ref=${nameRef}
        placeholder="Display name"
        maxlength="18"
        autocomplete="nickname"
        value=${name}
        onInput=${(e) => setName(e.target.value)}
        aria-label="Display name"
      />
      <${CharacterPicker} value=${character} onChange=${setCharacter} />
    </section>

    <section class="card">
      <h2 class="section-title">Start a race</h2>
      <div class="mode-grid">
        <button class="mode-card" aria-pressed=${mode === 'local'} onClick=${() => setMode('local')}>
          <h3>Pass & play</h3>
          <p>One phone or laptop, take turns. Add bots!</p>
        </button>
        <button class="mode-card" aria-pressed=${mode === 'online'} onClick=${() => setMode('online')}>
          <h3>Online room</h3>
          <p>Everyone plays from their own phone</p>
        </button>
      </div>
      <button class="btn block" style="margin-top:14px" disabled=${busy} onClick=${start}>
        ${busy ? 'Opening the gates…' : mode === 'local' ? 'Set up the race' : 'Create a room'}
        <${Icon} name="arrowRight" />
      </button>

      <div class="divider-text">or join friends</div>
      <form class="row" onSubmit=${join}>
        <input
          class="field code-field grow"
          placeholder="CODE"
          value=${code}
          maxlength="4"
          autocapitalize="characters"
          autocomplete="off"
          spellcheck="false"
          aria-label="Room code"
          onInput=${(e) => setCode(cleanCode(e.target.value))}
        />
        <button class="btn teal" type="submit" disabled=${busy}>Join</button>
      </form>
    </section>

    <p class="muted fineprint">
      <span>A fan-made project inspired by the board game Camel Up.</span>
      <span>Works on mobile and in browser</span>
      <span>2–8 players</span>
    </p>
    <${InstallBanner} />
  </main>`;
}

// ─── "Install" banner (like Aviary's) ────────────────────────────────────────

const DISMISS_KEY = 'oasis-derby:install-dismissed';

function InstallBanner() {
  const [prompt, setPrompt] = useState(window.__installPrompt || null);
  const [hidden, setHidden] = useState(() => {
    try {
      return !!localStorage.getItem(DISMISS_KEY);
    } catch {
      return false;
    }
  });
  const logo = useMemo(() => logoSVG(), []);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const on = (e) => {
      e.preventDefault();
      window.__installPrompt = e;
      setPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', on);
    return () => window.removeEventListener('beforeinstallprompt', on);
  }, []);

  if (hidden || standalone || (!prompt && !ios)) return null;
  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };
  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice.catch(() => {});
    window.__installPrompt = null;
    dismiss();
  };
  return html`<div class="install-banner" role="dialog" aria-label="Install the app">
    <${Raw} svg=${logo} class="logo" tag="div" />
    <div class="grow">
      <h3>Install ${APP_NAME}</h3>
      <p>${prompt ? 'One tap, right from your home screen.' : 'Tap Share, then “Add to Home Screen”.'}</p>
    </div>
    ${prompt && html`<button class="btn small" onClick=${install}><${Icon} name="download" size=${18} /> Install</button>`}
    <button class="icon-btn" style="background:transparent;border:0" aria-label="Dismiss" onClick=${dismiss}><${Icon} name="x" /></button>
  </div>`;
}
