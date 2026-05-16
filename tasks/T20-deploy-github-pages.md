# T20 — GitHub Pages deployment

## Goal
Auto-deploy `dist/` to GitHub Pages on push to `main`.

## Depends on
T01 + everything that produces a working build.

## Files to create/modify
- `.github/workflows/deploy.yml`
- `vite.config.ts` — set `base` to `/<repo-name>/` (or `/` if using custom domain)
- `package.json` — confirm build script
- `public/.nojekyll` (empty file — prevents Jekyll from filtering `_` directories)

## `.github/workflows/deploy.yml`
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test -- --run
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Vite config
```ts
// vite.config.ts
export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/owcounter/" : "/",
  plugins: [vue()],
});
```
- Set `GITHUB_PAGES=true` in workflow env to enable subpath.
- Adjust `/owcounter/` to actual repo name.

## Acceptance
- Push to `main` triggers workflow.
- Workflow stages: typecheck → tests → build → upload → deploy.
- After ~2 min, app reachable at `https://<user>.github.io/owcounter/`.
- Portraits load correctly with subpath (verify `import.meta.env.BASE_URL` used in image src).
- `.nojekyll` exists in `dist/` after build (Vite copies `public/`).

## Notes
- One-time setup in repo: Settings → Pages → Source = "GitHub Actions".
- If using custom domain: add `public/CNAME` with domain, set `base: "/"`.
- Skip portraits in build by mistake? Verify `public/heroes/` ships in `dist/`.
