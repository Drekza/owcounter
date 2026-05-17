<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ArchVec, Archetype, Comp, Hero, Role } from '../../domain/types';

const props = defineProps<{
  enemy: Comp;
  archetypeProfile: ArchVec;
  keyThreats: string[];
  heroesById: Map<string, Hero>;
}>();

const ROSTER_SLOTS: Role[] = ['tank', 'dps', 'dps', 'support', 'support'];

const roleBorder: Record<Role, string> = {
  tank: 'border-role-tank/70',
  dps: 'border-role-dps/70',
  support: 'border-role-support/70',
};
const roleBg: Record<Role, string> = {
  tank: 'bg-blue-900/40',
  dps: 'bg-red-900/40',
  support: 'bg-green-900/40',
};

const rosterHeroes = computed<(Hero | null)[]>(() => {
  const ids = [
    props.enemy.tank,
    props.enemy.dps[0],
    props.enemy.dps[1],
    props.enemy.support[0],
    props.enemy.support[1],
  ];
  return ids.map((id) => (id ? props.heroesById.get(id) ?? null : null));
});

const isComplete = computed(() =>
  rosterHeroes.value.every((h) => h !== null),
);

interface BarSeg {
  key: Archetype;
  label: string;
  pct: number;
  colorClass: string;
}

const segments = computed<BarSeg[]>(() => {
  if (!isComplete.value) return [];
  const dive = Math.round((props.archetypeProfile.dive ?? 0) * 100);
  const brawl = Math.round((props.archetypeProfile.brawl ?? 0) * 100);
  const poke = Math.max(0, 100 - dive - brawl);
  return [
    { key: 'dive', label: 'Dive', pct: dive, colorClass: 'bg-ow-orange' },
    { key: 'brawl', label: 'Brawl', pct: brawl, colorClass: 'bg-red-500' },
    { key: 'poke', label: 'Poke', pct: poke, colorClass: 'bg-sky-400' },
  ];
});

const dominant = computed<BarSeg | null>(() => {
  if (segments.value.length === 0) return null;
  return [...segments.value].sort((a, b) => b.pct - a.pct)[0];
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
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h2 class="panel-title">Enemy Comp</h2>
      <span
        v-if="isComplete && dominant"
        class="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-300"
      >
        <span
          class="w-1.5 h-1.5 rounded-full"
          :class="dominant.colorClass"
          aria-hidden="true"
        />
        {{ dominant.label }}-leaning
      </span>
    </div>

    <div class="flex gap-1.5" aria-label="Enemy roster">
      <div
        v-for="(h, i) in rosterHeroes"
        :key="i"
        class="w-12 h-12 rounded-md overflow-hidden border-2 bg-slate-quiet relative"
        :class="[
          roleBorder[ROSTER_SLOTS[i]],
          h ? '' : 'border-dashed opacity-50',
        ]"
        :title="h ? h.name : `${ROSTER_SLOTS[i].toUpperCase()} (empty)`"
      >
        <template v-if="h">
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
            class="w-full h-full flex items-center justify-center text-xs font-semibold"
            :class="roleBg[ROSTER_SLOTS[i]]"
          >
            {{ h.name.slice(0, 2).toUpperCase() }}
          </div>
        </template>
        <div
          v-else
          class="w-full h-full flex items-center justify-center text-[10px] font-semibold text-slate-500"
        >
          {{ ROSTER_SLOTS[i].slice(0, 1).toUpperCase() }}
        </div>
      </div>
    </div>

    <p v-if="!isComplete" class="text-xs text-slate-500 italic">
      Pick all 5 enemy heroes to see archetype analysis and key threats.
    </p>

    <template v-else>
      <div class="flex flex-col gap-2" aria-label="Archetype profile">
        <div
          class="flex h-2.5 w-full rounded-full overflow-hidden bg-slate-800/70"
          role="img"
          aria-label="Archetype distribution bar"
        >
          <div
            v-for="s in segments"
            :key="s.key"
            class="h-full transition-[width] duration-200"
            :class="s.colorClass"
            :style="{ width: `${s.pct}%` }"
            :title="`${s.label} ${s.pct}%`"
          />
        </div>
        <div class="flex items-center gap-3 text-[11px]">
          <div
            v-for="s in segments"
            :key="s.key"
            class="inline-flex items-center gap-1.5"
            :class="
              dominant && dominant.key === s.key
                ? 'text-slate-100 font-semibold'
                : 'text-slate-400'
            "
          >
            <span
              class="w-2 h-2 rounded-full"
              :class="s.colorClass"
              aria-hidden="true"
            />
            <span>{{ s.label }}</span>
            <span class="tabular-nums">{{ s.pct }}%</span>
          </div>
        </div>
      </div>

      <div>
        <div class="panel-title mb-2">Key threats</div>
        <div
          v-if="threatHeroes.length === 0"
          class="text-xs text-slate-500 italic"
        >
          —
        </div>
        <div v-else class="flex gap-2.5 flex-wrap">
          <div
            v-for="h in threatHeroes"
            :key="h.id"
            class="flex flex-col items-center gap-1 w-14"
          >
            <div
              class="w-11 h-11 rounded-md overflow-hidden border-2 border-red-500/70 bg-slate-quiet shadow-[0_0_14px_-4px_rgba(239,68,68,0.6)]"
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
