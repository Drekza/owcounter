import { computed, ref, watch } from 'vue';
import type { Comp, MatchupCtx, Suggestion } from '../domain/types';
import type { TeamState } from '../ui/components/TeamPicker.vue';
import type { MapCtxState } from '../ui/components/MapContextBar.vue';
import { topKCounters, type LockedSlots } from '../domain/search';
import { generateExplanation, type Reasoning } from '../domain/reasoning';
import { DEFAULT_WEIGHTS } from '../config/weights';
import { DEBOUNCE_MS, TOP_K } from '../config/constants';
import { heroesById, scoringData } from '../data';

function teamIds(s: TeamState): string[] {
  return [s.tank, s.dps[0], s.dps[1], s.support[0], s.support[1]].filter(
    (x): x is string => Boolean(x),
  );
}

export function useAppState() {
  const enemy = ref<TeamState>({
    tank: null,
    dps: [null, null],
    support: [null, null],
  });
  const myPicks = ref<TeamState>({
    tank: null,
    dps: [null, null],
    support: [null, null],
  });
  const bans = ref<string[]>([]);
  const mapCtx = ref<MapCtxState>({ enabled: false, mapId: null });

  const enemyComp = computed<Comp | null>(() => {
    const e = enemy.value;
    if (!e.tank || !e.dps[0] || !e.dps[1] || !e.support[0] || !e.support[1]) {
      return null;
    }
    return {
      tank: e.tank,
      dps: [e.dps[0], e.dps[1]],
      support: [e.support[0], e.support[1]],
    };
  });

  const myPickIds = computed<string[]>(() => teamIds(myPicks.value));

  const locked = computed<LockedSlots>(() => ({
    tank: myPicks.value.tank,
    dps: [myPicks.value.dps[0], myPicks.value.dps[1]],
    support: [myPicks.value.support[0], myPicks.value.support[1]],
  }));

  const ctx = computed<MatchupCtx>(() => ({
    mapId: mapCtx.value.enabled ? mapCtx.value.mapId ?? undefined : undefined,
    bans: bans.value,
  }));

  const banConflicts = computed<string[]>(() => {
    const banSet = new Set(bans.value);
    const out: string[] = [];
    const seen = new Set<string>();
    for (const id of [...teamIds(enemy.value), ...myPickIds.value]) {
      if (banSet.has(id) && !seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
    return out;
  });

  const suggestions = ref<Suggestion[]>([]);
  const reasonings = ref<Reasoning[]>([]);
  const isComputing = ref(false);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function runCompute() {
    const comp = enemyComp.value;
    if (!comp) {
      suggestions.value = [];
      reasonings.value = [];
      return;
    }
    const sugs = topKCounters(
      comp,
      ctx.value,
      TOP_K,
      DEFAULT_WEIGHTS,
      scoringData,
      locked.value,
    );
    suggestions.value = sugs;
    reasonings.value = sugs.map((s) => generateExplanation(s.breakdown));
  }

  function scheduleCompute() {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    if (!enemyComp.value) {
      isComputing.value = false;
      suggestions.value = [];
      reasonings.value = [];
      return;
    }
    isComputing.value = true;
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      requestAnimationFrame(() => {
        runCompute();
        isComputing.value = false;
      });
    }, DEBOUNCE_MS);
  }

  watch([enemyComp, ctx, locked], scheduleCompute, { deep: true });

  function resetAll() {
    enemy.value = { tank: null, dps: [null, null], support: [null, null] };
    myPicks.value = { tank: null, dps: [null, null], support: [null, null] };
    bans.value = [];
    mapCtx.value = { enabled: false, mapId: null };
  }

  return {
    enemy,
    myPicks,
    bans,
    mapCtx,
    enemyComp,
    myPickIds,
    ctx,
    locked,
    banConflicts,
    suggestions,
    reasonings,
    isComputing,
    heroesById,
    resetAll,
  };
}
