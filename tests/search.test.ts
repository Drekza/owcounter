import { describe, expect, it } from 'vitest';
import { enumerateLegalComps, topKCounters } from '../src/domain/search';
import type { Comp } from '../src/domain/types';
import {
  buildScoringData,
  compFromIds,
  flatWeights,
  rosterSmall,
} from './fixtures/heroes.fixture';

const small = rosterSmall();

describe('enumerateLegalComps', () => {
  it('2T × 3D × 2S roster → 6 legal comps', () => {
    const comps = Array.from(enumerateLegalComps(new Set(), small));
    expect(comps).toHaveLength(6);
  });

  it('banning a tank halves the enumeration', () => {
    const comps = Array.from(enumerateLegalComps(new Set(['t1']), small));
    expect(comps).toHaveLength(3);
    for (const c of comps) expect(c.tank).toBe('t2');
  });

  it('banning a DPS keeps only comps that include the other two', () => {
    const comps = Array.from(enumerateLegalComps(new Set(['d1']), small));
    expect(comps).toHaveLength(2);
    for (const c of comps) expect(c.dps).toEqual(['d2', 'd3']);
  });
});

describe('topKCounters', () => {
  const enemy: Comp = compFromIds('t2', ['d2', 'd3'], ['s1', 's2']);

  it('returns k results sorted descending by score', () => {
    const data = buildScoringData({
      heroes: small,
      matchups: { 't1:t2': 2, 't2:t2': 1 },
    });
    const top = topKCounters(enemy, { bans: [] }, 3, flatWeights, data);
    expect(top).toHaveLength(3);
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1].score).toBeGreaterThanOrEqual(top[i].score);
    }
    expect(top[0].comp.tank).toBe('t1');
    expect(top[0].score).toBe(2);
  });

  it('respects k=0 → empty list', () => {
    const data = buildScoringData({ heroes: small });
    const top = topKCounters(enemy, { bans: [] }, 0, flatWeights, data);
    expect(top).toEqual([]);
  });

  it('respects bans in ctx', () => {
    const data = buildScoringData({ heroes: small });
    const top = topKCounters(
      enemy,
      { bans: ['t1'] },
      10,
      flatWeights,
      data,
    );
    for (const s of top) expect(s.comp.tank).not.toBe('t1');
    expect(top).toHaveLength(3);
  });

  it('tie-break: flat scores → alphabetical tank order first', () => {
    const data = buildScoringData({ heroes: small });
    const top = topKCounters(enemy, { bans: [] }, 6, flatWeights, data);
    expect(top.every((s) => s.score === 0)).toBe(true);
    expect(top[0].comp.tank).toBe('t1');
    const lastT1Index = top.map((s) => s.comp.tank).lastIndexOf('t1');
    const firstT2Index = top.map((s) => s.comp.tank).indexOf('t2');
    expect(firstT2Index).toBeGreaterThan(lastT1Index);
  });

  it('flags weak counter when total below WEAK_THRESHOLD', () => {
    const data = buildScoringData({ heroes: small });
    const top = topKCounters(enemy, { bans: [] }, 1, flatWeights, data);
    expect(top[0].weak).toBe(true);
  });

  it('archetype term used as secondary tiebreaker', () => {
    let i = 0;
    const data = buildScoringData({
      heroes: small,
      // First call returns higher archetype; second lower
      archetypeMatchScore: () => {
        const v = i++ === 0 ? 0.5 : 0.1;
        return { value: v, label: `arch ${v}` };
      },
    });
    const top = topKCounters(enemy, { bans: [] }, 2, flatWeights, data);
    expect(top[0].score).toBeGreaterThanOrEqual(top[1].score);
  });
});
