# T04 — Hero roster + portrait scrape script

## Goal
Node script `scripts/sync-heroes.ts` that pulls current hero roster + portraits from official Overwatch site, populates `src/data/heroes.json` skeleton, downloads portraits to `public/heroes/`.

## Depends on
T01, T03

## Files to create
- `scripts/sync-heroes.ts`
- `scripts/lib/scrape.ts` (helpers)
- Update `package.json` scripts: `"sync-heroes": "tsx scripts/sync-heroes.ts"`
- Add deps: `tsx`, `playwright` (or `puppeteer`), `axios` or native `fetch`.

## Behavior

### Source
- Primary: `https://overwatch.blizzard.com/en-us/heroes/` — official hero list page. Inspect rendered DOM / network XHR first; prefer JSON endpoint if present.
- Fallback: `https://overwatch.blizzard.com/en-us/rates/...` (per user reference).
- If both require JS rendering — use Playwright headless Chromium.

### Steps
1. Launch Playwright, navigate to roster page, wait for hero cards.
2. Extract per hero:
   - canonical `id` (kebab-case, e.g., `soldier-76`, `dva`)
   - display `name`
   - `role` (tank/dps/support) from page classification
   - portrait image URL
3. Download each portrait → `public/heroes/<id>.png` (or `.jpg` — keep original extension).
4. Read existing `src/data/heroes.json` (if exists).
5. Merge:
   - For new heroes: append with placeholder `archetype: { dive: 0.34, brawl: 0.33, poke: 0.33 }`, empty `tags`.
   - For existing heroes: preserve manually-curated `archetype`, `tags`. Update `name`, `role`, `portrait` only.
   - For removed heroes (no longer on roster): keep in file but flag with `"deprecated": true` comment in commit; do not auto-delete.
6. Update top-level `patch` + `updated` fields (prompt CLI for patch string, or auto-tag with ISO date if `--non-interactive`).
7. Write file with stable key ordering (alphabetical by id within `heroes` array — for clean diffs).
8. Print summary: `+N added`, `~M updated`, `-K removed`.

### CLI flags
- `--dry-run` — log changes, don't write files.
- `--patch "OW Season XX"` — set patch label without prompt.
- `--no-portraits` — skip image download.

## Acceptance
- Running `npm run sync-heroes -- --dry-run` produces a non-empty diff summary against an empty `heroes.json`.
- After running without `--dry-run`: `src/data/heroes.json` exists, contains all current heroes, valid JSON, conforms to `Hero[]` type from T03.
- All portraits downloaded to `public/heroes/<id>.{png|jpg}`.
- Re-running is idempotent: no diff on second consecutive run.
- Idempotency preserved when manually-edited archetype vectors exist.

## Notes
- Reuse user-agent that mimics a normal browser to avoid blocks.
- Respect site: add 200–500ms throttle between image downloads.
- Print disclaimer in console: "Portraits owned by Blizzard; for personal use."
- If page structure changes upstream, fail loudly with a clear error pointing to selector that broke.
- Portrait quality: prefer the largest available image; OK to use circular hero icons.
