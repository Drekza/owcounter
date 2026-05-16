import { describe, expect, it } from 'vitest';
import { scoreComp } from '../src/domain/scoring';
import type { Comp, Hero, MapDef, Weights } from '../src/domain/types';
import { buildScoringData, compFromIds, flatWeights } from './fixtures/heroes.fixture';
import { SUPPORT_HEAL_PENALTY } from '../src/config/constants';

const myComp: Comp = compFromIds('t1', ['d1', 'd2'], ['s1', 's2']);
const enemyComp: Comp = compFromIds('t2', ['d2', 'd3'], ['s2', 's3']);

describe('scoreComp', () => {
  it('sums a single pairwise matchup', () => {
    const data = buildScoringData({ matchups: { 't1:t2': 2 } });
    const res = scoreComp(myComp, enemyComp, { bans: [] }, flatWeights, data);
    expect(res.total).toBe(2);
    expect(res.terms).toHaveLength(1);
    expect(res.terms[0]).toMatchObject({
      kind: 'pair',
      label: 'T1 vs T2: 2',
      value: 2,
    });
  });

  it('applies pair weight multiplicatively', () => {
    const data = buildScoringData({ matchups: { 't1:t2': 2 } });
    const weights: Weights = { ...flatWeights, pair: 0.5 };
    const res = scoreComp(myComp, enemyComp, { bans: [] }, weights, data);
    expect(res.total).toBe(1);
    expect(res.terms[0].value).toBe(1);
  });

  it('adds synergy term for an own-team pair (canonical key)', () => {
    const data = buildScoringData({ synergy: { 'd1:s1': 1 } });
    const res = scoreComp(myComp, enemyComp, { bans: [] }, flatWeights, data);
    expect(res.terms).toHaveLength(1);
    expect(res.terms[0]).toMatchObject({
      kind: 'synergy',
      label: 'D1 + S1: +1',
      value: 1,
    });
  });

  it('adds anti-synergy term with negative value (stored positive)', () => {
    const data = buildScoringData({ antiSynergy: { 'd1:s1': 1 } });
    const res = scoreComp(myComp, enemyComp, { bans: [] }, flatWeights, data);
    expect(res.terms).toHaveLength(1);
    expect(res.terms[0]).toMatchObject({
      kind: 'antiSyn',
      label: 'D1 + S1: -1',
      value: -1,
    });
    expect(res.total).toBe(-1);
  });

  it('applies map override for pairwise (replace, not add)', () => {
    const map: MapDef = {
      id: 'M',
      name: 'Map',
      mode: 'control',
      overrides: { matchups: { 't1:t2': -1 } },
    };
    const data = buildScoringData({
      matchups: { 't1:t2': 2 },
      maps: [map],
    });
    const res = scoreComp(
      myComp,
      enemyComp,
      { bans: [], mapId: 'M' },
      flatWeights,
      data,
    );
    expect(res.total).toBe(-1);
    expect(res.terms[0].value).toBe(-1);
  });

  it('applies map override for anti-synergy', () => {
    const map: MapDef = {
      id: 'M',
      name: 'Map',
      mode: 'control',
      overrides: { antiSynergy: { 'd1:s1': 2 } },
    };
    const data = buildScoringData({
      antiSynergy: { 'd1:s1': 1 },
      maps: [map],
    });
    const res = scoreComp(
      myComp,
      enemyComp,
      { bans: [], mapId: 'M' },
      flatWeights,
      data,
    );
    expect(res.terms[0].value).toBe(-2);
  });

  it('includes archetype term with sign and label from injected fn', () => {
    const data = buildScoringData({
      archetypeMatchScore: () => ({ value: 0.42, label: 'arch+' }),
    });
    const res = scoreComp(myComp, enemyComp, { bans: [] }, flatWeights, data);
    expect(res.terms).toHaveLength(1);
    expect(res.terms[0]).toMatchObject({
      kind: 'archetype',
      label: 'arch+',
      value: 0.42,
    });
  });

  it('omits archetype term when value is exactly 0', () => {
    const data = buildScoringData({
      archetypeMatchScore: () => 0,
    });
    const res = scoreComp(myComp, enemyComp, { bans: [] }, flatWeights, data);
    expect(res.terms).toHaveLength(0);
  });

  it('total equals sum of individual term values', () => {
    const data = buildScoringData({
      matchups: { 't1:t2': 2, 'd1:d3': -1 },
      synergy: { 'd1:s1': 1 },
      antiSynergy: { 's1:s2': 1 },
      archetypeMatchScore: () => ({ value: 0.3, label: 'a' }),
    });
    const res = scoreComp(myComp, enemyComp, { bans: [] }, flatWeights, data);
    const sum = res.terms.reduce((acc, t) => acc + t.value, 0);
    expect(res.total).toBeCloseTo(sum, 10);
  });

  it('empty tables → no terms, total 0', () => {
    const data = buildScoringData({});
    const res = scoreComp(myComp, enemyComp, { bans: [] }, flatWeights, data);
    expect(res.terms).toHaveLength(0);
    expect(res.total).toBe(0);
  });

  it('mirror comps: pairwise lookups symmetric, anti-syn may apply both sides', () => {
    const data = buildScoringData({
      antiSynergy: { 'd1:s1': 1 },
    });
    const mirror: Comp = compFromIds('t1', ['d1', 'd2'], ['s1', 's2']);
    const res = scoreComp(mirror, mirror, { bans: [] }, flatWeights, data);
    expect(res.terms.find((t) => t.kind === 'antiSyn')?.value).toBe(-1);
  });
});

