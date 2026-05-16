import type { Archetype, ArchVec, Hero, MapDef, Role } from '../../src/domain/types';
import type { ScoringData } from '../../src/domain/scoring';

const ARCH = {
  dive: { dive: 1, brawl: 0, poke: 0 } as ArchVec,
  brawl: { dive: 0, brawl: 1, poke: 0 } as ArchVec,
  poke: { dive: 0, brawl: 0, poke: 1 } as ArchVec,
  mix: { dive: 0.33, brawl: 0.34, poke: 0.33 } as ArchVec,
};

export const heroes: Hero[] = [
  { id: 't1', name: 'T1', role: 'tank', archetype: ARCH.dive },
  { id: 't2', name: 'T2', role: 'tank', archetype: ARCH.brawl },
  { id: 't3', name: 'T3', role: 'tank', archetype: ARCH.poke },
  { id: 't4', name: 'T4', role: 'tank', archetype: ARCH.mix },
  { id: 't5', name: 'T5', role: 'tank', archetype: ARCH.mix },
  { id: 'd1', name: 'D1', role: 'dps', archetype: ARCH.dive },
  { id: 'd2', name: 'D2', role: 'dps', archetype: ARCH.brawl },
  { id: 'd3', name: 'D3', role: 'dps', archetype: ARCH.poke },
  { id: 'd4', name: 'D4', role: 'dps', archetype: ARCH.mix },
  { id: 'd5', name: 'D5', role: 'dps', archetype: ARCH.mix },
  { id: 's1', name: 'S1', role: 'support', archetype: ARCH.dive },
  { id: 's2', name: 'S2', role: 'support', archetype: ARCH.brawl },
  { id: 's3', name: 'S3', role: 'support', archetype: ARCH.poke },
  { id: 's4', name: 'S4', role: 'support', archetype: ARCH.mix },
  { id: 's5', name: 'S5', role: 'support', archetype: ARCH.mix },
];

export const heroesById: Map<string, Hero> = new Map(heroes.map((h) => [h.id, h]));

export function subsetByRole(
  ids: ReadonlyArray<string>,
): Hero[] {
  return heroes.filter((h) => ids.includes(h.id));
}

export function rosterSmall(): Hero[] {
  return subsetByRole(['t1', 't2', 'd1', 'd2', 'd3', 's1', 's2']);
}

export function buildScoringData(opts: {
  heroes?: Hero[];
  matchups?: Record<string, number>;
  synergy?: Record<string, number>;
  antiSynergy?: Record<string, number>;
  maps?: MapDef[];
  synergyByArchetype?: Partial<Record<Archetype, Record<string, number>>>;
  archetypeMatchScore?: ScoringData['archetypeMatchScore'];
} = {}): ScoringData {
  const list = opts.heroes ?? heroes;
  const byId = new Map(list.map((h) => [h.id, h]));
  const mapsList = opts.maps ?? [];
  return {
    heroesById: byId,
    matchups: opts.matchups ?? {},
    synergy: opts.synergy ?? {},
    antiSynergy: opts.antiSynergy ?? {},
    mapsById: new Map(mapsList.map((m) => [m.id, m])),
    synergyByArchetype: opts.synergyByArchetype,
    archetypeMatchScore: opts.archetypeMatchScore,
  };
}

export const flatWeights = {
  pair: 1,
  synergy: 1,
  antiSyn: 1,
  archetype: 1,
};

export function compFromIds(
  tank: string,
  dps: [string, string],
  support: [string, string],
) {
  return { tank, dps, support };
}

export type { Role };
