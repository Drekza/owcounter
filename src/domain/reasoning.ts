import type { Term } from './types';

export interface Reasoning {
  strong: string[];
  weak: string[];
}

export interface ReasoningOpts {
  maxStrong?: number;
  maxWeak?: number;
}

export function generateExplanation(
  terms: Term[],
  opts: ReasoningOpts = {},
): Reasoning {
  const maxStrong = opts.maxStrong ?? 4;
  const maxWeak = opts.maxWeak ?? 2;

  const sorted = [...terms].sort(
    (a, b) => Math.abs(b.value) - Math.abs(a.value),
  );

  const strong: string[] = [];
  const weak: string[] = [];

  for (const t of sorted) {
    if (strong.length >= maxStrong && weak.length >= maxWeak) break;
    if (t.value > 0) {
      if (strong.length < maxStrong) strong.push(t.label);
    } else if (t.value < 0) {
      if (weak.length < maxWeak) weak.push(t.label);
    }
  }

  return { strong, weak };
}