describe('scoreComp — support healing rule', () => {
  function tagged(id: string, healClass: 'main' | 'hybrid' | 'off'): Hero {
    const tag =
      healClass === 'main'
        ? 'main-healer'
        : healClass === 'hybrid'
          ? 'hybrid-healer'
          : 'off-support';
    return {
      id,
      name: id.toUpperCase(),
      role: 'support',
      archetype: { dive: 0.33, brawl: 0.34, poke: 0.33 },
      tags: [tag],
    };
  }

  const tank: Hero = {
    id: 't1',
    name: 'T1',
    role: 'tank',
    archetype: { dive: 1, brawl: 0, poke: 0 },
  };
  const d1: Hero = { ...tank, id: 'd1', name: 'D1', role: 'dps' };
  const d2: Hero = { ...tank, id: 'd2', name: 'D2', role: 'dps' };

  function dataWith(s1: Hero, s2: Hero) {
    return buildScoringData({ heroes: [tank, d1, d2, s1, s2] });
  }

  function comp(s1: string, s2: string): Comp {
    return compFromIds('t1', ['d1', 'd2'], [s1, s2]);
  }

  it('no penalty when at least one support is main-healer', () => {
    const data = dataWith(tagged('mainA', 'main'), tagged('offB', 'off'));
    const res = scoreComp(comp('mainA', 'offB'), null, { bans: [] }, flatWeights, data);
    expect(res.terms.find((t) => t.kind === 'antiSyn')).toBeUndefined();
    expect(res.total).toBe(0);
  });

  it('penalises two off-supports the most', () => {
    const data = dataWith(tagged('offA', 'off'), tagged('offB', 'off'));
    const res = scoreComp(comp('offA', 'offB'), null, { bans: [] }, flatWeights, data);
    const t = res.terms.find((x) => x.kind === 'antiSyn');
    expect(t).toBeDefined();
    expect(t!.value).toBe(-SUPPORT_HEAL_PENALTY.twoOff);
    expect(t!.label).toContain('no main healer');
  });

  it('mid penalty for hybrid+off', () => {
    const data = dataWith(tagged('hyb', 'hybrid'), tagged('off', 'off'));
    const res = scoreComp(comp('hyb', 'off'), null, { bans: [] }, flatWeights, data);
    const t = res.terms.find((x) => x.kind === 'antiSyn');
    expect(t!.value).toBe(-SUPPORT_HEAL_PENALTY.hybridAndOff);
    expect(t!.label).toContain('weak healing core');
  });

  it('mild penalty for two hybrid-healers', () => {
    const data = dataWith(tagged('hybA', 'hybrid'), tagged('hybB', 'hybrid'));
    const res = scoreComp(comp('hybA', 'hybB'), null, { bans: [] }, flatWeights, data);
    const t = res.terms.find((x) => x.kind === 'antiSyn');
    expect(t!.value).toBe(-SUPPORT_HEAL_PENALTY.twoHybrid);
    expect(t!.label).toContain('hybrid healers only');
  });

  it('skips rule when supports lack a healing-class tag', () => {
    const untagged: Hero = {
      id: 'sx',
      name: 'SX',
      role: 'support',
      archetype: { dive: 1, brawl: 0, poke: 0 },
    };
    const data = buildScoringData({ heroes: [tank, d1, d2, untagged] });
    const res = scoreComp(comp('sx', 'sx'), null, { bans: [] }, flatWeights, data);
    expect(res.terms.find((t) => t.kind === 'antiSyn')).toBeUndefined();
  });

  it('penalty respects antiSyn weight', () => {
    const data = dataWith(tagged('offA', 'off'), tagged('offB', 'off'));
    const weights: Weights = { ...flatWeights, antiSyn: 0.5 };
    const res = scoreComp(comp('offA', 'offB'), null, { bans: [] }, weights, data);
    const t = res.terms.find((x) => x.kind === 'antiSyn');
    expect(t!.value).toBe(-SUPPORT_HEAL_PENALTY.twoOff * 0.5);
  });
});

