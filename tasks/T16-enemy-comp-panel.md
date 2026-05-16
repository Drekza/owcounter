# T16 — EnemyCompPanel component

## Goal
Display enemy comp's archetype profile (dive / brawl / poke %) + flagged key threats.

## Depends on
T03, T10

## Files to create
- `src/ui/components/EnemyCompPanel.vue`

## Props
```ts
interface EnemyCompPanelProps {
  enemy: Comp;
  archetypeProfile: ArchVec;     // computed by parent via compArchetypeProfile
  keyThreats: string[];          // hero ids
  heroesById: Map<string, Hero>;
}
```

## Layout
```
+------------------------------------------------------------+
| Enemy comp:                                                |
|  ▮▮▮▮▮▮▯▯▯▯  Dive 60%                                      |
|  ▮▮▯▯▯▯▯▯▯▯  Brawl 20%                                     |
|  ▮▮▮▯▯▯▯▯▯▯  Poke 20%                                      |
|                                                            |
| Key threats: [Tracer] [Sojourn]                            |
+------------------------------------------------------------+
```

## Behavior
- Render three bars or stacked single bar (use 10-segment ASCII-style or HTML divs with widths).
- Color per archetype:
  - Dive — orange (`ow-orange`)
  - Brawl — red (`#ef4444`)
  - Poke — blue (`#3b82f6`)
- Key threats: small inline portraits (or initials fallback) with hero name beneath.
- If enemy comp incomplete (parent passes empty state): render placeholder "Pick enemy team to see analysis."

## Acceptance
- Bars render proportional to archetype values (sum to 100%).
- Rounding shows percentages that add to 100% (recompute the last bar to absorb rounding error).
- Key threats render with 1–2 portraits; never zero (always picks top).

## Notes
- Pure presentational — `compArchetypeProfile` and `keyThreats` called by parent (T18), passed in as props.
- Bar implementation: simple `<div class="h-2 bg-slate-700"><div class="h-full bg-ow-orange" :style="{ width: pct }"/></div>` per archetype.
