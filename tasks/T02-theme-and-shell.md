# T02 — Theme and app shell

## Goal
Dark-mode Overwatch-inspired theme + base `App.vue` layout matching spec mockup.

## Depends on
T01

## Files to create/modify
- `tailwind.config.ts` — extend colors:
  - `slate-base: #0f172a` (background)
  - `slate-panel: #1e293b` (cards)
  - `ow-orange: #F99E1A` (accent)
  - `ow-orange-dim: #C77A0F`
  - text default: slate-100
- `src/style.css` — global resets, `body` background + font.
- `src/App.vue` — three-region layout per spec mockup:
  - Header bar (title left, controls right placeholder)
  - Enemy team region
  - Enemy comp analysis region
  - Suggestions region
  - Footer (data patch + updated date placeholder)
- `src/ui/components/Header.vue` — title "OW Counter" + slot for controls.

## Acceptance
- App renders dark slate background, orange accent on title.
- Layout regions visible with placeholder text.
- Responsive shrink works down to ~1024px (basic flex/grid).
- Footer pulls patch info from `heroes.json` once available (lazy — placeholder OK now).

## Notes
- No mobile layouts; min reasonable width 1024px.
- Keep `App.vue` as orchestrator only; logic lives elsewhere.
