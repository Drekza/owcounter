import { enumerateLegalComps, type LockedSlots } from '../domain/search';
import { scoreComp } from '../domain/scoring';
import { generateExplanation, type Reasoning } from '../domain/reasoning';
import { scoringData } from '../data';
import { DEFAULT_WEIGHTS } from '../config/weights';
import { TOP_K, WEAK_THRESHOLD } from '../config/constants';
import type { Comp, MatchupCtx, Suggestion, Term } from '../domain/types';

export interface ComputeRequest {
  id: number;
  enemy: Comp | null;
  ctx: MatchupCtx;
  locked: LockedSlots;
}

export interface ComputeResponse {
  id: number;
  suggestions: Suggestion[];
  reasonings: Reasoning[];
}

const CHUNK_SIZE = 20000;
let latestRequestId = 0;

self.onmessage = (e: MessageEvent<ComputeRequest>) => {
  const req = e.data;
  if (req.id <= latestRequestId) return;
  latestRequestId = req.id;
  void runCompute(req);
};

async function runCompute(req: ComputeRequest): Promise<void> {
  const { id, enemy, ctx, locked } = req;
  const bans = new Set(ctx.bans);
  const heroes = Array.from(scoringData.heroesById.values());

  const all: Suggestion[] = [];
  let processed = 0;

  for (const comp of enumerateLegalComps(bans, heroes, locked)) {
    if (latestRequestId !== id) return;
    const { total, terms } = scoreComp(comp, enemy, ctx, DEFAULT_WEIGHTS, scoringData);
    all.push({ comp, score: total, breakdown: terms, weak: total < WEAK_THRESHOLD });
    processed++;
    if (processed % CHUNK_SIZE === 0) {
      await yieldToEventLoop();
      if (latestRequestId !== id) return;
    }
  }

  all.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aArch = archetypeTerm(a.breakdown);
    const bArch = archetypeTerm(b.breakdown);
    if (bArch !== aArch) return bArch - aArch;
    return a.comp.tank < b.comp.tank ? -1 : a.comp.tank > b.comp.tank ? 1 : 0;
  });

  if (latestRequestId !== id) return;
  const suggestions = all.slice(0, TOP_K);
  const reasonings = suggestions.map((s) => generateExplanation(s.breakdown));
  const response: ComputeResponse = { id, suggestions, reasonings };
  (self as unknown as Worker).postMessage(response);
}

function archetypeTerm(terms: readonly Term[]): number {
  for (const t of terms) if (t.kind === 'archetype') return t.value;
  return 0;
}

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
