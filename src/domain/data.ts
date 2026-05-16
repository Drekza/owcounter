import type { Hero, MapDef } from './types';
import type { ScoringData } from './scoring';
import { archetypeMatchScore } from './archetypes';

import heroesJson from '../data/heroes.json';
import matchupsJson from '../data/matchups.json';
import synergyJson from '../data/synergy.json';
import antiSynergyJson from '../data/antiSynergy.json';
import mapsJson from '../data/maps.json';

export interface BuildOpts {
  archetypeMatchScore?: ScoringData['archetypeMatchScore'] | null;
}

const defaultArchetypeScorer: ScoringData['archetypeMatchScore'] = (
  my,
  enemy,
  data,
) => archetypeMatchScore(my, enemy, data.heroesById);

export function buildScoringData(opts: BuildOpts = {}): ScoringData {
  const heroesById = new Map<string, Hero>(
    (heroesJson.heroes as Hero[]).map((h) => [h.id, h]),
  );
  const mapsById = new Map<string, MapDef>(
    (mapsJson.maps as MapDef[]).map((m) => [m.id, m]),
  );
  const archetype =
    opts.archetypeMatchScore === undefined
      ? defaultArchetypeScorer
      : opts.archetypeMatchScore ?? undefined;
  return {
    heroesById,
    matchups: matchupsJson.pairs as Record<string, number>,
    synergy: synergyJson.pairs as Record<string, number>,
    antiSynergy: antiSynergyJson.pairs as Record<string, number>,
    mapsById,
    archetypeMatchScore: archetype,
  };
}
