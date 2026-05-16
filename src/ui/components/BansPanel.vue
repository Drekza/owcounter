<script setup lang="ts">
import { computed } from 'vue';
import type { Hero } from '../../domain/types';
import HeroGrid from './HeroGrid.vue';

const MAX_BANS = 4;

const props = defineProps<{
  heroes: Hero[];
  modelValue: string[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
}>();

const heroById = computed(() => new Map(props.heroes.map((h) => [h.id, h])));

const selectedHeroes = computed(() =>
  props.modelValue
    .map((id) => heroById.value.get(id))
    .filter((h): h is Hero => Boolean(h)),
);

function togglePick(id: string) {
  const current = props.modelValue;
  if (current.includes(id)) {
    emit(
      'update:modelValue',
      current.filter((x) => x !== id),
    );
    return;
  }
  if (current.length >= MAX_BANS) return;
  emit('update:modelValue', [...current, id]);
}

function removeBan(id: string) {
  emit(
    'update:modelValue',
    props.modelValue.filter((x) => x !== id),
  );
}

function clearAll() {
  emit('update:modelValue', []);
}
</script>

<template>
  <details class="group relative">
    <summary
      class="list-none [&::-webkit-details-marker]:hidden flex items-center gap-2 text-xs text-slate-300 px-3 py-1.5 rounded-md border border-slate-700/60 bg-slate-base/60 cursor-pointer select-none hover:border-slate-500 group-open:border-ow-orange/60 group-open:text-slate-100 transition"
      aria-label="Bans"
    >
      <span class="font-semibold">Bans</span>
      <span class="text-slate-400">({{ modelValue.length }}/{{ MAX_BANS }})</span>
      <span
        class="ml-1 text-slate-500 transition-transform group-open:rotate-180"
        aria-hidden="true"
      >▾</span>
    </summary>

    <div
      class="absolute z-30 mt-2 right-0 w-[min(720px,90vw)] max-h-[70vh] overflow-auto panel p-4 flex flex-col gap-3 shadow-xl"
      role="dialog"
      aria-label="Bans picker"
    >
      <div class="flex items-center justify-between gap-3">
        <div class="text-xs panel-title">
          Selected ({{ modelValue.length }}/{{ MAX_BANS }})
        </div>
        <button
          v-if="modelValue.length > 0"
          type="button"
          class="text-xs text-slate-400 hover:text-ow-orange focus:outline-none focus:text-ow-orange"
          @click="clearAll"
        >
          Clear bans
        </button>
      </div>

      <div
        v-if="selectedHeroes.length === 0"
        class="text-xs text-slate-500 italic"
      >
        No bans yet — pick up to {{ MAX_BANS }} heroes below.
      </div>
      <div v-else class="flex flex-wrap gap-1.5">
        <button
          v-for="h in selectedHeroes"
          :key="h.id"
          type="button"
          class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-base/70 border border-slate-700/60 text-xs text-slate-100 hover:border-red-500 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-ow-orange"
          :title="`Remove ban: ${h.name}`"
          @click="removeBan(h.id)"
        >
          {{ h.name }}
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <HeroGrid
        :heroes="heroes"
        :selected-ids="modelValue"
        :on-pick="togglePick"
      />
    </div>
  </details>
</template>
