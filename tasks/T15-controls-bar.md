# T15 — Controls bar (Bans + Map context)

## Goal
Top-of-app controls strip containing optional bans picker (up to 4 heroes) and optional map+mode dropdowns.

## Depends on
T03, T13

## Files to create
- `src/ui/components/ControlsBar.vue`
- `src/ui/components/BansPanel.vue`
- `src/ui/components/MapContextBar.vue`

## Layout
```
+-------------------------------------------------------------+
|  [Map context ▢ toggle]  [Bans (0/4) ▾]                    |
+-------------------------------------------------------------+
   ↓ when bans open
   +------------------------------------------------+
   | Selected: [Sombra x] [Bastion x]               |
   | <HeroGrid filter=all, multiselect, max=4>      |
   +------------------------------------------------+

   ↓ when map context toggled on
   +------------------------------------------------+
   | Mode: [Escort ▾]   Map: [Circuit Royal ▾]      |
   +------------------------------------------------+
```

## Props / Events (per child)

### `BansPanel.vue`
```ts
interface BansProps {
  heroes: Hero[];
  modelValue: string[];   // hero ids, max 4
}
// emits 'update:modelValue'
```
- Multiselect HeroGrid (max 4); clicking selected hero unbans.
- Show count "Bans (N/4)" in collapsed header.

### `MapContextBar.vue`
```ts
interface MapCtxProps {
  maps: MapDef[];
  modelValue: { enabled: boolean; mapId: string | null };
}
// emits 'update:modelValue'
```
- "Map context" toggle switch.
- When enabled: mode dropdown populated from `maps[].mode` distinct list; map dropdown filtered by chosen mode.
- Default enabled=false, mapId=null.

## Acceptance
- Bans selection caps at 4; selecting 5th replaces oldest or rejects (rejects — spec).
- Map context toggle off → `mapId=null` propagated.
- Mode change resets map selection.
- Visual conflict signaling for "ban already in enemy slot" handled by parent (T18); this component just emits state.

## Notes
- Use `<details>` element or headless UI disclosure for collapsible sections.
- Keep `ControlsBar.vue` as a thin container slotting the two child panels.
