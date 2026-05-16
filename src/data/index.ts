import type { Hero, MapDef } from '../domain/types';
import { archetypeMatchScore } from '../domain/archetypes';
import type { ScoringData } from '../domain/scoring';
import heroesJson from './heroes.json';
import matchupsJson from './matchups.json';
import synergyJson from './synergy.json';
import antiSynergyJson from './antiSynergy.json';
import mapsJson from './maps.json';

export const heroes: Hero[] = (heroesJson.heroes as Hero[]) ?? [];
export const maps: MapDef[] = (mapsJson.maps as MapDef[]) ?? [];
export const matchups = matchupsJson.pairs as Record<string, number>;
export const synergy = synergyJson.pairs as Record<string, number>;
export const antiSynergy = antiSynergyJson.pairs as Record<string, number>;

export const heroesById: Map<string, Hero> = new Map(
  heroes.map((h) => [h.id, h]),
);
export const mapsById: Map<string, MapDef> = new Map(
  maps.map((m) => [m.id, m]),
);

export const patch: string = heroesJson.patch ?? '';
export const updated: string = heroesJson.updated ?? '';

export const scoringData: ScoringData = {
  heroesById,
  matchups,
  synergy,
  antiSynergy,
  mapsById,
  archetypeMatchScore: (my, enemy, data) =>
    archetypeMatchScore(my, enemy, data.heroesById),
};
