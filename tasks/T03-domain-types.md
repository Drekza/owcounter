# T03 — Domain types

## Goal
Define all shared TypeScript types used by data files, scoring, search, UI.

## Depends on
T01

## Files to create
- `src/domain/types.ts`

## Content
```ts
export type Role = "tank" | "dps" | "support";
export type Archetype = "dive" | "brawl" | "poke";
export type ArchVec = Record<Archetype, number>;

export interface Hero {
  id: string;
  name: string;
  role: Role;
  archetype: ArchVec;
  tags?: string[];
  portrait?: string; // path relative to public/, e.g. "/heroes/sojourn.png"
}

export interface Comp {
  tank: string;
  dps: [string, string];
  support: [string, string];
}

export interface MatchupCtx {
  mapId?: string;
  bans: string[];
}

export interface Weights {
  pair: number;
  synergy: number;
  antiSyn: number;
  archetype: number;
}

export type TermKind = "pair" | "synergy" | "antiSyn" | "archetype";
export interface Term {
  kind: TermKind;
  label: string;
  value: number;
}

export interface ScoreResult {
  total: number;
  terms: Term[];
}

export interface Suggestion {
  comp: Comp;
  score: number;
  breakdown: Term[];
  weak: boolean;
}

export interface MapDef {
  id: string;
  name: string;
  mode: "control" | "escort" | "hybrid" | "push" | "flashpoint" | "clash";
  overrides?: {
    matchups?: Record<string, number>;     // "myHeroId:enemyHeroId" → score
    antiSynergy?: Record<string, number>;  // "heroA:heroB" → score (positive = penalty)
  };
}
```

## Acceptance
- `npm run typecheck` clean.
- All other modules import from this single file.

## Notes
- Keep zero runtime code; types only.
- If a type is used only inside one module, define it there — not here.
