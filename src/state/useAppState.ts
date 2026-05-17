import { computed, ref, watch } from 'vue';
import type { Comp, MatchupCtx, Suggestion } from '../domain/types';
import type { TeamState } from '../ui/components/TeamPicker.vue';
import type { MapCtxState } from '../ui/components/MapContextBar.vue';
import type { LockedSlots } from '../domain/search';
import type { Reasoning } from '../domain/reasoning';
import { DEBOUNCE_MS } from '../config/constants';
import { heroesById } from '../data';
import ComputeWorker from './compute.worker?worker';
import type { ComputeRequest, ComputeResponse } from './compute.worker';

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
  const mapCtx = ref<MapCtxState>({ enabled: false, mapId: null, side: null });

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
    side:
      mapCtx.value.enabled && mapCtx.value.mapId
        ? mapCtx.value.side ?? undefined
        : undefined,
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

  const hasComputeInput = computed(
    () =>
      enemyComp.value !== null ||
      (mapCtx.value.enabled && mapCtx.value.mapId !== null) ||
      bans.value.length > 0 ||
      myPickIds.value.length > 0,
  );

  const worker = new ComputeWorker();
  let nextRequestId = 1;
  let activeRequestId = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  worker.onmessage = (e: MessageEvent<ComputeResponse>) => {
    if (e.data.id !== activeRequestId) return;
    suggestions.value = e.data.suggestions;
    reasonings.value = e.data.reasonings;
    isComputing.value = false;
  };

  function dispatchCompute() {
    activeRequestId = nextRequestId++;
    const e = enemyComp.value;
    const c = ctx.value;
    const l = locked.value;
    const req: ComputeRequest = {
      id: activeRequestId,
      enemy: e
        ? { tank: e.tank, dps: [e.dps[0], e.dps[1]], support: [e.support[0], e.support[1]] }
        : null,
      ctx: { mapId: c.mapId, side: c.side, bans: [...c.bans] },
      locked: {
        tank: l.tank ?? null,
        dps: [l.dps?.[0] ?? null, l.dps?.[1] ?? null],
        support: [l.support?.[0] ?? null, l.support?.[1] ?? null],
      },
    };
    worker.postMessage(req);
  }

  function scheduleCompute() {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    if (!hasComputeInput.value) {
      activeRequestId = 0;
      isComputing.value = false;
      suggestions.value = [];
      reasonings.value = [];
      return;
    }
    isComputing.value = true;
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      dispatchCompute();
    }, DEBOUNCE_MS);
  }

  watch([enemyComp, ctx, locked], scheduleCompute, { deep: true });

  function resetAll() {
    enemy.value = { tank: null, dps: [null, null], support: [null, null] };
    myPicks.value = { tank: null, dps: [null, null], support: [null, null] };
    bans.value = [];
    mapCtx.value = { enabled: false, mapId: null, side: null };
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
