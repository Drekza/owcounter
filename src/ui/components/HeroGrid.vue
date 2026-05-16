<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Hero, Role } from '../../domain/types';
import HeroPortrait from './HeroPortrait.vue';

const props = defineProps<{
  heroes: Hero[];
  disabledIds?: string[];
  selectedIds?: string[];
  filterRole?: Role;
  onPick: (heroId: string) => void;
}>();

const search = ref('');

const disabledSet = computed(() => new Set(props.disabledIds ?? []));
const selectedSet = computed(() => new Set(props.selectedIds ?? []));

const ROLE_ROWS: { role: Role; label: string }[] = [
  { role: 'tank', label: 'TANK' },
  { role: 'dps', label: 'DPS' },
  { role: 'support', label: 'SUPPORT' },
];

const rows = computed(() => {
  const q = search.value.trim().toLowerCase();
  return ROLE_ROWS
    .filter((r) => !props.filterRole || r.role === props.filterRole)
    .map(({ role, label }) => {
      const list = props.heroes
        .filter((h) => h.role === role)
        .filter((h) => !q || h.name.toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name));
      return { role, label, heroes: list };
    });
});

const enabledMatches = computed(() =>
  rows.value.flatMap((r) => r.heroes).filter((h) => !disabledSet.value.has(h.id)),
);

function handlePick(id: string) {
  if (disabledSet.value.has(id)) return;
  props.onPick(id);
}

function onSearchKeydown(e: KeyboardEvent) {
  if (e.key !== 'Enter') return;
  if (enabledMatches.value.length === 1) {
    handlePick(enabledMatches.value[0].id);
    search.value = '';
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <input
      v-model="search"
      type="text"
      placeholder="Search heroes…"
      class="w-full rounded-md bg-slate-base/60 border border-slate-700/60 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-ow-orange/60"
      @keydown="onSearchKeydown"
    />

    <div v-for="row in rows" :key="row.role" class="flex flex-col gap-1.5">
      <div class="text-xs panel-title">{{ row.label }}</div>
      <div v-if="row.heroes.length === 0" class="text-xs text-slate-500 italic">
        no match
      </div>
      <div v-else class="flex flex-wrap gap-2">
        <HeroPortrait
          v-for="h in row.heroes"
          :key="h.id"
          :hero="h"
          :disabled="disabledSet.has(h.id)"
          :selected="selectedSet.has(h.id)"
          @pick="handlePick"
        />
      </div>
    </div>
  </div>
</template>