describe('scoreComp — synergyByArchetype', () => {
  const ARCH = {
    dive: { dive: 1, brawl: 0, poke: 0 },
    brawl: { dive: 0, brawl: 1, poke: 0 },
    poke: { dive: 0, brawl: 0, poke: 1 },
  } as const;

  function hero(id: string, role: 'tank' | 'dps' | 'support', archKey: 'dive' | 'brawl' | 'poke'): Hero {
    return { id, name: id.toUpperCase(), role, archetype: ARCH[archKey] };
  }

  const divePack: Hero[] = [
    hero('dt', 'tank', 'dive'),
    hero('dd1', 'dps', 'dive'),
    hero('dd2', 'dps', 'dive'),
    hero('ds1', 'support', 'dive'),
    hero('ds2', 'support', 'dive'),
  ];
  const brawlPack: Hero[] = [
    hero('bt', 'tank', 'brawl'),
    hero('bd1', 'dps', 'brawl'),
    hero('bd2', 'dps', 'brawl'),
    hero('bs1', 'support', 'brawl'),
    hero('bs2', 'support', 'brawl'),
  ];

  function diveComp(): Comp {
    return compFromIds('dt', ['dd1', 'dd2'], ['ds1', 'ds2']);
  }
  function brawlComp(): Comp {
    return compFromIds('bt', ['bd1', 'bd2'], ['bs1', 'bs2']);
  }

  it('emits dive-bucket synergy when comp is dive-dominant', () => {
    const data = buildScoringData({
      heroes: [...divePack, ...brawlPack],
      synergyByArchetype: { dive: { 'dd1:ds1': 1 } },
    });
    const res = scoreComp(diveComp(), null, { bans: [] }, flatWeights, data);
    const t = res.terms.find((x) => x.label.includes('(dive)'));
    expect(t).toBeDefined();
    expect(t!.value).toBe(1);
    expect(t!.kind).toBe('synergy');
  });

  it('skips bucket when comp is below threshold for that archetype', () => {
    const data = buildScoringData({
      heroes: [...divePack, ...brawlPack],
      synergyByArchetype: { dive: { 'bd1:bs1': 1 } },
    });
    const res = scoreComp(brawlComp(), null, { bans: [] }, flatWeights, data);
    expect(res.terms.find((x) => x.label.includes('(dive)'))).toBeUndefined();
  });

  it('stacks with base synergy as separate terms', () => {
    const data = buildScoringData({
      heroes: [...divePack],
      synergy: { 'dd1:ds1': 1 },
      synergyByArchetype: { dive: { 'dd1:ds1': 1 } },
    });
    const res = scoreComp(diveComp(), null, { bans: [] }, flatWeights, data);
    const syns = res.terms.filter((x) => x.kind === 'synergy');
    expect(syns).toHaveLength(2);
    expect(res.total).toBe(2);
  });

  it('multiple matching archetypes (mixed comp) apply both buckets', () => {
    const mixedHero = hero('mh', 'tank', 'dive');
    mixedHero.archetype = { dive: 0.5, brawl: 0.5, poke: 0 };
    const others = [
      { ...hero('a1', 'dps', 'dive'), archetype: { dive: 0.5, brawl: 0.5, poke: 0 } },
      { ...hero('a2', 'dps', 'dive'), archetype: { dive: 0.5, brawl: 0.5, poke: 0 } },
      { ...hero('a3', 'support', 'dive'), archetype: { dive: 0.5, brawl: 0.5, poke: 0 } },
      { ...hero('a4', 'support', 'dive'), archetype: { dive: 0.5, brawl: 0.5, poke: 0 } },
    ];
    const data = buildScoringData({
      heroes: [mixedHero, ...others],
      synergyByArchetype: {
        dive: { 'a1:a3': 1 },
        brawl: { 'a1:a3': 1 },
      },
    });
    const comp = compFromIds('mh', ['a1', 'a2'], ['a3', 'a4']);
    const res = scoreComp(comp, null, { bans: [] }, flatWeights, data);
    expect(res.terms.filter((x) => x.kind === 'synergy')).toHaveLength(2);
    expect(res.total).toBe(2);
  });

  it('does nothing when synergyByArchetype is absent', () => {
    const data = buildScoringData({ heroes: [...divePack] });
    const res = scoreComp(diveComp(), null, { bans: [] }, flatWeights, data);
    expect(res.terms.filter((x) => x.kind === 'synergy')).toHaveLength(0);
  });
});
