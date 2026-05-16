# T01 — Project scaffold

## Goal
Bootstrap Vite + Vue 3 + TypeScript + TailwindCSS project. Establish folder structure per spec.

## Depends on
— (first task)

## Files to create
- `package.json` (Vite, Vue 3, TS, Tailwind, Vitest, gh-pages or similar deploy lib)
- `vite.config.ts` (with `base` placeholder for GH Pages)
- `tsconfig.json`, `tsconfig.node.json`
- `tailwind.config.ts`, `postcss.config.js`
- `index.html`
- `src/main.ts`, `src/App.vue` (empty stub)
- `src/style.css` (Tailwind directives)
- `.gitignore` (node_modules, dist, .vite cache, env)
- `.editorconfig`
- Folder skeleton:
  - `src/data/` (empty .gitkeep)
  - `src/domain/`
  - `src/ui/components/`
  - `src/config/`
  - `scripts/`
  - `tests/`
  - `public/heroes/` (.gitkeep)

## Acceptance
- `npm install` works.
- `npm run dev` serves blank page with Tailwind active (verify by applying `bg-slate-900` to body).
- `npm run build` produces `dist/`.
- `npm run typecheck` (vue-tsc --noEmit) passes on empty project.
- `npm run test` (vitest) discovers no tests, exits 0.

## Notes
- Use `pnpm` only if user opts in; default `npm` is fine.
- Pin Vue 3.4+, Vite 5+, TS 5+.
- Tailwind 3.x (4.x optional if user wants).
