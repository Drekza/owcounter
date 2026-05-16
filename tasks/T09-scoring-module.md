# T09 — Scoring module

## Goal
Pure function that scores a candidate own comp against the enemy comp, returning total + itemized breakdown of contributing terms.

## Depends on
T03, T05, T06, T07, T08 (data files), but can be implemented against fixtures while data is curated.

## Files to create
- `src/domain/scoring.ts`
- `src/config/weights.ts`
- `src/config/constants.ts`

## API
```ts
import type { Comp, MatchupCtx, ScoreResult, Weights } from "./types";

export function scoreComp(
  my: Comp,
  enemy: Comp,
  ctx: MatchupCtx,
  weights: Weights,
  data: ScoringData
): ScoreResult;

export interface ScoringData {
  heroesById: Map<string, Hero>;
  matchups: Record<string, number>;
  synergy: Record<string, number>;
  antiSynergy: Record<string, number>;
  mapsById: Map<string, MapDef>;
}
```

## Algorithm
For each candidate `my` vs `enemy`:

1. **Pairwise sum.** For each (myHero, enemyHero) in 5×5 grid:
   - Lookup `matchups[myHero:enemyHero]` (default 0).
   - If `ctx.mapId` set and map has matching override → use override value instead.
   - Multiply by `weights.pair`. Append `Term { kind: "pair", label: \`${myName} vs ${enemyName}: ${v}\`, value: v * weights.pair }` (only if nonzero).

2. **Synergy.** For each unordered pair (a, b) of own heroes (10 pairs):
   - Lookup `synergy["<sorted>:<sorted>"]` (default 0). No map override for synergy.
   - Multiply by `weights.synergy`. Append `Term { kind: "synergy", label: \`${aName} + ${bName}: +${v}\`, value: v * weights.synergy }`.

3. **AntiSynergy.** For each unordered pair (a, b) of own heroes:
   - Lookup `antiSynergy[...]`. Apply map override (replace value, possibly to 0).
   - Multiply by `weights.antiSyn` and *negate* (penalty). Append `Term { kind: "antiSyn", label: \`${aName} + ${bName}: -${v}\`, value: -v * weights.antiSyn }`.

4. **Archetype match.** Delegate to `archetypeMatchScore(my, enemy, data)` from T10. Multiply by `weights.archetype`. Append `Term { kind: "archetype", label: ..., value: ... }`.

5. **Total** = sum of all term values.

## `src/config/weights.ts`
```ts
import type { Weights } from "../domain/types";
export const DEFAULT_WEIGHTS: Weights = {
  pair: 1.0,
  synergy: 0.5,
  antiSyn: 0.5,
  archetype: 1.0,
};
```

## `src/config/constants.ts`
```ts
export const TOP_K = 5;
export const WEAK_THRESHOLD = 3.0;  // calibrate post-MVP
export const DEBOUNCE_MS = 150;
export const COMPUTE_SPINNER_MS = 200;
```

## Acceptance
- Pure function (no IO, no globals); deterministic.
- Symmetric pair lookups work (canonical key + reverse).
- Map overrides replace, not add.
- Terms list contains only nonzero contributions.
- Total === sum of term values to floating-point precision.
- Covered by tests in T19.

## Notes
- Don't compute `Hero` name → id lookups inline — accept `ScoringData.heroesById` to avoid linear scans.
- Build `ScoringData` once at app start; reuse across all candidate scoring.
- Avoid allocating new arrays in hot path beyond the terms list.
