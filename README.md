# 🐪 Oasis Derby

A cute desert-oasis camel race you bet on with friends — a fan-made, non-commercial
school project that follows the rules of the board game **Camel Up (2nd edition)**.

- **2–8 riders** (the official game is 3–8; 2 is allowed for practice).
- **Pass & play** on one phone/laptop, with optional **bots**.
- **Online rooms**: everyone plays from their own phone with a 4-letter room code
  (or a QR code / invite link).
- Works on **phones and computers**, can be **installed to the home screen**, and
  pass & play works **offline**.
- The exact rulebook rules: stacking & carrying, leg tickets (5/3/2/2), spectator
  tiles (cheer +1 / boo −1), pyramid tickets, crazy camels and their two special
  rules, overall winner/loser cards (8/5/3/2/1, −1), no coins below 0, and
  betting partnerships with 6+ players.

---

## 🐪 Crazier Camels (this branch)

This copy of the game adds a second game mode, picked on the "Set up the race" screen
(and by the host in an online room). Everything is the classic race except:

- The **grey die is not in the pyramid**. It sits on a stone stand beside it and is rolled
  **right after every coloured die**, so a crazy camel moves on every pyramid roll.
  A leg still ends after 5 rolls, so all five coloured dice come out each leg.
- **Crazy camels loop**: passing space 1 they come round to 16 and keep going. Racing camels
  they were carrying that far hop off on space 1. (In the classic game a crazy camel going
  past space 1 crosses the finish line and ends the race.)
- If the coloured camel's move ends the race, the grey die isn't rolled.

It runs on its own address so its saves don't mix with the main game:
`node tools/dev-server.mjs` → http://localhost:5318 (online rooms use their own namespace too).
The rules live in `js/engine/game.js` (`moveOnBoard`, `rollPyramid`); tests in `tests/crazier.test.mjs`.

## ▶️ Play it on your computer

You need [Node.js](https://nodejs.org) (already installed on this computer).

1. Open a terminal in this folder.
2. Run:

   ```bash
   npm run dev
   ```

3. Open **http://localhost:5317** in your browser.

**Try it on your phone too:** while the server is running, it prints an
`On your network:` address (like `http://192.168.1.23:5317`). Open that on a phone
connected to the **same Wi-Fi**.

> Online rooms work on your computer and your Wi-Fi, but they really shine once the
> site is on Vercel (see below): then anyone, anywhere, can join with the code.

## 🧪 Check the rules still work

```bash
npm test
```

Runs 34 automated checks, including every tricky rule from the rulebook
(crazy-camel exceptions, booing tiles sliding underneath, the Martina scoring
example…) and 1,500 random full games.

---

## 🚀 Put it online (GitHub + Vercel)

This is a plain static website — **no build step and no settings to change**.

### 1. Put the code on GitHub
1. Create a new, empty repository on [github.com/new](https://github.com/new)
   (e.g. `oasis-derby`). Don't add a README there.
2. In a terminal in this folder:

   ```bash
   git init
   git add .
   git commit -m "Oasis Derby"
   git branch -M main
   git remote add origin https://github.com/YOUR-NAME/oasis-derby.git
   git push -u origin main
   ```

### 2. Deploy with Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and **Import** the GitHub repository.
2. Framework preset: **Other**. Leave the build and output settings empty — the
   included `vercel.json` already tells Vercel to serve the files as they are.
3. Click **Deploy**. You'll get a link like `https://oasis-derby.vercel.app`.

Every time you push to GitHub, Vercel updates the site automatically.
Want it on your own site? In Vercel → Project → *Settings → Domains* you can add a
subdomain such as `camels.your-site.com`, or simply link to the Vercel URL.

---

## 🌐 How online play works (in plain words)

- The person who taps **Create a room** is the **host**. Their browser runs the real
  game (rules, dice, bots) and is the single source of truth.
- Friends join with the room code. Their phones connect **directly** to the host's
  browser using WebRTC. The free [PeerJS](https://peerjs.com) service only helps
  the browsers find each other — no game data is stored on any server.
- Secret information (your race-bet cards) is only ever sent to its owner.
- If someone refreshes or loses signal, they can **rejoin** and get the same seat.
  If a player vanishes, the host can let a **bot play for them**.
- **Tip:** the host should keep their screen on (the game asks the device to stay
  awake). A laptop on a projector makes a great host — switch off
  **“I'm playing too”** in the lobby to use it as the big shared race board.
- Very strict networks (some school/company Wi-Fi) can block direct connections.
  If joining fails, try again, or have everyone use the same Wi-Fi or a phone hotspot.

---

## 🗺️ What's where (for editing)

| I want to change… | Look in |
| --- | --- |
| The game's name / tagline | `js/ui/home.js` (`APP_NAME`, `TAGLINE`), `index.html`, `manifest.webmanifest` |
| Colours & fonts, sizes, layout | `css/styles.css` (themes are at the top: `sand`, `sunset`, `night`) |
| Rule numbers (ticket values, payouts, starting coins…) | `js/engine/constants.js` |
| The rules themselves | `js/engine/game.js` (heavily commented) |
| How clever the bots are | `js/ai/bot.js` |
| How fast the bots take their turns | `js/net/session.js` (`BOT_PACE`: bigger = slower) |
| How long you see a bot's choice "hovered" before it happens | `js/ui/game.js` (`PICK_MS`) |
| The white-glove mouse cursor | `assets/cursors/glove-source.png` is the picture; after changing it run `python tools/make-cursors.py` (needs Pillow) to rebuild `glove.png` |
| Outline thickness of cards, buttons and panels | `css/styles.css` (`--bw`) |
| Camel size on the board, and how piles of camels look | `js/ui/stacking.js` (`CAMEL_SIZE`, `STACK_STYLE`) |
| The camels | `js/art/camels.js` |
| The 8 characters, the pharaoh mask, the crowds | `js/art/characters.js` |
| The desert scene & the oasis in the middle of the board | `js/art/scenery.js` |
| Tickets, coins, pyramid, dice tents, logo, icons | `js/art/tokens.js` |
| The home screen | `js/ui/home.js` |
| The board and its animations | `js/ui/board.js` |
| Buttons and panels next to the board | `js/ui/panels.js` |
| Pop-ups (results, finale, race bets, menu) | `js/ui/modals.js` |
| The “How to play” pages | `js/ui/howto.js` |
| Online rooms | `js/net/online.js` |

All the art is drawn in code (SVG), so it stays crisp on every screen and can be
recoloured or tweaked easily. `docs/ART_STYLE.md` describes the art style.

**Developer helpers** (not deployed): `tools/gallery.html`,
`tools/gallery-characters.html`, `tools/gallery-scenery.html` show all the art;
`tools/scenario.html?case=game` (also `game8`, `stacks`, `piles`, `piles2`, `huts`, `botpick`, `leg`,
`finale`, `finish`, `howto`) shows screens with ready-made game situations;
`tools/stack-options.html` compares the pile styles.

---

## 🙏 Credits

- Game rules: **Camel Up** by Steffen Bogen (Eggertspiele / Plan B Games). This is
  an unofficial fan project for a class — not affiliated with or endorsed by the
  publishers, and not for sale.
- Fonts: [Lilita One](https://fonts.google.com/specimen/Lilita+One) and
  [Nunito](https://fonts.google.com/specimen/Nunito) (SIL Open Font License).
- Libraries (in `vendor/`): [Preact](https://preactjs.com) + [htm](https://github.com/developit/htm)
  (MIT / Apache-2.0), [PeerJS](https://peerjs.com) (MIT),
  [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT).
