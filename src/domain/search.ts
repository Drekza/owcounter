import { WEAK_THRESHOLD } from '../config/constants';
import { scoreComp, type ScoringData } from './scoring';
import type { Comp, Hero, MatchupCtx, Role, Suggestion, Term, Weights } from './types';

interface RoleBuckets {
  tanks: readonly Hero[];
  dps: readonly Hero[];
  supports: readonly Hero[];
}

export interface LockedSlots {
  tank?: string | null;
  dps?: [string | null, string | null];
  support?: [string | null, string | null];
}

function bucketByRole(
  bans: ReadonlySet<string>,
  heroes: ReadonlyArray<Hero>,
): RoleBuckets {
  const tanks: Hero[] = [];
  const dps: Hero[] = [];
  const supports: Hero[] = [];
  for (const h of heroes) {
    if (bans.has(h.id)) continue;
    if (h.role === 'tank') tanks.push(h);
    else if (h.role === 'dps') dps.push(h);
    else supports.push(h);
  }
  const byId = (a: Hero, b: Hero) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  tanks.sort(byId);
  dps.sort(byId);
  supports.sort(byId);
  return { tanks, dps, supports };
}

function lookupHero(
  id: string | null | undefined,
  role: Role,
  heroes: ReadonlyArray<Hero>,
): Hero | null {
  if (!id) return null;
  const h = heroes.find((x) => x.id === id);
  return h && h.role === role ? h : null;
}

function* enumeratePair(
  pool: readonly Hero[],
  lockedA: Hero | null,
  lockedB: Hero | null,
): Generator<[Hero, Hero]> {
  if (lockedA && lockedB) {
    if (lockedA.id !== lockedB.id) yield [lockedA, lockedB];
    return;
  }
  if (lockedA) {
    for (const x of pool) {
      if (x.id === lockedA.id) continue;
      yield [lockedA, x];
    }
    return;
  }
  if (lockedB) {
    for (const x of pool) {
      if (x.id === lockedB.id) continue;
      yield [x, lockedB];
    }
    return;
  }
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      yield [pool[i], pool[j]];
    }
  }
}

export function* enumerateLegalComps(
  bans: ReadonlySet<string>,
  heroes: ReadonlyArray<Hero>,
  locked?: LockedSlots,
): Generator<Comp> {
  const { tanks, dps, supports } = bucketByRole(bans, heroes);

  const lockedTank = lookupHero(locked?.tank, 'tank', heroes);
  const lockedDps0 = lookupHero(locked?.dps?.[0], 'dps', heroes);
  const lockedDps1 = lookupHero(locked?.dps?.[1], 'dps', heroes);
  const lockedSup0 = lookupHero(locked?.support?.[0], 'support', heroes);
  const lockedSup1 = lookupHero(locked?.support?.[1], 'support', heroes);

  const tankCandidates: readonly Hero[] = lockedTank ? [lockedTank] : tanks;

  for (const t of tankCandidates) {
    for (const [d1, d2] of enumeratePair(dps, lockedDps0, lockedDps1)) {
      for (const [s1, s2] of enumeratePair(supports, lockedSup0, lockedSup1)) {
        yield {
          tank: t.id,
          dps: [d1.id, d2.id],
          support: [s1.id, s2.id],
        };
      }
    }
  }
}

function archetypeTerm(terms: readonly Term[]): number {
  for (const t of terms) if (t.kind === 'archetype') return t.value;
  return 0;
}

export function topKCounters(
  enemy: Comp | null,
  ctx: MatchupCtx,
  k: number,
  weights: Weights,
  data: ScoringData,
  locked?: LockedSlots,
): Suggestion[] {
  if (k <= 0) return [];
  const bans = new Set(ctx.bans);
  const heroes = Array.from(data.heroesById.values());

  const all: Suggestion[] = [];
  for (const comp of enumerateLegalComps(bans, heroes, locked)) {
    const { total, terms } = scoreComp(comp, enemy, ctx, weights, data);
    all.push({
      comp,
      score: total,
      breakdown: terms,
      weak: total < WEAK_THRESHOLD,
    });
  }

  all.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aArch = archetypeTerm(a.breakdown);
    const bArch = archetypeTerm(b.breakdown);
    if (bArch !== aArch) return bArch - aArch;
    return a.comp.tank < b.comp.tank ? -1 : a.comp.tank > b.comp.tank ? 1 : 0;
  });

  return all.slice(0, k);
}
