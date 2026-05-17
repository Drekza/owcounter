<script setup lang="ts">
import { computed, ref } from 'vue';
import Header from './ui/components/Header.vue';
import ControlsBar from './ui/components/ControlsBar.vue';
import TeamPicker from './ui/components/TeamPicker.vue';
import EnemyCompPanel from './ui/components/EnemyCompPanel.vue';
import MapBriefPanel from './ui/components/MapBriefPanel.vue';
import SuggestionCard from './ui/components/SuggestionCard.vue';
import type { ArchVec, Comp } from './domain/types';
import {
  compArchetypeProfile,
  keyThreats as computeKeyThreats,
} from './domain/archetypes';
import { heroes, heroesById, maps, mapsById, matchups, patch, updated } from './data';
import { useAppState } from './state/useAppState';

const {
  enemy,
  myPicks,
  bans,
  mapCtx,
  enemyComp,
  myPickIds,
  banConflicts,
  suggestions,
  reasonings,
  isComputing,
  resetAll,
} = useAppState();

const myPickerOpen = ref(false);

const hasAnyData = computed(
  () =>
    myPickIds.value.length > 0 ||
    [enemy.value.tank, ...enemy.value.dps, ...enemy.value.support].some(Boolean) ||
    bans.value.length > 0 ||
    mapCtx.value.enabled ||
    mapCtx.value.mapId !== null,
);

function handleResetAll() {
  if (!hasAnyData.value) return;
  if (typeof window !== 'undefined' && !window.confirm('Reset all picks, bans, and map?')) {
    return;
  }
  resetAll();
  myPickerOpen.value = false;
}

const EMPTY_COMP: Comp = {
  tank: '',
  dps: ['', ''],
  support: ['', ''],
};

const enemyCompOrEmpty = computed<Comp>(() => enemyComp.value ?? EMPTY_COMP);

const enemyArchetypeProfile = computed<ArchVec>(() =>
  enemyComp.value
    ? compArchetypeProfile(enemyComp.value, heroesById)
    : { dive: 0, brawl: 0, poke: 0 },
);

const enemyKeyThreats = computed<string[]>(() =>
  enemyComp.value
    ? computeKeyThreats(enemyComp.value, heroesById, matchups)
    : [],
);

const filledEnemyCount = computed(() => {
  const e = enemy.value;
  return [e.tank, e.dps[0], e.dps[1], e.support[0], e.support[1]].filter(
    (x): x is string => Boolean(x),
  ).length;
});

const banConflictNames = computed(() =>
  banConflicts.value
    .map((id) => heroesById.get(id)?.name ?? id)
    .join(', '),
);

const myPicksCount = computed(() => myPickIds.value.length);

const lockedIdSet = computed(() => new Set(myPickIds.value));

const hasSuggestionContext = computed(
  () =>
    enemyComp.value !== null ||
    (mapCtx.value.enabled && mapCtx.value.mapId !== null) ||
    bans.value.length > 0 ||
    myPicksCount.value > 0,
);

const suggestionPanelTitle = computed(() =>
  enemyComp.value ? 'Suggested counters' : 'Suggested comps',
);

const suggestionPanelLabel = computed(() =>
  enemyComp.value ? 'Suggested counters' : 'Suggested comps',
);

const selectedMap = computed(() =>
  mapCtx.value.enabled && mapCtx.value.mapId
    ? mapsById.get(mapCtx.value.mapId) ?? null
    : null,
);

const maxSuggestionScore = computed(() => {
  if (suggestions.value.length === 0) return 1;
  const top = suggestions.value[0].score;
  return Math.max(1, top);
});

const patchLabel = computed(() => patch || 'Data: pending');
const updatedLabel = computed(() => (updated ? `Updated ${updated}` : 'Updated —'));
</script>

