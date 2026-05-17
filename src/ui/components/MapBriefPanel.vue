<script setup lang="ts">
import { computed } from 'vue';
import type {
  Archetype,
  Hero,
  MapDef,
  MapMode,
  MapOverrideBlock,
  Side,
} from '../../domain/types';

const props = defineProps<{
  map: MapDef | null;
  side: Side | null;
  heroesById: Map<string, Hero>;
}>();

const MODE_LABELS: Record<MapMode, string> = {
  control: 'Control',
  escort: 'Escort',
  hybrid: 'Hybrid',
  push: 'Push',
  flashpoint: 'Flashpoint',
  clash: 'Clash',
};

const SIDE_LABELS: Record<Side, string> = {
  attack: 'Attack',
  defense: 'Defense',
};

const ARCH_ORDER: Archetype[] = ['brawl', 'dive', 'poke'];
const ARCH_LABEL: Record<Archetype, string> = {
  brawl: 'Brawl',
  dive: 'Dive',
  poke: 'Poke',
};
const ARCH_BAR: Record<Archetype, string> = {
  brawl: 'bg-red-500',
  dive: 'bg-ow-orange',
  poke: 'bg-sky-400',
};

const baseBlock = computed<MapOverrideBlock | undefined>(
  () => props.map?.overrides,
);

const sideBlock = computed<MapOverrideBlock | undefined>(() =>
  props.side ? props.map?.overrides?.bySide?.[props.side] : undefined,
);

// scoring.ts semantics: archetypePref REPLACES whole map-level block when defined on side.
const archetypePref = computed<Partial<Record<Archetype, number>>>(() => {
  const sidePref = sideBlock.value?.archetypePref;
  if (sidePref) return sidePref;
  return baseBlock.value?.archetypePref ?? {};
});

const baseArchetypePref = computed<Partial<Record<Archetype, number>>>(
  () => baseBlock.value?.archetypePref ?? {},
);

const archFromSide = computed(() => Boolean(sideBlock.value?.archetypePref));

interface ArchRow {
  key: Archetype;
  label: string;
  value: number;
  baseValue: number;
  shifted: boolean;
}

const archRows = computed<ArchRow[]>(() => {
  const eff = archetypePref.value;
  const base = baseArchetypePref.value;
  const keys = new Set<Archetype>();
  for (const k of ARCH_ORDER) {
    if (eff[k] !== undefined || base[k] !== undefined) keys.add(k);
  }
  return ARCH_ORDER.filter((k) => keys.has(k)).map((k) => {
    const value = eff[k] ?? 0;
    const baseValue = base[k] ?? 0;
    return {
      key: k,
      label: ARCH_LABEL[k],
      value,
      baseValue,
      shifted: archFromSide.value && value !== baseValue,
    };
  });
});

const headline = computed<string | null>(() => {
  if (archRows.value.length === 0) return null;
  const sorted = [...archRows.value].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const worst = sorted[sorted.length - 1];
  if (top.value >= 0.5) return `${top.label}-favored`;
  if (top.value >= 0.25) return `${top.label}-leaning`;
  if (worst.value <= -0.4) return `Avoid ${worst.label.toLowerCase()}`;
  return 'Balanced';
});

interface MatchupRow {
  key: string;
  my: string;
  enemy: string;
  value: number;
  fromSide: boolean;
}

const matchupRows = computed<MatchupRow[]>(() => {
  const base = baseBlock.value?.matchups ?? {};
  const sideM = sideBlock.value?.matchups ?? {};
  const all = new Map<string, { value: number; fromSide: boolean }>();
  for (const [k, v] of Object.entries(base)) {
    all.set(k, { value: v, fromSide: false });
  }
  for (const [k, v] of Object.entries(sideM)) {
    all.set(k, { value: v, fromSide: true });
  }
  const out: MatchupRow[] = [];
  for (const [k, { value, fromSide }] of all) {
    const [my, enemy] = k.split(':');
    out.push({ key: k, my, enemy, value, fromSide });
  }
  out.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  return out;
});

interface AntiRow {
  key: string;
  a: string;
  b: string;
  value: number;
  fromSide: boolean;
}

const antiRows = computed<AntiRow[]>(() => {
  const base = baseBlock.value?.antiSynergy ?? {};
  const sideA = sideBlock.value?.antiSynergy ?? {};
  const all = new Map<string, { value: number; fromSide: boolean }>();
  for (const [k, v] of Object.entries(base)) {
    all.set(k, { value: v, fromSide: false });
  }
  for (const [k, v] of Object.entries(sideA)) {
    all.set(k, { value: v, fromSide: true });
  }
  const out: AntiRow[] = [];
  for (const [k, { value, fromSide }] of all) {
    const [a, b] = k.split(':');
    out.push({ key: k, a, b, value, fromSide });
  }
  return out;
});

const hasAnyContent = computed(
  () =>
    archRows.value.length > 0 ||
    matchupRows.value.length > 0 ||
    antiRows.value.length > 0,
);

const modeLabel = computed(() =>
  props.map ? MODE_LABELS[props.map.mode] : '',
);
const sideLabel = computed(() => (props.side ? SIDE_LABELS[props.side] : ''));

