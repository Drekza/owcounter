# T17 — SuggestionCard component

## Goal
One card per recommended own comp: rank, score, 5 portraits, expandable reasoning panel, weak-counter badge.

## Depends on
T03, T12, T13 (portrait helper)

## Files to create
- `src/ui/components/SuggestionCard.vue`

## Props
```ts
interface SuggestionCardProps {
  rank: number;              // 1..5
  suggestion: Suggestion;    // from T11
  heroesById: Map<string, Hero>;
  reasoning: Reasoning;      // pre-computed by parent via T12
}
```

## Layout
```
┌─ Comp #1   Score 8.7   [Weak counter ◯ optional]   ▼ ──┐
│ [Tank][DPS][DPS][Sup][Sup]                              │
│                                                         │
│ ↓ Expanded                                              │
│ Strong points:                                          │
│  ✓ Sojourn vs Pharah: +2                                │
│  ✓ Winston vs Ana: +2                                   │
│  ✓ Ana + Winston: +1                                    │
│  ✓ Counter-archetype: +0.4 vs enemy poke                │
│ Weak points:                                            │
│  ✗ Genji vs Brigitte: -1                                │
│  ✗ Widow + Hanzo: -1                                    │
└─────────────────────────────────────────────────────────┘
```

## Behavior
- Collapsed by default; click header (or ▼ icon) to expand.
- First card (`rank === 1`) expanded by default.
- Portraits in slot order: Tank, DPS, DPS, Support, Support — slight role-tint borders.
- Score displayed with one decimal place.
- `Weak counter` badge:
  - Visible only if `suggestion.weak`.
  - Red rounded pill, top-right corner.
- Strong/weak bullet rows:
  - Strong: green checkmark icon, slate-100 text.
  - Weak: red cross icon, slate-300 text.
- Archetype term gets a small icon prefix (e.g., compass) to differentiate from pair terms.

## Acceptance
- Cards render correctly with 0 strong + 0 weak bullets (don't crash on empty reasoning).
- Expand/collapse animates (CSS height transition or simple v-show, no JS animation lib needed).
- Weak badge appears only when `weak === true`.
- Score "8.71" displays as "8.7" (one decimal).

## Notes
- Reasoning is computed once per suggestion by parent (T18) to avoid recompute on toggle.
- Component is purely presentational.
