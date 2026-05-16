export type Role = 'tank' | 'dps' | 'support';
export type Archetype = 'dive' | 'brawl' | 'poke';
export type ArchVec = Record<Archetype, number>;

export interface Hero {
  id: string;
  name: string;
  role: Role;
  archetype: ArchVec;
  tags?: string[];
  portrait?: string;
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

export type TermKind = 'pair' | 'synergy' | 'antiSyn' | 'archetype';

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

export type MapMode = 'control' | 'escort' | 'hybrid' | 'push' | 'flashpoint' | 'clash';

export interface MapDef {
  id: string;
  name: string;
  mode: MapMode;
  overrides?: {
    matchups?: Record<string, number>;
    antiSynergy?: Record<string, number>;
  };
}
