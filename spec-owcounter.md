# OW Counter — Composition Suggester

## Context

**Problem.** In OW (5v5, 1-2-2), choosing the optimal counter-composition against a known enemy team is non-trivial — players must mentally combine pairwise matchups, team synergy, comp archetype identity, map context, and current bans. No existing tool does this in a tunable, transparent way.

**Goal.** A personal-use web tool: input enemy team (1T/2D/2S), optional map+mode, optional bans → output top 3–5 recommended own compositions with score breakdown and explanation.

**Primary user.** Project author only. No auth, no multi-user concerns.

**Success metric.** Author uses it before/during own comp matches; suggestions feel reasonable; iterating on data is easy.

## Scope

### In ramках
- Single-page web app (Vite + Vue 3 + TypeScript + TailwindCSS).
- Enemy team input always full 5 (1T/2D/2S).
- Optional map + game-mode picker.
- Optional banned heroes input (excluded from both teams).
- Pairwise NxN matchup table (-2..+2 integer).
- Per-hero weighted archetype vector over {dive, brawl, poke}.
- Synergy + anti-synergy pair maps (sparse).
- Map-conditional overrides for pairwise + anti-synergy.
- Brute-force enumeration of legal own comps, top-K=5 by weighted score.
- Live recompute on input change. Spinner if compute >200ms.
- Reasoning panel per suggestion (templated from top contributing terms).
- Enemy comp analysis panel (archetype profile + key threats).
- Static data in JSON under `src/data/`.
- Node ingestion script to scrape hero roster + portraits from official site.
- Vitest unit + snapshot tests on scoring/search.
- Deployment to GitHub Pages, static.

### Вне рамок (намеренно)
- User accounts / auth / multi-user.
- Backend / server / database.
- Rank-tier-specific matchup tables (single global table only).
- OW1 / 6v6 / Stadium modes.
- ML-learned weights.
- Live game state ingestion (no overlay, no screenshot OCR, no API).
- Partial enemy input / in-draft progressive updates.
- Hero pool constraints / forced own picks.
- Persistence (localStorage, URL state, named scenarios).
- Weight tuning UI (weights live in code/JSON).
- Mobile-first layout (desktop only; basic responsive shrink ok).
- i18n (English only).

## User scenarios

1. **Main flow.** Open app → click 5 enemy portraits to fill T/D/D/S/S slots → suggestions render live as slots fill. Once 5th slot picked, top-5 own comps appear, ranked, scored, with expandable reasoning. Enemy comp analysis panel shows enemy archetype profile + flagged threats.
2. **Map context flow.** Toggle "Map context" on → pick map + mode dropdown → scores recompute applying map overrides to pairwise/anti-synergy.
3. **Bans flow.** Open "Bans" section → pick up to 4 banned heroes → both teams' candidate sets exclude bans → enemy slots already containing banned hero are flagged invalid until cleared.
4. **No strong counter.** All top-5 score below configured `WEAK_THRESHOLD`. Suggestions still render, each tagged "Weak counter" badge.
5. **Data update.** New hero released → run `npm run sync-heroes` → script updates `heroes.json` skeleton + downloads portrait → author manually fills role/archetype vector and pairwise rows.

## UX/UI

### Layout (desktop)

```
+---------------------------------------------------------------+
|  OW Counter                          [Map ctx ▢] [Bans ▾]    |
+---------------------------------------------------------------+
|  Enemy Team                                                   |
|  [T:Rein] [D:Soj] [D:Tracer] [S:Ana] [S:Kiri]                 |
|                                                               |
|  TANK    [Rein][D.Va][Sigma][Orisa][Zarya]...                 |
|  DPS     [Soj][Tracer][Genji][Pharah]...                      |
|  SUPPORT [Ana][Kiri][Bap][Mercy]...                           |
+---------------------------------------------------------------+
|  Enemy comp: 65% dive / 25% poke / 10% brawl                  |
|  Key threats: Tracer, Sojourn                                 |
+---------------------------------------------------------------+
|  Suggested counters                                           |
|  ┌── Comp #1   Score 8.7  ▼ explain ──────────────┐           |
|  │  [Winston][Sombra][Tracer][Kiriko][Lúcio]      │           |
|  │  Strong: Winston vs Ana +2, Sombra vs Soj +2…  │           |
|  │  Weak:   Tracer vs Brigitte -1                 │           |
|  └────────────────────────────────────────────────┘           |
|  ┌── Comp #2   Score 8.1  ▶ explain ──────────────┐           |
|  …                                                            |
+---------------------------------------------------------------+
|  Data: OW Season 18 · Updated 2026-05-10                      |
+---------------------------------------------------------------+
```

