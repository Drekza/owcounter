# T14 — EnemyTeamPicker component

## Goal
Five-slot enemy team display + integration with HeroGrid for picking.

## Depends on
T03, T13

## Files to create
- `src/ui/components/EnemyTeamPicker.vue`
- `src/ui/components/SlotChip.vue` (single slot visual)

## Props / Events
```ts
interface EnemyTeamPickerProps {
  heroes: Hero[];           // roster
  bans: string[];           // banned hero ids (prevented from picking)
  modelValue: EnemyState;   // v-model
}

interface EnemyState {
  tank: string | null;
  dps: [string | null, string | null];
  support: [string | null, string | null];
}

// emits: 'update:modelValue'
```

## Behavior
- Five slot chips in one row: T / D / D / S / S, color-coded borders.
- Each chip:
  - Empty: dashed border + role icon + role label.
  - Filled: portrait + hero name + "x" to clear.
- Below chips: full HeroGrid (T13).
  - Disabled ids = `bans ∪ alreadyPickedInOwnTeam` (none for enemy — duplicates across teams allowed per spec).
  - On pick: fill the next empty slot of correct role; if all role slots full → no-op (or replace last? — spec says no-op with subtle warning).
- "Reset" button clears all slots.

### Pick algorithm
1. Hero clicked has role `r`.
2. Find first slot in `EnemyState` matching `r` that is `null` → set it.
3. If all role slots full → flash subtle "Slot full" toast/border pulse on existing slots of that role.

### Hover/keyboard
- Tab through slot chips and `x` buttons.
- Clicking slot chip clears it (alternative to `x`).

## Acceptance
- Picking 5 heroes (1T/2D/2S) fills all slots.
- Picking a 6th tank does nothing (no replacement).
- Clear-slot button works.
- v-model emits new EnemyState reactively.
- All slots required filled to enable downstream computation (T18 enforces).

## Notes
- Component knows nothing about scoring or suggestions — purely input.
- Ban interaction (UI excluding banned heroes) handled by parent via `bans` prop.
