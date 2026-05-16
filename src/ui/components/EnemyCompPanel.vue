<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ArchVec, Archetype, Comp, Hero } from '../../domain/types';

const props = defineProps<{
  enemy: Comp;
  archetypeProfile: ArchVec;
  keyThreats: string[];
  heroesById: Map<string, Hero>;
}>();

const isComplete = computed(() => {
  const ids = [props.enemy.tank, ...props.enemy.dps, ...props.enemy.support];
  return ids.every((id) => id && props.heroesById.has(id));
});

interface BarRow {
  key: Archetype;
  label: string;
  pct: number;
  colorClass: string;
}

const bars = computed<BarRow[]>(() => {
  if (!isComplete.value) return [];
  const dive = Math.round((props.archetypeProfile.dive ?? 0) * 100);
  const brawl = Math.round((props.archetypeProfile.brawl ?? 0) * 100);
  const poke = Math.max(0, 100 - dive - brawl);
  return [
    { key: 'dive', label: 'Dive', pct: dive, colorClass: 'bg-ow-orange' },
    { key: 'brawl', label: 'Brawl', pct: brawl, colorClass: 'bg-red-500' },
    { key: 'poke', label: 'Poke', pct: poke, colorClass: 'bg-blue-500' },
  ];
});

const threatHeroes = computed(() =>
  props.keyThreats
    .map((id) => props.heroesById.get(id))
    .filter((h): h is Hero => Boolean(h)),
);

const failedImgs = ref<Set<string>>(new Set());

function portraitUrl(h: Hero): string | null {
  if (!h.portrait) return null;
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  return base + (h.portrait.startsWith('/') ? h.portrait : '/' + h.portrait);
}

function onImgError(id: string) {
  failedImgs.value = new Set(failedImgs.value).add(id);
}
</script>

<template>
  <div>
    <h2 class="panel-title mb-3">Enemy Comp</h2>

    <p v-if="!isComplete" class="text-sm text-slate-400">
      Pick enemy team to see analysis.
    </p>

    <template v-else>
      <div class="flex flex-col gap-2" aria-label="Archetype profile">
        <div v-for="b in bars" :key="b.key" class="flex items-center gap-3">
          <div
            class="flex-1 h-2 bg-slate-700/70 rounded-sm overflow-hidden"
            role="progressbar"
            :aria-label="`${b.label} archetype`"
            :aria-valuenow="b.pct"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div
              class="h-full transition-[width] duration-200"
              :class="b.colorClass"
              :style="{ width: `${b.pct}%` }"
            />
          </div>
          <div class="w-20 flex items-center justify-between text-xs text-slate-300">
            <span>{{ b.label }}</span>
            <span class="text-slate-100 font-semibold">{{ b.pct }}%</span>
          </div>
        </div>
      </div>

      <div class="mt-4">
        <div class="text-xs panel-title mb-2">Key threats</div>
        <div
          v-if="threatHeroes.length === 0"
          class="text-xs text-slate-500 italic"
        >
          —
        </div>
        <div v-else class="flex gap-3 flex-wrap">
          <div
            v-for="h in threatHeroes"
            :key="h.id"
            class="flex flex-col items-center gap-1 w-14"
          >
            <div
              class="w-10 h-10 rounded-md overflow-hidden border-2 border-red-500/70 bg-slate-base"
            >
              <img
                v-if="portraitUrl(h) && !failedImgs.has(h.id)"
                :src="portraitUrl(h) ?? ''"
                :alt="h.name"
                loading="lazy"
                class="w-full h-full object-cover"
                @error="onImgError(h.id)"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-xs font-bold bg-red-900/40 text-slate-100"
              >
                {{ h.name.slice(0, 2).toUpperCase() }}
              </div>
            </div>
            <div
              class="text-[10px] text-slate-300 text-center truncate w-full"
              :title="h.name"
            >
              {{ h.name }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
