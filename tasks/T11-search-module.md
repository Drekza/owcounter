# T11 — Search module (enumeration + top-K)

## Goal
Enumerate all legal own comps given role/ban/duplicate constraints; score each via T09; return top-K suggestions.

## Depends on
T03, T09, T10

## Files to create
- `src/domain/search.ts`

## API
```ts
import type { Comp, MatchupCtx, Suggestion, Weights, Hero } from "./types";
import type { ScoringData } from "./scoring";

export function topKCounters(
  enemy: Comp,
  ctx: MatchupCtx,
  k: number,
  weights: Weights,
  data: ScoringData
): Suggestion[];

export function* enumerateLegalComps(
  bans: ReadonlySet<string>,
  heroes: ReadonlyArray<Hero>
): Generator<Comp>;
```

## Algorithm

### Enumeration
1. Bucket heroes by role: `tanks[]`, `dps[]`, `supports[]`.
2. Filter out banned heroes from each bucket.
3. Triple-nested iteration:
   - For each tank `t`:
     - For each DPS pair `(d1, d2)` with `d1 < d2` (canonical, no duplicates):
       - For each support pair `(s1, s2)` with `s1 < s2`:
         - Yield `Comp { tank: t, dps: [d1, d2], support: [s1, s2] }`.
4. Note: bans exclude the hero from BOTH teams, but enemy comp is given fixed — algorithm doesn't validate enemy here (UI handles ban-vs-enemy conflict per T15).
5. Mirror picks allowed — own comp may include heroes also present in enemy comp.

### Top-K
1. For each generated comp: `result = scoreComp(comp, enemy, ctx, weights, data)`.
2. Maintain a min-heap of size K (or, given small N, just collect-then-sort).
3. Sort descending by `result.total`. Tiebreakers:
   - Higher archetype-term value.
   - Alphabetical tank id (deterministic final order).
4. For each of top K, build `Suggestion { comp, score, breakdown, weak: total < WEAK_THRESHOLD }`.

### Performance
- Expected ~77k comps. Pure-JS loop, no allocations beyond Suggestion array.
- If profiling shows >100ms: precompute pairwise sums in 5×N matrix per slot — skip for MVP.
- Avoid sorting all 77k; partial sort / heap is fine but collect-then-`Array.sort` works at this scale.

## Acceptance
- Enumeration count for unbanned roster of (14 tanks, 18 dps, 9 supports) ≈ 14 × 153 × 36 = 77,112.
- No duplicate comps (canonical order in DPS/support pairs enforced).
- No within-team duplicates.
- Bans correctly exclude.
- Returns deterministic order across runs.

## Notes
- Keep generator pure / lazy — allows future filters (e.g., hero-pool restrictions) without rewrite.
- `topKCounters` is the only public function called by app integration (T18).
