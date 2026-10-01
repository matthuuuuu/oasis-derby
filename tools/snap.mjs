// Development helper: screenshot a page with headless Chrome/Edge.
//   node tools/snap.mjs <url> <out.png> [width=1200] [height=900]
// Example (dev server running):
//   node tools/snap.mjs "http://localhost:5317/tools/gallery.html?show=characters" shot.png 1000 700
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [url, out, width = '1200', height = '900', mode = ''] = process.argv.slice(2);
if (!url || !out) {
  console.error('usage: node tools/snap.mjs <url> <out.png> [width] [height]');
  process.exit(1);
}

const candidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const browser = candidates.find((p) => fs.existsSync(p));
if (!browser) {
  console.error('No Chrome/Edge found. Set CHROME_PATH.');
  process.exit(1);
}

// A private throwaway profile so we never touch the user's real browser.
const profile = path.join(os.tmpdir(), 'oasis-derby-snap-profile');
const target = path.resolve(out);
execFileSync(
  browser,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${profile}`,
    '--virtual-time-budget=4000',
    '--force-device-scale-factor=1',
    `--window-size=${width},${height}`,
    `--screenshot=${target}`,
    ...(mode === 'transparent' ? ['--default-background-color=00000000'] : []),
    url,
  ],
  { stdio: 'ignore', timeout: 60000 }
);
console.log('saved', target);
