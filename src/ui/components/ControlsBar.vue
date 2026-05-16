<script setup lang="ts">
import type { Hero, MapDef } from '../../domain/types';
import BansPanel from './BansPanel.vue';
import MapContextBar, { type MapCtxState } from './MapContextBar.vue';

defineProps<{
  heroes: Hero[];
  maps: MapDef[];
  bans: string[];
  mapCtx: MapCtxState;
}>();

const emit = defineEmits<{
  (e: 'update:bans', value: string[]): void;
  (e: 'update:mapCtx', value: MapCtxState): void;
}>();
</script>

<template>
  <div class="flex items-center gap-3 flex-wrap">
    <MapContextBar
      :maps="maps"
      :model-value="mapCtx"
      @update:model-value="emit('update:mapCtx', $event)"
    />
    <BansPanel
      :heroes="heroes"
      :model-value="bans"
      @update:model-value="emit('update:bans', $event)"
    />
  </div>
</template>
