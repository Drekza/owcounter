# T13 — HeroGrid component

## Goal
Reusable grid of hero portraits grouped by role, click-to-select, with text autocomplete fallback when portraits missing.

## Depends on
T02, T03, T05 (or fixtures)

## Files to create
- `src/ui/components/HeroGrid.vue`
- `src/ui/components/HeroPortrait.vue` (small leaf component)

## Props
```ts
interface HeroGridProps {
  heroes: Hero[];          // full roster
  disabledIds?: string[];  // grayed-out (banned, already picked in target slot)
  selectedIds?: string[];  // visually marked selected
  filterRole?: Role;       // if set, show only that role row
  onPick: (heroId: string) => void;
}
```

## Behavior
- Render three labeled rows: TANK / DPS / SUPPORT.
- Each row: horizontal grid of `HeroPortrait`s, sorted alphabetically by name.
- `HeroPortrait`:
  - If `hero.portrait` exists → `<img>` with `loading="lazy"`.
  - On `img` load error → fallback to colored circle with hero initials and role-tinted border (tank=blue, dps=red, support=green).
- Hover state: scale 1.05 + orange ring.
- Disabled: opacity 40%, no pointer events.
- Selected: orange ring + checkmark badge corner.
- Text autocomplete fallback row at top of grid:
  - Single `<input>` with placeholder "Search heroes…"
  - Filters all three rows by name `includes()` case-insensitive.
  - On Enter with exactly one match → emit `onPick`.

## Acceptance
- Renders with empty `disabledIds`/`selectedIds`.
- Click on portrait emits `onPick(heroId)`.
- Disabled portraits do not emit.
- Search filter works across roles.
- Missing portrait falls back to initials placeholder without console errors.
- Tested at 1024px width without horizontal scroll.

## Notes
- Use `import.meta.env.BASE_URL` for portrait paths when deploying to GH Pages subpath.
- Keep zero state in this component (pure presentational); state lives in T18.
