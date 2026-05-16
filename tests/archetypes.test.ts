import { describe, expect, it } from 'vitest';
import type { ArchVec, Comp, Hero } from '../src/domain/types';
import {
  archetypeMatchScore,
  compArchetypeProfile,
  keyThreats,
} from '../src/domain/archetypes';
import { compFromIds } from './fixtures/heroes.fixture';

function makeHero(id: string, role: Hero['role'], arch: ArchVec): Hero {
  return { id, name: id.toUpperCase(), role, archetype: arch };
}

function buildMap(heroes: Hero[]): Map<string, Hero> {
  return new Map(heroes.map((h) => [h.id, h]));
}

const DIVE: ArchVec = { dive: 1, brawl: 0, poke: 0 };
const POKE: ArchVec = { dive: 0, brawl: 0, poke: 1 };
const BRAWL: ArchVec = { dive: 0, brawl: 1, poke: 0 };
const NEUTRAL: ArchVec = { dive: 1 / 3, brawl: 1 / 3, poke: 1 / 3 };

function pureCompHeroes(prefix: string, arch: ArchVec): Hero[] {
  return [
    makeHero(`${prefix}t`, 'tank', arch),
    makeHero(`${prefix}d1`, 'dps', arch),
    makeHero(`${prefix}d2`, 'dps', arch),
    makeHero(`${prefix}s1`, 'support', arch),
    makeHero(`${prefix}s2`, 'support', arch),
  ];
}

function compOf(heroes: Hero[]): Comp {
  return compFromIds(heroes[0].id, [heroes[1].id, heroes[2].id], [heroes[3].id, heroes[4].id]);
}

describe('compArchetypeProfile', () => {
  it('averages archetype vectors across 5 heroes', () => {
    const heroes = [
      makeHero('a', 'tank', DIVE),
      makeHero('b', 'dps', DIVE),
      makeHero('c', 'dps', POKE),
      makeHero('d', 'support', POKE),
      makeHero('e', 'support', BRAWL),
    ];
    const map = buildMap(heroes);
    const profile = compArchetypeProfile(compOf(heroes), map);
    expect(profile.dive).toBeCloseTo(0.4, 6);
    expect(profile.poke).toBeCloseTo(0.4, 6);
    expect(profile.brawl).toBeCloseTo(0.2, 6);
  });

  it('pure comp → profile equals that archetype', () => {
    const heroes = pureCompHeroes('a', DIVE);
    const map = buildMap(heroes);
    const profile = compArchetypeProfile(compOf(heroes), map);
    expect(profile.dive).toBeCloseTo(1, 6);
    expect(profile.brawl).toBeCloseTo(0, 6);
    expect(profile.poke).toBeCloseTo(0, 6);
  });
});

describe('archetypeMatchScore', () => {
  it('pure dive vs pure poke → positive', () => {
    const my = pureCompHeroes('m', DIVE);
    const en = pureCompHeroes('e', POKE);
    const map = buildMap([...my, ...en]);
    const res = archetypeMatchScore(compOf(my), compOf(en), map);
    expect(res.value).toBeCloseTo(1, 6);
    expect(res.label).toMatch(/counters/i);
  });

  it('reverse (pure poke vs pure dive) → negative of same magnitude', () => {
    const my = pureCompHeroes('m', POKE);
    const en = pureCompHeroes('e', DIVE);
    const map = buildMap([...my, ...en]);
    const res = archetypeMatchScore(compOf(my), compOf(en), map);
    expect(res.value).toBeCloseTo(-1, 6);
    expect(res.label).toMatch(/countered/i);
  });

  it('neutral profiles → ~0', () => {
    const my = pureCompHeroes('m', NEUTRAL);
    const en = pureCompHeroes('e', NEUTRAL);
    const map = buildMap([...my, ...en]);
    const res = archetypeMatchScore(compOf(my), compOf(en), map);
    expect(Math.abs(res.value)).toBeLessThan(1e-9);
    expect(res.label).toBe('Comp archetype: neutral');
  });
});

describe('keyThreats', () => {
  it('ranks an unanswerable hero first', () => {
    const heroes = [
      makeHero('et', 'tank', DIVE),
      makeHero('ed1', 'dps', DIVE),
      makeHero('ed2', 'dps', DIVE),
      makeHero('es1', 'support', DIVE),
      makeHero('es2', 'support', DIVE),
      makeHero('m1', 'tank', DIVE),
      makeHero('m2', 'dps', DIVE),
    ];
    const map = buildMap(heroes);
    const enemy: Comp = compFromIds('et', ['ed1', 'ed2'], ['es1', 'es2']);
    // ed1 is unanswerable (no positive matchup); others have a +2 counter from m1/m2
    const matchups: Record<string, number> = {
      'm1:et': 2,
      'm1:ed2': 2,
      'm2:es1': 2,
      'm2:es2': 2,
    };
    const threats = keyThreats(enemy, map, matchups);
    expect(threats[0]).toBe('ed1');
    expect(threats).toHaveLength(2);
  });

  it('prefers DPS on tie', () => {
    const heroes = [
      makeHero('et', 'tank', DIVE),
      makeHero('ed1', 'dps', DIVE),
      makeHero('ed2', 'dps', DIVE),
      makeHero('es1', 'support', DIVE),
      makeHero('es2', 'support', DIVE),
    ];
    const map = buildMap(heroes);
    const enemy: Comp = compFromIds('et', ['ed1', 'ed2'], ['es1', 'es2']);
    const threats = keyThreats(enemy, map, {});
    // All threats equal; DPS preferred, then alphabetical
    expect(threats).toEqual(['ed1', 'ed2']);
  });
});
