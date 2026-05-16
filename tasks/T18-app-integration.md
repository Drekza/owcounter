# T18 — App integration (state, recompute pipeline, UX glue)

## Goal
Wire all components + domain modules together in `App.vue`. Manage reactive state, debounced recompute, loading/empty states, ban-conflict signaling.

## Depends on
T02, T05–T08 (data), T09–T12 (modules), T13–T17 (components)

## Files to create/modify
- `src/App.vue`
- `src/state/useAppState.ts` (composable holding reactive state + computed pipeline)
- `src/data/index.ts` (loads all JSON data, exposes `ScoringData`)

## State (composable)
```ts
import { ref, computed } from "vue";

export function useAppState() {
  const enemy = ref<EnemyState>({ tank: null, dps: [null, null], support: [null, null] });
  const bans = ref<string[]>([]);
  const mapCtx = ref<{ enabled: boolean; mapId: string | null }>({ enabled: false, mapId: null });
  const isComputing = ref(false);

  const enemyComp = computed<Comp | null>(() => /* if all 5 filled → Comp; else null */);
  const ctx = computed<MatchupCtx>(() => ({
    mapId: mapCtx.value.enabled ? mapCtx.value.mapId ?? undefined : undefined,
    bans: bans.value,
  }));

  // Debounced trigger
  const debouncedInputs = useDebouncedRef([enemyComp, ctx], 150);

  const suggestions = computed<Suggestion[]>(() => {
    if (!debouncedInputs.enemyComp) return [];
    const start = performance.now();
    const result = topKCounters(debouncedInputs.enemyComp, debouncedInputs.ctx, TOP_K, DEFAULT_WEIGHTS, data);
    if (performance.now() - start > COMPUTE_SPINNER_MS) isComputing.value = true;
    return result;
  });

  return { enemy, bans, mapCtx, enemyComp, suggestions, isComputing };
}
```

## App.vue structure
```vue
<template>
  <div class="min-h-screen bg-slate-base text-slate-100">
    <Header>
      <ControlsBar
        v-model:bans="bans"
        v-model:map-ctx="mapCtx"
        :heroes="heroes"
        :maps="maps"
      />
    </Header>

    <main>
      <EnemyTeamPicker v-model="enemy" :heroes="heroes" :bans="bans" />

      <BanConflictBanner v-if="banConflicts.length" :ids="banConflicts" />

      <EnemyCompPanel
        v-if="enemyComp"
        :enemy="enemyComp"
        :archetype-profile="enemyArchProfile"
        :key-threats="enemyKeyThreats"
        :heroes-by-id="heroesById"
      />
      <Placeholder v-else>Pick 5 enemy heroes to see analysis.</Placeholder>

      <section>
        <h2>Suggested counters</h2>
        <Spinner v-if="isComputing" />
        <SuggestionCard
          v-for="(s, i) in suggestions"
          :key="i"
          :rank="i + 1"
          :suggestion="s"
          :reasoning="reasonings[i]"
          :heroes-by-id="heroesById"
        />
      </section>
    </main>

    <Footer :patch="data.patch" :updated="data.updated" />
  </div>
</template>
```

## Ban-conflict handling
- `banConflicts = enemy heroes whose id ∈ bans`.
- Render red banner: "Banned hero(es) in enemy slot: X, Y. Clear slot or unban."
- Until cleared: suggestions still compute (algorithm still works), but show banner.

## Loading / empty states
- Enemy comp incomplete → suggestions section shows "Pick all 5 enemy heroes."
- Computing >200ms → spinner overlay on suggestion list.
- No suggestions above WEAK_THRESHOLD → cards render with `weak` badge per T17.

## Acceptance
- App boots, loads JSON data, all components mount.
- Picking 5 enemy heroes triggers suggestions <200ms (no spinner expected).
- Bans + map context changes update suggestions live.
- Ban conflict banner appears when ban+enemy overlap.
- Refresh resets all state (no persistence — confirmed in spec).
- No console errors / warnings.

## Notes
- Avoid recomputing reasoning on toggle-expand — precompute `reasonings[i]` alongside `suggestions`.
- `data.heroesById` built once at module init.
- If data is loaded async (dynamic import), show top-level "Loading data…" until ready.
