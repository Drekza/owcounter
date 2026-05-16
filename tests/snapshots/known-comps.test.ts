import { describe, expect, it } from 'vitest';
import { topKCounters } from '../../src/domain/search';
import { scoringData } from '../../src/data';
import { DEFAULT_WEIGHTS } from '../../src/config/weights';
import { TOP_K } from '../../src/config/constants';
import type { Comp, MatchupCtx, Suggestion } from '../../src/domain/types';

function compIds(s: Suggestion): string[] {
  return [s.comp.tank, ...s.comp.dps, ...s.comp.support];
}

function topIds(enemy: Comp, ctx: MatchupCtx = { bans: [] }) {
  return topKCounters(enemy, ctx, TOP_K, DEFAULT_WEIGHTS, scoringData).map(compIds);
}

describe('known enemy comps — top-5 counter snapshots', () => {
  it('pure dive enemy', () => {
    const enemy: Comp = {
      tank: 'winston',
      dps: ['tracer', 'genji'],
      support: ['lucio', 'kiriko'],
    };
    expect(topIds(enemy)).toMatchSnapshot();
  });

  it('pure poke enemy', () => {
    const enemy: Comp = {
      tank: 'sigma',
      dps: ['widowmaker', 'ashe'],
      support: ['ana', 'baptiste'],
    };
    expect(topIds(enemy)).toMatchSnapshot();
  });

  it('pure brawl enemy', () => {
    const enemy: Comp = {
      tank: 'reinhardt',
      dps: ['reaper', 'mei'],
      support: ['brigitte', 'lucio'],
    };
    expect(topIds(enemy)).toMatchSnapshot();
  });

  it('mixed dive+poke enemy', () => {
    const enemy: Comp = {
      tank: 'winston',
      dps: ['tracer', 'widowmaker'],
      support: ['ana', 'kiriko'],
    };
    expect(topIds(enemy)).toMatchSnapshot();
  });

  it('Circuit Royal + double-sniper enemy', () => {
    const enemy: Comp = {
      tank: 'sigma',
      dps: ['widowmaker', 'hanzo'],
      support: ['ana', 'mercy'],
    };
    expect(topIds(enemy, { bans: [], mapId: 'circuit-royal' })).toMatchSnapshot();
  });

  it('dive enemy with bans (Zarya + Brigitte banned)', () => {
    const enemy: Comp = {
      tank: 'winston',
      dps: ['tracer', 'genji'],
      support: ['lucio', 'kiriko'],
    };
    const top = topIds(enemy, { bans: ['zarya', 'brigitte'] });
    for (const ids of top) {
      expect(ids).not.toContain('zarya');
      expect(ids).not.toContain('brigitte');
    }
    expect(top).toMatchSnapshot();
  });

  it('tank-busting enemy (Mauga + Reaper)', () => {
    const enemy: Comp = {
      tank: 'mauga',
      dps: ['reaper', 'sojourn'],
      support: ['ana', 'kiriko'],
    };
    expect(topIds(enemy)).toMatchSnapshot();
  });
});