### States
- **Empty enemy team.** "Pick 5 enemy heroes to see suggestions." Placeholders in slots.
- **Partial enemy team.** No suggestions; show "Pick N more" hint.
- **Computing (>200ms).** Inline spinner over results pane; previous results dimmed.
- **Weak counter result.** Each comp card tagged red badge "Weak counter".
- **Banned-hero conflict.** If user toggles a ban that's already in enemy slot, slot turns red with "Banned — clear this slot".

### Interaction details
- Click portrait in grid → fills next empty slot of correct role.
- Click filled slot → clear that slot.
- Hero grid filterable by role row. Portraits shown if available; autocomplete text search fallback.
- Live recompute debounced 150ms.
- Theme: dark slate base, Overwatch-orange (#F99E1A) accents, Tailwind tokens.

## Architecture

```
src/
  data/
    heroes.json          # roster, roles, archetype vectors, patch version
    matchups.json        # NxN pairwise integer matrix
    synergy.json         # sparse map of synergy pair bonuses
    antiSynergy.json     # sparse map of anti-synergy pair penalties
    maps.json            # maps + modes; per-map overrides for pairwise/anti-syn
  domain/
    types.ts             # Hero, Role, Archetype, Comp, MatchupCtx, Suggestion
    scoring.ts           # scoreComp(myComp, enemyComp, ctx, weights) + breakdown
    search.ts            # enumerateLegalComps(bans), topK(...)
    archetypes.ts        # compArchetypeProfile(comp), keyThreats(comp)
    reasoning.ts         # generateExplanation(breakdown)
  ui/
    components/
      EnemyTeamPicker.vue
      HeroGrid.vue
      SuggestionCard.vue
      EnemyCompPanel.vue
      MapContextBar.vue
      BansPanel.vue
    App.vue
  config/
    weights.ts           # default { pair: 1.0, synergy: 0.5, antiSyn: 0.5, archetype: 1.0 }
    constants.ts         # WEAK_THRESHOLD, TOP_K=5, DEBOUNCE_MS=150
scripts/
  sync-heroes.ts         # scrape roster + portraits, write heroes.json skeleton
tests/
  scoring.test.ts
  search.test.ts
  snapshots/
    known-comps.test.ts
public/
  heroes/                # portrait PNGs
```

### Flow

```
enemy[5] + bans[≤4] + mapCtx? + weights
        │
        ▼
enumerateLegalComps(bans, enemy) ── generates ~30k legal own comps
        │
        ▼
for each comp: scoreComp() ── returns { total, breakdown[] }
        │
        ▼
sort desc, take TOP_K=5
        │
        ▼
for each: generateExplanation(breakdown) → strong/weak bullets
        │
        ▼
UI render
```

## Data model

### `heroes.json`
```json
{
  "patch": "OW Season 18",
  "updated": "2026-05-10",
  "heroes": [
    {
      "id": "sojourn",
      "name": "Sojourn",
      "role": "dps",
      "archetype": { "dive": 0.6, "poke": 0.3, "brawl": 0.1 },
      "tags": ["hitscan"]
    }
  ]
}
```

- `role`: `"tank" | "dps" | "support"`.
- `archetype`: floats summing to 1.0.
- `tags`: optional, used for human filtering; not in scoring.

### `matchups.json`
```json
{
  "pairs": {
    "sojourn:pharah": 2,
    "winston:ana": 2,
    "reinhardt:pharah": -2
  }
}
```
- Key: `"myHeroId:enemyHeroId"`, integer -2..+2.
- Missing pair = 0 (neutral).

### `synergy.json` / `antiSynergy.json`
```json
{
  "pairs": {
    "kiriko:genji": 1,
    "lucio:winston": 1
  }
}
```
- Unordered pair; lookup tries both orderings.
- Anti-synergy values stored as positive in `antiSynergy.json`, applied as negative in scoring.

### `maps.json`
```json
{
  "modes": ["control", "escort", "hybrid", "push", "flashpoint", "clash"],
  "maps": [
    {
      "id": "circuit-royal",
      "name": "Circuit Royal",
      "mode": "escort",
      "overrides": {
        "matchups": { "widowmaker:hanzo": 1 },
        "antiSynergy": { "widowmaker:hanzo": -3 }
      }
    }
  ]
}
```
- `overrides.matchups` *replaces* base pairwise for listed pairs on this map.
- `overrides.antiSynergy` *replaces* base anti-synergy for listed pairs (e.g., sets 2-sniper anti-synergy to 0 on Circuit Royal).
- Unlisted pairs unchanged.

### Domain types (`domain/types.ts`)

```ts
type Role = "tank" | "dps" | "support";
type Archetype = "dive" | "brawl" | "poke";
type ArchVec = Record<Archetype, number>;

interface Hero { id: string; name: string; role: Role; archetype: ArchVec; tags?: string[]; }

interface Comp {
  tank: string;     // hero id
  dps: [string, string];
  support: [string, string];
}

interface MatchupCtx {
  mapId?: string;
  bans: string[];   // hero ids
}

interface Weights { pair: number; synergy: number; antiSyn: number; archetype: number; }

interface Term { kind: "pair" | "synergy" | "antiSyn" | "archetype"; label: string; value: number; }
interface ScoreResult { total: number; terms: Term[]; }

interface Suggestion { comp: Comp; score: number; breakdown: Term[]; weak: boolean; }
```

## API / Contracts (internal modules)

### `scoring.ts`
```ts
function scoreComp(my: Comp, enemy: Comp, ctx: MatchupCtx, w: Weights): ScoreResult
```
- Pairwise: Σ over (myHero, enemyHero) ∈ 5×5 of `pair(myHero, enemyHero, ctx.mapId)` × `w.pair`.
- Synergy: Σ over unordered pairs in `my` of `synergy(a, b)` × `w.synergy`.
- AntiSynergy: Σ over unordered pairs in `my` of `antiSyn(a, b, ctx.mapId)` × `w.antiSyn` (penalty applied negative).
- Archetype: `archetypeMatchScore(my, enemy)` × `w.archetype`.
- Each contribution emitted as a `Term` with a human-readable label.

### `archetypes.ts`
```ts
function compArchetypeProfile(comp: Comp): ArchVec        // sum of vectors / 5
function archetypeMatchScore(my: Comp, enemy: Comp): number
function keyThreats(enemy: Comp): string[]                // hero ids the algo flags
```
- `archetypeMatchScore`: known counter pairs (dive counters poke = +1, brawl counters dive = +1, poke counters brawl = +1; symmetric −1 in reverse). Result = Σ over `archetype × counterArchetype` weights of my profile vs counter of enemy profile. Bounded ≈ [-1..+1] before weight.
- `keyThreats`: heroes in enemy comp with highest sum of (positive) outgoing pairwise scores vs full hero pool (i.e., heroes hardest to counter).

### `search.ts`
```ts
function topKCounters(enemy: Comp, ctx: MatchupCtx, k = 5, w: Weights): Suggestion[]
```
- Enumerates legal own comps obeying:
  - 1 tank, 2 dps, 2 support.
  - No duplicates within own team.
  - Bans excluded.
- Order within DPS/Support pair canonicalized (sorted by hero id) to avoid duplicate-comp blowup.
- Scores all, returns top K. Ties broken by archetype score, then alphabetical tank id (deterministic).
- `weak = top.total < WEAK_THRESHOLD` flag per suggestion.

### `reasoning.ts`
```ts
function generateExplanation(terms: Term[]): { strong: string[]; weak: string[] }
```
- Sort terms by absolute value desc.
- Take top N positive → `strong`; top N negative → `weak`.
- Each `Term.label` already human-readable from scoring step.

## Asset / data ingestion script

`scripts/sync-heroes.ts` (run via `npm run sync-heroes`):
1. Fetch Blizzard rates page HTML (`https://overwatch.blizzard.com/.../rates/...`).
2. Parse roster from rendered/embedded data (network XHR likely needed — script must inspect network calls; if pure SSR HTML insufficient, use Playwright headless to extract).
3. For each hero: download portrait image to `public/heroes/<id>.png`.
4. Merge into `src/data/heroes.json`:
   - Add new heroes with placeholder `archetype` (uniform 0.33/0.33/0.34) and empty `tags`.
   - Preserve manually-curated fields on existing heroes.
   - Update `patch` + `updated` fields.
5. Print diff summary (added/removed heroes).

Manual follow-up after script: fill archetype vectors, add pairwise rows in `matchups.json`.

## Performance & scale

- Roster size ≈ 40 heroes; rough role split ≈ 14T / 18D / 9S.
- Legal own comps: 14 × C(18,2) × C(9,2) ≈ 14 × 153 × 36 ≈ 77,112. Easily enumerated in <100ms in JS.
- Scoring per comp: 25 pair lookups + 10 own-pair lookups + 10 anti-syn lookups + 1 archetype calc ≈ ~50 hash lookups. Trivial.
- Defensive UI: if compute exceeds 200ms (e.g., after roster growth or richer scoring), show spinner. Recompute debounced 150ms.

## Tests

- **Unit (`scoring.test.ts`).** Synthetic 5-hero roster with known matchups; assert `scoreComp` returns correct breakdown terms and total.
- **Unit (`search.test.ts`).** Verify `topKCounters` returns 5 results, no duplicates within comp, bans excluded, ordering deterministic on ties.
- **Snapshot (`snapshots/known-comps.test.ts`).** A handful of canonical enemy comps (dive, brawl, poke) → assert top-5 hero ids unchanged across runs. Regenerate snapshots intentionally when data tuned.
- **Manual smoke.** Author plays own matches and adjusts data/weights.

## Deployment

- Vite production build → `dist/`.
- GitHub Pages via `gh-pages` branch or Actions workflow on push to `main`.
- Base path configured for repo subpath if not using custom domain.
- No env vars, no secrets — fully static.

## Observability

- None (personal static tool).
- Console logs in dev only.

## Risks & tradeoffs

- **Data quality is the entire product.** Manual curation effort dominates work after MVP scaffolding. Mitigation: snapshot tests prevent silent regressions; weights tunable per scenario.
- **Blizzard scrape fragility.** Page is JS-rendered; script may need Playwright. Acceptable for occasional manual runs; failure non-blocking (manually add heroes).
- **Brute force enumeration risk.** Holds while roster ≤ 50 and scoring O(1). If roster doubles or scoring grows, may need beam search — out of MVP scope.
- **Archetype tag subjectivity.** Some heroes (Echo, Sigma) hard to classify cleanly; weighted vector handles this but author must keep vectors consistent.
- **Map override curation cost.** Only model maps where overrides genuinely change ranking; skip neutral maps.
- **No persistence.** Refresh = reset. Acceptable for personal use; user explicitly opted out.

## Open questions

- Exact archetype vectors per hero — data curation, fill iteratively during use.
- Initial pairwise matrix population — start sparse (key matchups only), expand as encountered.
- Specific synergy / anti-synergy pair list — seed with obvious ones (e.g., Pharah+Mercy synergy, double-sniper anti-syn).
- Map override list — seed only maps with strongly meta-bending traits (Circuit Royal, Havana for snipers; Lijiang for dive, etc.).
- Whether scraping pure HTML suffices or Playwright is required — confirm by inspecting actual response before implementing.
- `WEAK_THRESHOLD` value — pick after first calibration runs (placeholder: 3.0).
