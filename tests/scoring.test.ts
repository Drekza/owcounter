import { describe, expect, it } from 'vitest';
import { scoreComp } from '../src/domain/scoring';
import type { Comp, MapDef, Weights } from '../src/domain/types';
import { buildScoringData, compFromIds, flatWeights } from './fixtures/heroes.fixture';

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
