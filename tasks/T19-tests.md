# T19 — Tests (unit + snapshot)

## Goal
Vitest setup + unit tests for scoring, search, reasoning, archetypes + snapshot tests for canonical enemy comps.

## Depends on
T09, T10, T11, T12 (modules under test); T05–T08 (data — only for snapshot tests)

## Files to create
- `vitest.config.ts`
- `tests/setup.ts`
- `tests/fixtures/heroes.fixture.ts` (small synthetic roster for unit tests)
- `tests/scoring.test.ts`
- `tests/archetypes.test.ts`
- `tests/search.test.ts`
- `tests/reasoning.test.ts`
- `tests/snapshots/known-comps.test.ts`
- `tests/snapshots/__snapshots__/` (auto)

## Unit test scope

### `scoring.test.ts`
- Synthetic roster (5 tanks, 5 dps, 5 supports).
- Test pairwise sum correctness (single nonzero matchup).
- Test synergy/antiSynergy contribution.
- Test map override replaces base pairwise.
- Test archetype term added with correct sign and label.
- Test total equals sum of terms.
- Edge: empty matchup table → only archetype term (or zero terms).
- Edge: identical own and enemy comps → expected ~0 archetype, possibly mirror anti-syn.

### `archetypes.test.ts`
- `compArchetypeProfile`: synthetic comp with known vectors → expected averaged profile.
- `archetypeMatchScore`:
  - Pure-dive my-comp vs pure-poke enemy → positive value.
  - Reverse → negative value of same magnitude.
  - Neutral profiles → ~0.
- `keyThreats`: enemy comp with one truly unanswerable hero → ranked first.

### `search.test.ts`
- Roster: 2 tanks, 3 dps, 2 supports → expect 2 × C(3,2) × C(2,2) = 2 × 3 × 1 = 6 legal comps.
- Bans remove correct heroes from enumeration.
- `topKCounters` k=3 → returns 3 sorted descending.
- Deterministic order on tie (test by feeding flat scores → expect alphabetical tank order).

### `reasoning.test.ts`
- 6 terms (mixed sign) → `strong` has top-4 positive, `weak` has top-2 negative.
- All-positive → `weak: []`.
- All-negative → `strong: []`.
- Empty input → both arrays empty.
- Tie on absolute value → stable order preserved.

## Snapshot tests

### `tests/snapshots/known-comps.test.ts`
- Use real `src/data/*.json`.
- For each canonical enemy comp (define ~5–8 in fixture):
  - Pure dive enemy (Winston/Tracer/Genji/Lúcio/Kiriko)
  - Pure poke enemy (Sigma/Widow/Ashe/Ana/Bap)
  - Pure brawl enemy (Rein/Mauga[as DPS? — use legal brawl DPS]/Brigitte/...)
  - Mixed dive+poke
  - With a map context (Circuit Royal + double-sniper enemy)
  - With bans applied
- Snapshot the array of top-5 hero ids (NOT full breakdown — breakdown labels change with data tweaks).
- Snapshots regenerated intentionally when data changes; reviewer reads diff during PR.

## Acceptance
- `npm run test` runs all tests, all pass.
- Coverage report (optional): `npm run test -- --coverage` shows >80% on `domain/`.
- Snapshot baseline committed.

## Notes
- Use Vitest's `it.each` for parametrized matchup/archetype cases.
- Mock `console.log` if scoring emits any debug.
- Snapshot file naming: keep readable (e.g., `pure-dive-counters.snap`).