<template>
  <Header>
    <template #controls>
      <ControlsBar
        :heroes="heroes"
        :maps="maps"
        v-model:bans="bans"
        v-model:map-ctx="mapCtx"
      />
      <button
        type="button"
        class="icon-btn"
        :class="hasAnyData ? 'hover:text-red-300 hover:border-red-500/40' : ''"
        :disabled="!hasAnyData"
        :title="hasAnyData ? 'Reset all picks, bans, and map' : 'Nothing to reset'"
        :aria-label="hasAnyData ? 'Reset all' : 'Nothing to reset'"
        @click="handleResetAll"
      >
        <svg
          class="w-4 h-4"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M3.5 10a6.5 6.5 0 1 1 1.95 4.64" />
          <path d="M3 14.5V10h4.5" />
        </svg>
      </button>
    </template>
  </Header>

  <main class="flex-1 px-6 py-5 grid gap-5 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]">
    <div class="flex flex-col gap-5 min-w-0">
      <section
        class="panel-quiet px-5 py-3 flex flex-col gap-3"
        aria-label="My team locked picks"
      >
        <TeamPicker
          v-model="myPicks"
          :heroes="heroes"
          :bans="bans"
          :picker-visible="myPickerOpen"
          :label="`Locked picks · optional${myPicksCount ? ` (${myPicksCount}/5)` : ''}`"
        >
          <template #header-actions>
            <button
              type="button"
              class="text-xs text-slate-300 hover:text-ow-orange transition focus-visible:ring-2 focus-visible:ring-ow-orange/70 rounded px-2 py-1"
              :aria-expanded="myPickerOpen"
              @click="myPickerOpen = !myPickerOpen"
            >
              {{ myPickerOpen ? 'Hide picker' : myPicksCount ? 'Edit picks' : 'Add picks' }}
            </button>
          </template>
        </TeamPicker>
      </section>

      <section
        class="panel-elevated p-5 flex flex-col gap-4"
        aria-label="Enemy team"
      >
        <div
          v-if="banConflicts.length"
          class="rounded-md border border-red-500/60 bg-red-900/30 px-3 py-2 text-xs text-red-100 flex items-start gap-2"
          role="alert"
        >
          <svg
            class="w-4 h-4 mt-0.5 flex-shrink-0 text-red-300"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M9.4 2.6a1 1 0 0 1 1.2 0l7 5a1 1 0 0 1 .4.8v6a1 1 0 0 1-.4.8l-7 5a1 1 0 0 1-1.2 0l-7-5a1 1 0 0 1-.4-.8v-6a1 1 0 0 1 .4-.8l7-5ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 7a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
              clip-rule="evenodd"
            />
          </svg>
          <span>
            Banned hero{{ banConflicts.length > 1 ? 'es' : '' }} in a slot:
            <span class="font-semibold">{{ banConflictNames }}</span
            >. Clear the slot or unban.
          </span>
        </div>
        <TeamPicker
          v-model="enemy"
          :heroes="heroes"
          :bans="bans"
          label="Enemy Team"
        />
      </section>
    </div>

    <aside class="flex flex-col gap-5">
      <section class="panel p-5" aria-label="Enemy comp analysis">
        <EnemyCompPanel
          :enemy="enemyCompOrEmpty"
          :archetype-profile="enemyArchetypeProfile"
          :key-threats="enemyKeyThreats"
          :heroes-by-id="heroesById"
        />
      </section>

      <section v-if="selectedMap" class="panel p-5" aria-label="Map brief">
        <MapBriefPanel
          :map="selectedMap"
          :side="mapCtx.side"
          :heroes-by-id="heroesById"
        />
      </section>

      <section class="panel p-5" :aria-label="suggestionPanelLabel">
        <div class="flex items-center justify-between mb-3">
          <h2 class="panel-title">{{ suggestionPanelTitle }}</h2>
          <span
            v-if="isComputing"
            class="text-[10px] uppercase tracking-wide text-ow-orange flex items-center gap-1.5"
          >
            <span
              class="w-3 h-3 border-2 border-ow-orange border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
            Computing
          </span>
        </div>
        <p
          v-if="myPicksCount > 0 && !isComputing"
          class="text-[11px] text-slate-400 mb-2"
        >
          Suggestions respect {{ myPicksCount }} locked pick{{ myPicksCount > 1 ? 's' : '' }}.
        </p>
        <p
          v-if="!enemyComp && hasSuggestionContext && !isComputing"
          class="text-[11px] text-slate-400 mb-2"
        >
          No enemy locked — ranking by synergy{{ mapCtx.enabled && mapCtx.mapId ? ' and map' : '' }}{{ bans.length ? ' (bans applied)' : '' }}.
        </p>
        <p v-if="!hasSuggestionContext" class="text-sm text-slate-400">
          <template v-if="filledEnemyCount === 0">
            Pick enemy heroes, a map, or bans to see suggestions.
          </template>
          <template v-else>
            Pick {{ 5 - filledEnemyCount }} more enemy hero{{
              5 - filledEnemyCount > 1 ? 'es' : ''
            }} — or set a map/bans for partial suggestions.
          </template>
        </p>
        <div
          v-else
          class="flex flex-col gap-3 transition-opacity"
          :class="isComputing ? 'opacity-60' : ''"
        >
          <p
            v-if="suggestions.length === 0"
            class="text-sm text-slate-400"
          >
            No legal comps — too many bans or locked picks?
          </p>
          <SuggestionCard
            v-for="(s, i) in suggestions"
            :key="i"
            :rank="i + 1"
            :suggestion="s"
            :heroes-by-id="heroesById"
            :reasoning="reasonings[i] ?? { strong: [], weak: [] }"
            :locked-ids="lockedIdSet"
            :max-score="maxSuggestionScore"
          />
        </div>
      </section>
    </aside>
  </main>

  <footer
    class="px-6 py-3 border-t border-slate-800/80 bg-slate-quiet/40 text-[11px] text-slate-500 flex items-center justify-between"
  >
    <span class="inline-flex items-center gap-2">
      <span class="w-1.5 h-1.5 rounded-full bg-ow-orange/70" aria-hidden="true" />
      {{ patchLabel }}
    </span>
    <span>{{ updatedLabel }}</span>
  </footer>
</template>
