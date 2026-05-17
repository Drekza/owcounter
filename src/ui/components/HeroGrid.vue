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

const ROLE_ROWS: { role: Role; label: string; dot: string }[] = [
  { role: 'tank', label: 'Tank', dot: 'bg-role-tank' },
  { role: 'dps', label: 'DPS', dot: 'bg-role-dps' },
  { role: 'support', label: 'Support', dot: 'bg-role-support' },
];

const rows = computed(() => {
  const q = search.value.trim().toLowerCase();
  return ROLE_ROWS
    .filter((r) => !props.filterRole || r.role === props.filterRole)
    .map(({ role, label, dot }) => {
      const list = props.heroes
        .filter((h) => h.role === role)
        .filter((h) => !q || h.name.toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name));
      return { role, label, dot, heroes: list };
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
    <div class="relative">
      <svg
        class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M9 3a6 6 0 1 0 3.78 10.65l3.79 3.78a.75.75 0 1 0 1.06-1.06l-3.78-3.79A6 6 0 0 0 9 3Zm-4.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z"
          clip-rule="evenodd"
        />
      </svg>
      <input
        v-model="search"
        type="text"
        placeholder="Search heroes…"
        class="w-full rounded-md bg-slate-quiet/60 border border-slate-700/60 pl-8 pr-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ow-orange/60 hover:border-slate-500 transition"
        @keydown="onSearchKeydown"
      />
    </div>

    <div v-for="row in rows" :key="row.role" class="flex flex-col gap-1.5">
      <div class="flex items-center gap-1.5 panel-title">
        <span
          class="w-1.5 h-1.5 rounded-full"
          :class="row.dot"
          aria-hidden="true"
        />
        <span>{{ row.label }}</span>
      </div>
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
