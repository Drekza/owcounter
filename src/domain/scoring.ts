import {
  ARCHETYPE_DOMINANT_THRESHOLD,
  MAP_ARCHETYPE_BIAS,
  SUPPORT_HEAL_PENALTY,
} from '../config/constants';
import { compArchetypeProfile } from './archetypes';
import type {
  Archetype,
  Comp,
  Hero,
  MapDef,
  MatchupCtx,
  ScoreResult,
  Side,
  Term,
  Weights,
} from './types';

const ARCHETYPE_LABEL: Record<Archetype, string> = {
  dive: 'dive',
  brawl: 'brawl',
  poke: 'poke',
};

type SupportHealClass = 'main' | 'hybrid' | 'off';

function classifySupport(h: Hero | undefined): SupportHealClass | null {
  if (!h || h.role !== 'support') return null;
  const tags = h.tags ?? [];
  if (tags.includes('main-healer')) return 'main';
  if (tags.includes('hybrid-healer')) return 'hybrid';
  if (tags.includes('off-support')) return 'off';
  return null;
}

function supportHealingTerm(
  my: Comp,
  weights: Weights,
  data: ScoringData,
): Term | null {
  const s1 = data.heroesById.get(my.support[0]);
  const s2 = data.heroesById.get(my.support[1]);
  const c1 = classifySupport(s1);
  const c2 = classifySupport(s2);
  if (!c1 || !c2) return null;
  if (c1 === 'main' || c2 === 'main') return null;

  const hybrids = (c1 === 'hybrid' ? 1 : 0) + (c2 === 'hybrid' ? 1 : 0);
  let raw: number;
  let descriptor: string;
  if (hybrids === 0) {
    raw = SUPPORT_HEAL_PENALTY.twoOff;
    descriptor = 'no main healer (off+off)';
  } else if (hybrids === 1) {
    raw = SUPPORT_HEAL_PENALTY.hybridAndOff;
    descriptor = 'weak healing core (hybrid+off)';
  } else {
    raw = SUPPORT_HEAL_PENALTY.twoHybrid;
    descriptor = 'hybrid healers only';
  }

  const n1 = s1?.name ?? my.support[0];
  const n2 = s2?.name ?? my.support[1];
  return {
    kind: 'antiSyn',
    label: `${n1} + ${n2}: ${descriptor}: -${raw}`,
    value: -raw * weights.antiSyn,
  };
}

