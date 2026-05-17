import { describe, expect, it } from 'vitest';
import { topKCounters } from '../src/domain/search';
import { scoringData } from '../src/data';
import { DEFAULT_WEIGHTS } from '../src/config/weights';
import type { MatchupCtx } from '../src/domain/types';

function topProfile(mapId: string) {
  const ctx: MatchupCtx = { bans: [], mapId };
  const sugs = topKCounters(null, ctx, 1, DEFAULT_WEIGHTS, scoringData);
  expect(sugs).toHaveLength(1);
  const ids = [
    sugs[0].comp.tank,
    ...sugs[0].comp.dps,
    ...sugs[0].comp.support,
  ];
  return { ids, score: sugs[0].score, terms: sugs[0].breakdown };
}

describe('map preference produces map-fitting top comp with no enemy', () => {
  it('Circuit Royal → top comp is poke-heavy (Sigma + Widow + Hanzo/Ashe)', () => {
    const { ids } = topProfile('circuit-royal');
    expect(ids).toContain('sigma');
    expect(ids).toContain('widowmaker');
    expect(ids.includes('hanzo') || ids.includes('ashe')).toBe(true);
  });

  it('Lijiang Tower → top comp is dive (Winston-led)', () => {
    const { ids } = topProfile('lijiang-tower');
    expect(['winston', 'dva', 'wrecking-ball']).toContain(ids[0]);
  });

  it("King's Row → top comp is brawl (Reinhardt-led)", () => {
    const { ids } = topProfile('kings-row');
    expect(['reinhardt', 'mauga', 'junker-queen', 'ramattra']).toContain(ids[0]);
  });

  it('Eichenwalde → top comp is brawl (Reinhardt-led)', () => {
    const { ids } = topProfile('eichenwalde');
    expect(['reinhardt', 'mauga', 'junker-queen', 'ramattra']).toContain(ids[0]);
  });

  it('Junkertown → top comp is poke (Sigma-led with snipers)', () => {
    const { ids } = topProfile('junkertown');
    expect(ids).toContain('widowmaker');
  });
});
