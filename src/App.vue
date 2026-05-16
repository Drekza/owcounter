<script setup lang="ts">
import { computed } from 'vue';
import Header from './ui/components/Header.vue';
import ControlsBar from './ui/components/ControlsBar.vue';
import TeamPicker from './ui/components/TeamPicker.vue';
import EnemyCompPanel from './ui/components/EnemyCompPanel.vue';
import SuggestionCard from './ui/components/SuggestionCard.vue';
import type { ArchVec, Comp } from './domain/types';
import {
  compArchetypeProfile,
  keyThreats as computeKeyThreats,
} from './domain/archetypes';
import { heroes, heroesById, maps, matchups, patch, updated } from './data';
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
} = useAppState();

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
    </template>
  </Header>

  <main class="flex-1 px-6 py-5 grid gap-5 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">
    <div class="flex flex-col gap-5 min-w-0">
      <section class="panel p-5 flex flex-col gap-4" aria-label="My team locked picks">
        <TeamPicker
          v-model="myPicks"
          :heroes="heroes"
          :bans="bans"
          :label="`My Team — locked picks${myPicksCount ? ` (${myPicksCount}/5)` : ''}`"
        />
      </section>

      <section class="panel p-5 flex flex-col gap-4" aria-label="Enemy team">
        <div
          v-if="banConflicts.length"
          class="rounded-md border border-red-500/60 bg-red-900/30 px-3 py-2 text-xs text-red-100"
          role="alert"
        >
          Banned hero{{ banConflicts.length > 1 ? 'es' : '' }} in a slot:
          <span class="font-semibold">{{ banConflictNames }}</span
          >. Clear the slot or unban.
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

      <section class="panel p-5" aria-label="Suggested counters">
        <div class="flex items-center justify-between mb-3">
          <h2 class="panel-title">Suggested counters</h2>
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
        <p v-if="!enemyComp" class="text-sm text-slate-400">
          <template v-if="filledEnemyCount === 0">
            Pick 5 enemy heroes to see suggestions.
          </template>
          <template v-else>
            Pick {{ 5 - filledEnemyCount }} more enemy hero{{
              5 - filledEnemyCount > 1 ? 'es' : ''
            }}.
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
          />
        </div>
      </section>
    </aside>
  </main>

  <footer
    class="px-6 py-3 border-t border-slate-700/60 bg-slate-panel/40 text-xs text-slate-500 flex items-center justify-between"
  >
    <span>{{ patchLabel }}</span>
    <span>{{ updatedLabel }}</span>
  </footer>
</template>
