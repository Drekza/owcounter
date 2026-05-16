import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const url = process.argv[2] ?? 'http://localhost:5179';
const outDir = join(process.cwd(), '.snapshots');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('console', (m) => console.log(`[console.${m.type()}]`, m.text()));
page.on('pageerror', (e) => console.error('[pageerror]', e.message));

await page.goto(url, { waitUntil: 'networkidle' });

// snapshot: enemy comp empty
await page.screenshot({ path: join(outDir, 't16-empty.png'), fullPage: true });

// fill enemy team via search input (one hero per slot, varied archetypes)
async function pickHero(name: string) {
  const portrait = page
    .locator(`section[aria-label="Enemy team"] button[aria-label="${name}"]`)
    .first();
  await portrait.click();
  await page.waitForTimeout(40);
}

// Pick a dive-heavy comp: Winston tank, Tracer + Genji dps, Lucio + Kiriko support
await pickHero('Winston');
await pickHero('Tracer');
await pickHero('Genji');
await pickHero('Lúcio');
await pickHero('Kiriko');

await page.waitForTimeout(200);
await page.screenshot({ path: join(outDir, 't16-dive-comp.png'), fullPage: true });

// Print archetype text from panel
const panelText = await page.locator('section[aria-label="Enemy comp analysis"]').innerText();
console.log('--- Enemy comp panel ---');
console.log(panelText);

// reset and pick a brawl comp
await page.locator('section[aria-label="Enemy team"] button:has-text("Reset")').click();
await page.waitForTimeout(150);

await pickHero('Reinhardt');
await pickHero('Reaper');
await pickHero('Mei');
await pickHero('Brigitte');
await pickHero('Lúcio');
await page.waitForTimeout(200);
await page.screenshot({ path: join(outDir, 't16-brawl-comp.png'), fullPage: true });
const brawlText = await page.locator('section[aria-label="Enemy comp analysis"]').innerText();
console.log('--- Brawl comp ---');
console.log(brawlText);

// reset and pick a poke comp
await page.locator('section[aria-label="Enemy team"] button:has-text("Reset")').click();
await page.waitForTimeout(150);

await pickHero('Sigma');
await pickHero('Ashe');
await pickHero('Widowmaker');
await pickHero('Ana');
await pickHero('Zenyatta');
await page.waitForTimeout(200);
await page.screenshot({ path: join(outDir, 't16-poke-comp.png'), fullPage: true });
const pokeText = await page.locator('section[aria-label="Enemy comp analysis"]').innerText();
console.log('--- Poke comp ---');
console.log(pokeText);

await browser.close();
console.log('snapshots written to', outDir);
