// tests/browser.mjs
// Launches the headless browser both test scripts drive. Needs a Chromium-family browser
// installed on this machine (Chrome, Chromium, Brave, Edge); set CHROME_BIN to choose one.
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

function findBrowser() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'brave-browser', 'microsoft-edge']) {
    try {
      return execFileSync('which', [name], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
      // not installed under this name
    }
  }
  console.error('No Chromium-family browser found. Install one or set CHROME_BIN.');
  process.exit(1);
}

export const launchBrowser = () => puppeteer.launch({ executablePath: findBrowser(), headless: true, args: ['--no-sandbox'] });
