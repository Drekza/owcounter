# T12 — Reasoning generator

## Goal
Convert a `ScoreResult.terms` array into human-readable "Strong points" / "Weak points" bullet lists for the suggestion card.

## Depends on
T03, T09

## Files to create
- `src/domain/reasoning.ts`

## API
```ts
import type { Term } from "./types";

export interface Reasoning {
  strong: string[];   // 3–5 bullets
  weak: string[];     // 0–3 bullets
}

export function generateExplanation(
  terms: Term[],
  opts?: { maxStrong?: number; maxWeak?: number }
): Reasoning;
```

## Algorithm
1. Default `maxStrong = 4`, `maxWeak = 2`.
2. Sort terms by absolute `value` descending.
3. Walk sorted terms; collect positives into `strong` (up to `maxStrong`), negatives into `weak` (up to `maxWeak`).
4. Use `Term.label` directly — scoring module (T09) already formats it ("Sojourn vs Pharah: +2", "Ana + Winston: +2", etc.).
5. Add archetype term icon/prefix if `kind === "archetype"` for visual grouping (UI handles styling; label already self-describes).
6. Stop early once both bucket caps hit.

## Examples
Input terms (sorted by |value|):
```
{ kind: "pair",      label: "Sojourn vs Pharah", value: +2.0 }
{ kind: "pair",      label: "Winston vs Ana",   value: +2.0 }
{ kind: "synergy",   label: "Ana + Winston",    value: +1.0 }
{ kind: "archetype", label: "Counter-archetype: +0.4 vs enemy poke", value: +0.4 }
{ kind: "pair",      label: "Genji vs Brigitte", value: -1.0 }
{ kind: "antiSyn",   label: "Widow + Hanzo",    value: -1.0 }
```

Output:
```ts
{
  strong: [
    "Sojourn vs Pharah: +2",
    "Winston vs Ana: +2",
    "Ana + Winston: +1",
    "Counter-archetype: +0.4 vs enemy poke",
  ],
  weak: [
    "Genji vs Brigitte: -1",
    "Widow + Hanzo: -1",
  ],
}
```

## Acceptance
- Pure function, no IO.
- Stable output order across runs given identical input.
- Respects `maxStrong`/`maxWeak` caps.
- Handles empty `terms` → both bullets arrays empty.
- All-positive input → `weak: []`.

## Notes
- The label content comes from T09; modifying label format = update tests in T19.
- UI component (T17) styles bullets, adds checkmark / cross icons.
