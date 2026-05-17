<script lang="ts">
import type { Side } from '../../domain/types';

export interface MapCtxState {
  enabled: boolean;
  mapId: string | null;
  side: Side | null;
}

export const EMPTY_MAP_CTX: MapCtxState = {
  enabled: false,
  mapId: null,
  side: null,
};
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ASYMMETRIC_MODES, type MapDef, type MapMode } from '../../domain/types';

const MODE_LABELS: Record<MapMode, string> = {
  control: 'Control',
  escort: 'Escort',
  hybrid: 'Hybrid',
  push: 'Push',
  flashpoint: 'Flashpoint',
  clash: 'Clash',
};

const MODE_ORDER: MapMode[] = [
  'control',
  'escort',
  'hybrid',
  'push',
  'flashpoint',
  'clash',
];

const props = defineProps<{
  maps: MapDef[];
  modelValue: MapCtxState;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: MapCtxState): void;
}>();

const selectedMap = computed(() =>
  props.modelValue.mapId
    ? props.maps.find((m) => m.id === props.modelValue.mapId) ?? null
    : null,
);

const internalMode = ref<MapMode | null>(selectedMap.value?.mode ?? null);

watch(
  () => props.modelValue.mapId,
  (id) => {
    if (id) {
      const m = props.maps.find((x) => x.id === id);
      if (m) internalMode.value = m.mode;
    }
  },
);

const modesAvailable = computed<MapMode[]>(() => {
  const set = new Set<MapMode>();
  for (const m of props.maps) set.add(m.mode);
  return MODE_ORDER.filter((m) => set.has(m));
});

const currentMode = computed<MapMode | null>(
  () => selectedMap.value?.mode ?? internalMode.value,
);

const mapsForMode = computed(() => {
  const mode = currentMode.value;
  if (!mode) return [];
  return props.maps
    .filter((m) => m.mode === mode)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
});

const supportsSide = computed(() =>
  currentMode.value ? ASYMMETRIC_MODES.has(currentMode.value) : false,
);

watch(supportsSide, (yes) => {
  if (!yes && props.modelValue.side !== null) {
    emit('update:modelValue', { ...props.modelValue, side: null });
  }
});

function onToggle(e: Event) {
  const enabled = (e.target as HTMLInputElement).checked;
  emit('update:modelValue', { enabled, mapId: null, side: null });
}

function onModeChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value;
  internalMode.value = value ? (value as MapMode) : null;
  const nextSide =
    value && ASYMMETRIC_MODES.has(value as MapMode) ? props.modelValue.side : null;
  emit('update:modelValue', { enabled: true, mapId: null, side: nextSide });
}

function onMapChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value;
  emit('update:modelValue', {
    enabled: true,
    mapId: value || null,
    side: supportsSide.value ? props.modelValue.side : null,
  });
}

function setSide(side: Side | null) {
  if (props.modelValue.side === side) return;
  emit('update:modelValue', { ...props.modelValue, side });
}
</script>

<template>
  <div class="flex items-center gap-2 flex-wrap">
    <label
      class="flex items-center gap-2 text-xs text-slate-300 px-3 py-1.5 rounded-md border border-slate-700/60 bg-slate-base/60 cursor-pointer hover:border-slate-500 transition select-none"
      :class="modelValue.enabled ? 'border-ow-orange/60 text-slate-100' : ''"
    >
      <input
        type="checkbox"
        class="accent-ow-orange w-3.5 h-3.5"
        :checked="modelValue.enabled"
        @change="onToggle"
      />
      <span class="font-semibold">Map context</span>
      <span v-if="selectedMap" class="text-slate-400">
        · {{ selectedMap.name }}<template v-if="modelValue.side">
          · {{ modelValue.side === 'attack' ? 'Attack' : 'Defense' }}
        </template>
      </span>
    </label>

    <template v-if="modelValue.enabled">
      <select
        class="text-xs bg-slate-base/60 border border-slate-700/60 rounded-md px-2 py-1.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-ow-orange/60"
        aria-label="Mode"
        :value="currentMode ?? ''"
        @change="onModeChange"
      >
        <option value="">Mode…</option>
        <option v-for="m in modesAvailable" :key="m" :value="m">
          {{ MODE_LABELS[m] }}
        </option>
      </select>
      <select
        class="text-xs bg-slate-base/60 border border-slate-700/60 rounded-md px-2 py-1.5 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ow-orange/60"
        aria-label="Map"
        :value="modelValue.mapId ?? ''"
        :disabled="!currentMode"
        @change="onMapChange"
      >
        <option value="">Map…</option>
        <option v-for="m in mapsForMode" :key="m.id" :value="m.id">
          {{ m.name }}
        </option>
      </select>
      <div
        v-if="supportsSide"
        class="flex items-center text-xs rounded-md border border-slate-700/60 bg-slate-base/60 overflow-hidden"
        role="group"
        aria-label="Side"
      >
        <button
          type="button"
          class="px-2.5 py-1.5 transition focus:outline-none focus:ring-2 focus:ring-ow-orange/60"
          :class="modelValue.side === null ? 'bg-slate-700/60 text-slate-100' : 'text-slate-400 hover:text-slate-200'"
          :aria-pressed="modelValue.side === null"
          title="Any side"
          @click="setSide(null)"
        >
          Any
        </button>
        <button
          type="button"
          class="px-2.5 py-1.5 border-l border-slate-700/60 transition focus:outline-none focus:ring-2 focus:ring-ow-orange/60"
          :class="modelValue.side === 'attack' ? 'bg-ow-orange/30 text-slate-100' : 'text-slate-400 hover:text-slate-200'"
          :aria-pressed="modelValue.side === 'attack'"
          @click="setSide('attack')"
        >
          Attack
        </button>
        <button
          type="button"
          class="px-2.5 py-1.5 border-l border-slate-700/60 transition focus:outline-none focus:ring-2 focus:ring-ow-orange/60"
          :class="modelValue.side === 'defense' ? 'bg-ow-orange/30 text-slate-100' : 'text-slate-400 hover:text-slate-200'"
          :aria-pressed="modelValue.side === 'defense'"
          @click="setSide('defense')"
        >
          Defense
        </button>
      </div>
    </template>
  </div>
</template>
