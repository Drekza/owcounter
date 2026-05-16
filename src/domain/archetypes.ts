import type { Archetype, ArchVec, Comp, Hero } from './types';

const ARCHETYPES: readonly Archetype[] = ['dive', 'brawl', 'poke'];

const COUNTERS: Record<Archetype, Archetype> = {
  dive: 'poke',
  brawl: 'dive',
  poke: 'brawl',
};

function compHeroIds(c: Comp): readonly string[] {
  return [c.tank, c.dps[0], c.dps[1], c.support[0], c.support[1]];
}

export function compArchetypeProfile(
  comp: Comp,
  heroes: Map<string, Hero>,
): ArchVec {
  const profile: ArchVec = { dive: 0, brawl: 0, poke: 0 };
  const ids = compHeroIds(comp);
  for (const id of ids) {
    const h = heroes.get(id);
    if (!h) continue;
    for (const a of ARCHETYPES) {
      profile[a] += h.archetype[a];
    }
  }
  for (const a of ARCHETYPES) {
    profile[a] /= ids.length;
  }
  return profile;
}

export function archetypeMatchScore(
  my: Comp,
  enemy: Comp,
  heroes: Map<string, Hero>,
): { value: number; label: string } {
  const myProfile = compArchetypeProfile(my, heroes);
  const enemyProfile = compArchetypeProfile(enemy, heroes);

  let value = 0;
  for (const a of ARCHETYPES) {
    value += myProfile[a] * enemyProfile[COUNTERS[a]];
    value -= myProfile[COUNTERS[a]] * enemyProfile[a];
  }

  let label: string;
  if (value > 0.3) {
    label = `Comp archetype: counters enemy profile (+${value.toFixed(2)})`;
  } else if (value < -0.3) {
    label = `Comp archetype: countered by enemy profile (${value.toFixed(2)})`;
  } else {
    label = 'Comp archetype: neutral';
  }

  return { value, label };
}

export function keyThreats(
  enemy: Comp,
  heroes: Map<string, Hero>,
  matchups: Record<string, number>,
): string[] {
  const enemyIds = compHeroIds(enemy);
  const heroIds = Array.from(heroes.keys());

  const scored = enemyIds.map((enemyId) => {
    let max = 0;
    for (const myId of heroIds) {
      const v = matchups[`${myId}:${enemyId}`] ?? 0;
      if (v > max) max = v;
    }
    const role = heroes.get(enemyId)?.role ?? 'support';
    return { id: enemyId, threat: -max, role };
  });

  scored.sort((a, b) => {
    if (b.threat !== a.threat) return b.threat - a.threat;
    const aDps = a.role === 'dps' ? 0 : 1;
    const bDps = b.role === 'dps' ? 0 : 1;
    if (aDps !== bDps) return aDps - bDps;
    return a.id.localeCompare(b.id);
  });

  return scored.slice(0, 2).map((s) => s.id);
}
