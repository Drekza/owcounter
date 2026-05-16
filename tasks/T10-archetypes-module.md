# T10 — Archetypes module

## Goal
Comp-level archetype profile, archetype match score (my vs enemy), and key-threat extraction for enemy comp.

## Depends on
T03, T05, T06

## Files to create
- `src/domain/archetypes.ts`

## API
```ts
import type { Comp, ArchVec, Hero } from "./types";

export function compArchetypeProfile(comp: Comp, heroes: Map<string, Hero>): ArchVec;

export function archetypeMatchScore(
  my: Comp,
  enemy: Comp,
  heroes: Map<string, Hero>
): { value: number; label: string };

export function keyThreats(
  enemy: Comp,
  heroes: Map<string, Hero>,
  matchups: Record<string, number>
): string[];  // hero ids, max 2
```

## Algorithm

### `compArchetypeProfile`
- Sum vectors of all 5 heroes per axis → divide by 5 → ArchVec summing to 1.0.

### `archetypeMatchScore`
- Define counter relationships (rock-paper-scissors style):
  ```ts
  const COUNTERS: Record<Archetype, Archetype> = {
    dive: "poke",   // dive counters poke
    brawl: "dive",  // brawl counters dive
    poke: "brawl",  // poke counters brawl
  };
  ```
- `myProfile = compArchetypeProfile(my)`, `enemyProfile = compArchetypeProfile(enemy)`.
- Score:
  ```
  value = Σ over archetype A of (myProfile[A] × enemyProfile[COUNTERS[A]])
        - Σ over archetype A of (myProfile[COUNTERS[A]] × enemyProfile[A])
  ```
  Bounded roughly in `[-1, +1]`.
- Label: produce short human-readable string:
  - `value > 0.3` → "Comp archetype: counters enemy profile (+0.42)"
  - `value < -0.3` → "Comp archetype: countered by enemy profile (-0.35)"
  - else → "Comp archetype: neutral"

### `keyThreats`
- For each enemy hero, compute "how hard to counter" =
  `−min over all my-pool heroes of matchups["<myHeroId>:<enemyHeroId>"]`.
  (Lower-magnitude min = fewer good answers exist.)
- Tiebreaker: prefer enemy heroes in DPS role (usually carry damage).
- Return top 2 ids.

## Acceptance
- `compArchetypeProfile` output sums to 1.0 ±0.01.
- `archetypeMatchScore` symmetric in expected way: `score(A, B) = -score(B, A)` when same hero pool and identical comps swapped.
- `keyThreats` returns deterministic 2 ids, never more.

## Notes
- `compArchetypeProfile` is reused by `EnemyCompPanel.vue` (T16) for visualization.
- Tag heroes in `heroes.json` for archetype consistency; this module relies solely on `archetype` vectors.
