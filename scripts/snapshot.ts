import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const url = process.argv[2] ?? 'http://localhost:5177';
const outDir = join(process.cwd(), '.snapshots');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

page.on('console', (m) => console.log(`[console.${m.type()}]`, m.text()));
page.on('pageerror', (e) => console.error('[pageerror]', e.message));

await page.goto(url, { waitUntil: 'networkidle' });

await page.screenshot({ path: join(outDir, 't15-default.png'), fullPage: true });

// Open Bans details
const bansToggle = page.locator('summary[aria-label="Bans"]');
await bansToggle.waitFor({ state: 'visible' });
await bansToggle.click();
await page.waitForTimeout(150);
await page.screenshot({ path: join(outDir, 't15-bans-open.png'), fullPage: true });

// Pick 4 heroes to ban
const portraits = page.locator('div[role="dialog"][aria-label="Bans picker"] button[aria-label]');
const total = await portraits.count();
console.log('portraits in bans grid:', total);
for (let i = 0; i < 5 && i < total; i++) {
  await portraits.nth(i).click({ trial: false });
}
await page.waitForTimeout(150);
await page.screenshot({ path: join(outDir, 't15-bans-4.png'), fullPage: true });

// Read summary text to verify cap
const summaryText = await bansToggle.textContent();
console.log('summary after 5 clicks:', summaryText);

// Close bans
await bansToggle.click();
await page.waitForTimeout(150);

// Enable map context
const mapToggle = page.locator('label', { hasText: 'Map context' }).locator('input[type=checkbox]');
await mapToggle.check();
await page.waitForTimeout(150);
await page.screenshot({ path: join(outDir, 't15-mapctx-on.png'), fullPage: true });

// Select escort + a map
const modeSelect = page.getByLabel('Mode', { exact: true });
await modeSelect.selectOption('escort');
await page.waitForTimeout(100);
const mapSelect = page.getByLabel('Map', { exact: true });
await mapSelect.selectOption('circuit-royal');
await page.waitForTimeout(150);
await page.screenshot({ path: join(outDir, 't15-mapctx-escort.png'), fullPage: true });

// Change mode -> map should reset
await modeSelect.selectOption('control');
await page.waitForTimeout(100);
const mapAfterReset = await mapSelect.inputValue();
console.log('map value after mode change (should be empty):', JSON.stringify(mapAfterReset));
await page.screenshot({ path: join(outDir, 't15-mapctx-reset.png'), fullPage: true });

// Toggle off
await mapToggle.uncheck();
await page.waitForTimeout(150);
await page.screenshot({ path: join(outDir, 't15-mapctx-off.png'), fullPage: true });

await browser.close();
console.log('snapshots written to', outDir);
