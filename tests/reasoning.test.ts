import { describe, expect, it } from 'vitest';
import { generateExplanation } from '../src/domain/reasoning';
import type { Term } from '../src/domain/types';

describe('generateExplanation', () => {
  it('splits positives into strong (top-4) and negatives into weak (top-2)', () => {
    const terms: Term[] = [
      { kind: 'pair', label: 'A vs B: +2', value: 2 },
      { kind: 'pair', label: 'C vs D: +2', value: 2 },
      { kind: 'synergy', label: 'E + F: +1', value: 1 },
      { kind: 'archetype', label: 'Counter-arch: +0.4', value: 0.4 },
      { kind: 'pair', label: 'G vs H: -1', value: -1 },
      { kind: 'antiSyn', label: 'I + J: -1', value: -1 },
    ];
    const r = generateExplanation(terms);
    expect(r.strong).toEqual([
      'A vs B: +2',
      'C vs D: +2',
      'E + F: +1',
      'Counter-arch: +0.4',
    ]);
    expect(r.weak).toEqual(['G vs H: -1', 'I + J: -1']);
  });

  it('respects custom maxStrong/maxWeak caps', () => {
    const terms: Term[] = [
      { kind: 'pair', label: 'a', value: 3 },
      { kind: 'pair', label: 'b', value: 2 },
      { kind: 'pair', label: 'c', value: 1 },
      { kind: 'pair', label: 'd', value: -3 },
      { kind: 'pair', label: 'e', value: -2 },
      { kind: 'pair', label: 'f', value: -1 },
    ];
    const r = generateExplanation(terms, { maxStrong: 2, maxWeak: 1 });
    expect(r.strong).toEqual(['a', 'b']);
    expect(r.weak).toEqual(['d']);
  });

  it('all-positive → weak: []', () => {
    const terms: Term[] = [
      { kind: 'pair', label: 'a', value: 1 },
      { kind: 'pair', label: 'b', value: 2 },
    ];
    const r = generateExplanation(terms);
    expect(r.strong).toEqual(['b', 'a']);
    expect(r.weak).toEqual([]);
  });

  it('all-negative → strong: []', () => {
    const terms: Term[] = [
      { kind: 'pair', label: 'a', value: -1 },
      { kind: 'pair', label: 'b', value: -2 },
    ];
    const r = generateExplanation(terms);
    expect(r.weak).toEqual(['b', 'a']);
    expect(r.strong).toEqual([]);
  });

  it('empty input → both arrays empty', () => {
    const r = generateExplanation([]);
    expect(r.strong).toEqual([]);
    expect(r.weak).toEqual([]);
  });

  it('zero-valued terms are skipped', () => {
    const terms: Term[] = [
      { kind: 'pair', label: 'z', value: 0 },
      { kind: 'pair', label: 'a', value: 1 },
    ];
    const r = generateExplanation(terms);
    expect(r.strong).toEqual(['a']);
    expect(r.weak).toEqual([]);
  });

  it('stable order preserved on absolute-value tie', () => {
    const terms: Term[] = [
      { kind: 'pair', label: 'p1', value: 1 },
      { kind: 'pair', label: 'p2', value: 1 },
      { kind: 'pair', label: 'p3', value: 1 },
    ];
    const r1 = generateExplanation(terms);
    const r2 = generateExplanation(terms);
    expect(r1.strong).toEqual(r2.strong);
    expect(r1.strong).toEqual(['p1', 'p2', 'p3']);
  });
});