function heroName(id: string): string {
  return props.heroesById.get(id)?.name ?? id;
}

function fmt(v: number): string {
  if (v === 0) return '0';
  const str = v.toFixed(1).replace(/\.0$/, '');
  return v > 0 ? `+${str}` : str;
}

function barWidth(v: number): string {
  return `${Math.min(1, Math.abs(v)) * 50}%`;
}
</script>

<template>
  <div v-if="map" class="flex flex-col gap-4">
    <div class="flex items-start justify-between gap-3">
      <div class="flex flex-col min-w-0">
        <h2 class="panel-title">Map Brief</h2>
        <div class="text-sm font-semibold text-slate-100 mt-1 truncate">
          {{ map.name }}
        </div>
        <div class="text-[11px] text-slate-400">
          {{ modeLabel }}<template v-if="sideLabel"> · {{ sideLabel }}</template>
        </div>
      </div>
      <span
        v-if="headline"
        class="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ow-orange whitespace-nowrap mt-1 flex-shrink-0"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-ow-orange" aria-hidden="true" />
        {{ headline }}
      </span>
    </div>

    <p v-if="!hasAnyContent" class="text-xs text-slate-500 italic">
      No map-specific bias defined.
    </p>

    <div v-if="archRows.length > 0" class="flex flex-col gap-1.5">
      <div class="flex items-center justify-between">
        <span class="panel-title">Archetype bias</span>
        <span
          v-if="archFromSide"
          class="text-[9px] uppercase tracking-wider text-ow-orange/80"
          :title="`Side-specific bias active (${sideLabel})`"
        >
          Side bias
        </span>
      </div>
      <div class="flex flex-col gap-1.5">
        <div
          v-for="r in archRows"
          :key="r.key"
          class="flex items-center gap-2 text-[11px]"
        >
          <span class="w-10 text-slate-300 flex-shrink-0">{{ r.label }}</span>
          <div class="flex-1 h-2 rounded bg-slate-800/60 relative overflow-hidden">
            <div
              class="absolute top-0 bottom-0 left-1/2 w-px bg-slate-600/70"
              aria-hidden="true"
            />
            <div
              v-if="r.value > 0"
              class="absolute top-0 bottom-0 left-1/2 transition-[width]"
              :class="ARCH_BAR[r.key]"
              :style="{ width: barWidth(r.value) }"
            />
            <div
              v-else-if="r.value < 0"
              class="absolute top-0 bottom-0 right-1/2 transition-[width] bg-red-500/60"
              :style="{ width: barWidth(r.value) }"
            />
          </div>
          <span
            class="w-9 text-right tabular-nums font-medium"
            :class="
              r.value > 0
                ? 'text-emerald-300'
                : r.value < 0
                ? 'text-red-300'
                : 'text-slate-500'
            "
          >{{ fmt(r.value) }}</span>
          <span
            v-if="r.shifted"
            class="w-12 text-[9px] uppercase tracking-wider text-slate-500 text-right"
            :title="`Map baseline: ${fmt(r.baseValue)}`"
          >vs {{ fmt(r.baseValue) }}</span>
          <span v-else class="w-12" aria-hidden="true" />
        </div>
      </div>
    </div>

    <div v-if="matchupRows.length > 0" class="flex flex-col gap-1.5">
      <div class="panel-title">Matchup tweaks ({{ matchupRows.length }})</div>
      <ul class="flex flex-col gap-1 text-[11px] text-slate-300">
        <li
          v-for="m in matchupRows"
          :key="m.key"
          class="flex items-center gap-2"
        >
          <span class="flex-1 min-w-0 truncate">
            <span class="text-slate-100">{{ heroName(m.my) }}</span>
            <span class="text-slate-500"> vs </span>
            <span class="text-slate-100">{{ heroName(m.enemy) }}</span>
          </span>
          <span
            v-if="m.fromSide"
            class="text-[9px] uppercase tracking-wider text-ow-orange/70"
            :title="`Only on ${sideLabel}`"
          >Side</span>
          <span
            class="tabular-nums font-semibold w-8 text-right"
            :class="
              m.value > 0
                ? 'text-emerald-300'
                : m.value < 0
                ? 'text-red-300'
                : 'text-slate-400'
            "
          >{{ fmt(m.value) }}</span>
        </li>
      </ul>
    </div>

    <div v-if="antiRows.length > 0" class="flex flex-col gap-1.5">
      <div class="panel-title">Anti-synergy</div>
      <ul class="flex flex-col gap-1 text-[11px] text-slate-300">
        <li
          v-for="a in antiRows"
          :key="a.key"
          class="flex items-center gap-2"
        >
          <span class="flex-1 truncate">
            <span class="text-slate-100">{{ heroName(a.a) }}</span>
            <span class="text-slate-500"> + </span>
            <span class="text-slate-100">{{ heroName(a.b) }}</span>
          </span>
          <span
            v-if="a.fromSide"
            class="text-[9px] uppercase tracking-wider text-ow-orange/70"
          >Side</span>
          <span
            class="text-[10px] uppercase tracking-wider font-semibold"
            :class="a.value === 0 ? 'text-emerald-300' : 'text-amber-300'"
          >
            {{ a.value === 0 ? 'Waived' : fmt(a.value) }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>
