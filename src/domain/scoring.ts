import type {
  Comp,
  Hero,
  MapDef,
  MatchupCtx,
  ScoreResult,
  Term,
  Weights,
} from './types';

export interface ScoringData {
  heroesById: Map<string, Hero>;
  matchups: Record<string, number>;
  synergy: Record<string, number>;
  antiSynergy: Record<string, number>;
  mapsById: Map<string, MapDef>;
  archetypeMatchScore?: (
    my: Comp,
    enemy: Comp,
    data: ScoringData,
  ) => number | { value: number; label: string };
}

function compHeroes(c: Comp): readonly string[] {
  return [c.tank, c.dps[0], c.dps[1], c.support[0], c.support[1]];
}

function canonicalKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function nameOf(id: string, data: ScoringData): string {
  return data.heroesById.get(id)?.name ?? id;
}

function lookupPair(
  my: string,
  enemy: string,
  mapId: string | undefined,
  data: ScoringData,
): number {
  const key = `${my}:${enemy}`;
  if (mapId) {
    const ov = data.mapsById.get(mapId)?.overrides?.matchups?.[key];
    if (ov !== undefined) return ov;
  }
  return data.matchups[key] ?? 0;
}

function lookupUnordered(
  table: Record<string, number>,
  a: string,
  b: string,
): number | undefined {
  const k = canonicalKey(a, b);
  if (table[k] !== undefined) return table[k];
  const fwd = `${a}:${b}`;
  if (table[fwd] !== undefined) return table[fwd];
  const rev = `${b}:${a}`;
  if (table[rev] !== undefined) return table[rev];
  return undefined;
}

function lookupSynergy(a: string, b: string, data: ScoringData): number {
  return lookupUnordered(data.synergy, a, b) ?? 0;
}

function lookupAntiSyn(
  a: string,
  b: string,
  mapId: string | undefined,
  data: ScoringData,
): number {
  if (mapId) {
    const overrides = data.mapsById.get(mapId)?.overrides?.antiSynergy;
    if (overrides) {
      const ov = lookupUnordered(overrides, a, b);
      if (ov !== undefined) return ov;
    }
  }
  return lookupUnordered(data.antiSynergy, a, b) ?? 0;
}

export function scoreComp(
  my: Comp,
  enemy: Comp,
  ctx: MatchupCtx,
  weights: Weights,
  data: ScoringData,
): ScoreResult {
  const terms: Term[] = [];
  const myHeroes = compHeroes(my);
  const enemyHeroes = compHeroes(enemy);
  const mapId = ctx.mapId;

  for (const myId of myHeroes) {
    for (const enId of enemyHeroes) {
      const raw = lookupPair(myId, enId, mapId, data);
      if (raw === 0) continue;
      terms.push({
        kind: 'pair',
        label: `${nameOf(myId, data)} vs ${nameOf(enId, data)}: ${raw}`,
        value: raw * weights.pair,
      });
    }
  }

  for (let i = 0; i < myHeroes.length; i++) {
    for (let j = i + 1; j < myHeroes.length; j++) {
      const a = myHeroes[i];
      const b = myHeroes[j];
      const raw = lookupSynergy(a, b, data);
      if (raw === 0) continue;
      terms.push({
        kind: 'synergy',
        label: `${nameOf(a, data)} + ${nameOf(b, data)}: +${raw}`,
        value: raw * weights.synergy,
      });
    }
  }

  for (let i = 0; i < myHeroes.length; i++) {
    for (let j = i + 1; j < myHeroes.length; j++) {
      const a = myHeroes[i];
      const b = myHeroes[j];
      const raw = lookupAntiSyn(a, b, mapId, data);
      if (raw === 0) continue;
      terms.push({
        kind: 'antiSyn',
        label: `${nameOf(a, data)} + ${nameOf(b, data)}: -${raw}`,
        value: -raw * weights.antiSyn,
      });
    }
  }

  if (data.archetypeMatchScore) {
    const res = data.archetypeMatchScore(my, enemy, data);
    const raw = typeof res === 'number' ? res : res.value;
    if (raw !== 0) {
      const label =
        typeof res === 'number'
          ? `Archetype match: ${raw > 0 ? '+' : ''}${raw.toFixed(2)}`
          : res.label;
      terms.push({
        kind: 'archetype',
        label,
        value: raw * weights.archetype,
      });
    }
  }

  let total = 0;
  for (const t of terms) total += t.value;

  return { total, terms };
}