export interface ScoringData {
  heroesById: Map<string, Hero>;
  matchups: Record<string, number>;
  synergy: Record<string, number>;
  antiSynergy: Record<string, number>;
  mapsById: Map<string, MapDef>;
  synergyByArchetype?: Partial<Record<Archetype, Record<string, number>>>;
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
  side: Side | undefined,
  data: ScoringData,
): number {
  const key = `${my}:${enemy}`;
  if (mapId) {
    const overrides = data.mapsById.get(mapId)?.overrides;
    if (overrides) {
      if (side) {
        const sideOv = overrides.bySide?.[side]?.matchups?.[key];
        if (sideOv !== undefined) return sideOv;
      }
      const ov = overrides.matchups?.[key];
      if (ov !== undefined) return ov;
    }
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
  side: Side | undefined,
  data: ScoringData,
): number {
  if (mapId) {
    const overrides = data.mapsById.get(mapId)?.overrides;
    if (overrides) {
      if (side) {
        const sideTable = overrides.bySide?.[side]?.antiSynergy;
        if (sideTable) {
          const sideOv = lookupUnordered(sideTable, a, b);
          if (sideOv !== undefined) return sideOv;
        }
      }
      if (overrides.antiSynergy) {
        const ov = lookupUnordered(overrides.antiSynergy, a, b);
        if (ov !== undefined) return ov;
      }
    }
  }
  return lookupUnordered(data.antiSynergy, a, b) ?? 0;
}

function resolveArchetypePref(
  mapId: string | undefined,
  side: Side | undefined,
  data: ScoringData,
): Partial<Record<Archetype, number>> | undefined {
  if (!mapId) return undefined;
  const overrides = data.mapsById.get(mapId)?.overrides;
  if (!overrides) return undefined;
  if (side) {
    const sidePref = overrides.bySide?.[side]?.archetypePref;
    if (sidePref) return sidePref;
  }
  return overrides.archetypePref;
}

function mapArchetypeTerm(
  my: Comp,
  mapId: string | undefined,
  side: Side | undefined,
  weights: Weights,
  data: ScoringData,
): Term | null {
  const pref = resolveArchetypePref(mapId, side, data);
  if (!pref) return null;
  const profile = compArchetypeProfile(my, data.heroesById);
  let raw = 0;
  const parts: string[] = [];
  for (const a of ['dive', 'brawl', 'poke'] as const) {
    const w = pref[a];
    if (w === undefined || w === 0) continue;
    raw += w * profile[a];
    if (w > 0) parts.push(`+${a}`);
    else parts.push(`-${a}`);
  }
  const value = raw * MAP_ARCHETYPE_BIAS * weights.mapArchetype;
  if (value === 0) return null;
  const arrow = value > 0 ? '+' : '';
  const label =
    value > 0
      ? `Map favors comp (${parts.join('/')}): ${arrow}${value.toFixed(2)}`
      : `Map disfavors comp (${parts.join('/')}): ${value.toFixed(2)}`;
  return { kind: 'archetype', label, value };
}

export function scoreComp(
  my: Comp,
  enemy: Comp | null,
  ctx: MatchupCtx,
  weights: Weights,
  data: ScoringData,
): ScoreResult {
  const terms: Term[] = [];
  const myHeroes = compHeroes(my);
  const mapId = ctx.mapId;
  const side = ctx.side;

  if (enemy) {
    const enemyHeroes = compHeroes(enemy);
    for (const myId of myHeroes) {
      for (const enId of enemyHeroes) {
        const raw = lookupPair(myId, enId, mapId, side, data);
        if (raw === 0) continue;
        terms.push({
          kind: 'pair',
          label: `${nameOf(myId, data)} vs ${nameOf(enId, data)}: ${raw}`,
          value: raw * weights.pair,
        });
      }
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
      const raw = lookupAntiSyn(a, b, mapId, side, data);
      if (raw === 0) continue;
      terms.push({
        kind: 'antiSyn',
        label: `${nameOf(a, data)} + ${nameOf(b, data)}: -${raw}`,
        value: -raw * weights.antiSyn,
      });
    }
  }

  if (data.synergyByArchetype) {
    const profile = compArchetypeProfile(my, data.heroesById);
    for (const arch of ['dive', 'brawl', 'poke'] as const) {
      if (profile[arch] < ARCHETYPE_DOMINANT_THRESHOLD) continue;
      const bucket = data.synergyByArchetype[arch];
      if (!bucket) continue;
      for (let i = 0; i < myHeroes.length; i++) {
        for (let j = i + 1; j < myHeroes.length; j++) {
          const a = myHeroes[i];
          const b = myHeroes[j];
          const raw = lookupUnordered(bucket, a, b);
          if (raw === undefined || raw === 0) continue;
          terms.push({
            kind: 'synergy',
            label: `${nameOf(a, data)} + ${nameOf(b, data)} (${ARCHETYPE_LABEL[arch]}): +${raw}`,
            value: raw * weights.synergy,
          });
        }
      }
    }
  }

  const healTerm = supportHealingTerm(my, weights, data);
  if (healTerm) terms.push(healTerm);

  if (enemy && data.archetypeMatchScore) {
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

  const mapTerm = mapArchetypeTerm(my, mapId, side, weights, data);
  if (mapTerm) terms.push(mapTerm);

  let total = 0;
  for (const t of terms) total += t.value;

  return { total, terms };
}
