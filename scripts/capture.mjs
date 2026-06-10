// Capture homepage screenshots of the works for the gallery frames.
//
// Re-run whenever the works change:
//   npm run capture
//
// Saves 1440x900 (2x) PNGs into public/works/. Wire the filenames into
// src/data/works.json under each work's "image" field.

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../public/works');

const VIEWPORT = { width: 1440, height: 900 };

const works = [
  { url: 'https://iknowaspot.in', file: 'iknowaspot.png' },
  { url: 'https://bhaisepoocho.com', file: 'bhaisepoocho.png' },
  { url: 'https://museumofpassionprojects.com/oldinternet', file: 'oldinternet.png' },
];

async function capture(context, { url, file }) {
  const page = await context.newPage();
  try {
    // Wait for network idle, then a couple of extra seconds so web fonts
    // and lazy images have time to settle before the shot.
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    try {
      await page.waitForLoadState('networkidle', { timeout: 20_000 });
    } catch {
      // Some pages keep a connection open (analytics, polling) and never
      // reach idle — fall back to the fixed wait below.
      console.warn(`  (${url} did not reach network idle; using timed wait)`);
    }
    await page.waitForTimeout(2_500);

    const out = path.join(outDir, file);
    await page.screenshot({ path: out }); // viewport-only => exactly 1440x900
    console.log(`captured ${file}  <-  ${url}`);
  } catch (err) {
    console.error(`FAILED  ${url}\n  ${err.message}`);
    process.exitCode = 1;
  } finally {
    await page.close();
  }
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 1, // exact 1440x900 PNGs
});

for (const work of works) {
  await capture(context, work);
}

await browser.close();
