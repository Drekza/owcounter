<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Archetype, Hero, Role, Suggestion, TermKind } from '../../domain/types';
import type { Reasoning } from '../../domain/reasoning';
import { compArchetypeProfile } from '../../domain/archetypes';

const props = defineProps<{
  rank: number;
  suggestion: Suggestion;
  heroesById: Map<string, Hero>;
  reasoning: Reasoning;
  lockedIds?: Set<string>;
  maxScore?: number;
}>();

const ARCHETYPE_LABEL: Record<Archetype, string> = {
  dive: 'Dive',
  brawl: 'Brawl',
  poke: 'Poke',
};

interface ArchRow {
  key: Archetype;
  label: string;
  pct: number;
  dominant: boolean;
}

const archetypeRows = computed<ArchRow[]>(() => {
  const profile = compArchetypeProfile(props.suggestion.comp, props.heroesById);
  const dive = Math.round((profile.dive ?? 0) * 100);
  const brawl = Math.round((profile.brawl ?? 0) * 100);
  const poke = Math.max(0, 100 - dive - brawl);
  const raw: { key: Archetype; label: string; pct: number }[] = [
    { key: 'dive', label: ARCHETYPE_LABEL.dive, pct: dive },
    { key: 'brawl', label: ARCHETYPE_LABEL.brawl, pct: brawl },
    { key: 'poke', label: ARCHETYPE_LABEL.poke, pct: poke },
  ];
  const max = Math.max(dive, brawl, poke);
  return raw.map((r) => ({ ...r, dominant: r.pct === max && max > 0 }));
});

const dominantLabel = computed(() => {
  const top = archetypeRows.value.find((r) => r.dominant);
  return top ? top.label : '—';
});

const expanded = ref(props.rank === 1);

interface Slot {
  role: Role;
  hero: Hero | null;
  locked: boolean;
}

const slots = computed<Slot[]>(() => {
  const c = props.suggestion.comp;
  const locked = props.lockedIds;
  const ids: Array<[Role, string]> = [
    ['tank', c.tank],
    ['dps', c.dps[0]],
    ['dps', c.dps[1]],
    ['support', c.support[0]],
    ['support', c.support[1]],
  ];
  return ids.map(([role, id]) => ({
    role,
    hero: props.heroesById.get(id) ?? null,
    locked: locked ? locked.has(id) : false,
  }));
});

const scoreLabel = computed(() => props.suggestion.score.toFixed(1));

const scorePct = computed(() => {
  const cap = props.maxScore && props.maxScore > 0 ? props.maxScore : 1;
  const raw = props.suggestion.score / cap;
  return Math.max(0, Math.min(1, raw)) * 100;
});

const kindByLabel = computed<Map<string, TermKind>>(() => {
  const m = new Map<string, TermKind>();
  for (const t of props.suggestion.breakdown) {
    if (!m.has(t.label)) m.set(t.label, t.kind);
  }
  return m;
});

function isArchetype(label: string): boolean {
  return kindByLabel.value.get(label) === 'archetype';
}

function isSynergy(label: string): boolean {
  const k = kindByLabel.value.get(label);
  return k === 'synergy' || k === 'antiSyn';
}

function toggle() {
  expanded.value = !expanded.value;
}

const roleBorder: Record<Role, string> = {
  tank: 'border-role-tank/80',
  dps: 'border-role-dps/80',
  support: 'border-role-support/80',
};
const roleBg: Record<Role, string> = {
  tank: 'bg-blue-900/40',
  dps: 'bg-red-900/40',
  support: 'bg-green-900/40',
};

const rankStyle = computed(() => {
  if (props.rank === 1)
    return 'bg-ow-orange text-slate-900 shadow-glow-orange';
  if (props.rank === 2)
    return 'bg-slate-300 text-slate-900';
  if (props.rank === 3)
    return 'bg-amber-700 text-amber-50';
  return 'bg-slate-700/80 text-slate-300 border border-slate-600/60';
});

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
  <article
    class="rounded-xl border border-slate-700/60 bg-slate-panel/85 backdrop-blur-sm overflow-hidden transition-colors"
    :class="
      suggestion.weak
        ? 'border-l-4 border-l-red-500/60'
        : rank === 1
        ? 'border-ow-orange/40 shadow-glow-orange'
        : ''
    "
    :aria-label="`Suggested comp ${rank}, score ${scoreLabel}`"
  >
    <button
      type="button"
      class="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-700/20 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ow-orange"
      :aria-expanded="expanded"
      @click="toggle"
    >
      <span
        class="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold tabular-nums flex-shrink-0"
        :class="rankStyle"
        :aria-label="`Rank ${rank}`"
      >
        {{ rank }}
      </span>

      <div class="flex flex-col flex-1 min-w-0 gap-1">
        <div class="flex items-center gap-2 text-[11px] text-slate-400">
          <span class="uppercase tracking-wider">Score</span>
          <span class="text-base font-bold text-ow-orange tabular-nums leading-none">
            {{ scoreLabel }}
          </span>
          <span
            v-if="suggestion.weak"
            class="ml-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide rounded bg-red-600/80 text-white"
          >
            Weak
          </span>
        </div>
        <div
          class="h-1 rounded-full bg-slate-800 overflow-hidden"
          aria-hidden="true"
        >
          <div
            class="h-full transition-[width] duration-200"
            :class="rank === 1 ? 'bg-ow-orange' : 'bg-ow-orange/60'"
            :style="{ width: `${scorePct}%` }"
          />
        </div>
      </div>

      <span class="ml-1 flex items-center text-slate-400 flex-shrink-0">
        <svg
          class="w-4 h-4 transition-transform duration-150"
          :class="expanded ? 'rotate-180' : ''"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clip-rule="evenodd"
          />
        </svg>
      </span>
    </button>

    <div class="px-3 pb-2 flex gap-1.5" aria-label="Comp roster">
      <div
        v-for="(s, i) in slots"
        :key="i"
        class="flex flex-col items-center gap-1 flex-1 min-w-0"
      >
        <div
          class="w-full aspect-square rounded-md overflow-hidden border-2 bg-slate-quiet relative"
          :class="[
            roleBorder[s.role],
            s.locked ? 'ring-2 ring-ow-orange ring-offset-1 ring-offset-slate-panel' : '',
          ]"
          :title="s.hero ? `${s.hero.name}${s.locked ? ' (locked)' : ''}` : ''"
        >
          <span
            v-if="s.locked"
            class="absolute top-0.5 right-0.5 z-10 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-ow-orange text-slate-900 text-[8px] font-bold leading-none"
            aria-label="Locked pick"
            title="Locked pick"
          >L</span>
          <template v-if="s.hero">
            <img
              v-if="portraitUrl(s.hero) && !failedImgs.has(s.hero.id)"
              :src="portraitUrl(s.hero) ?? ''"
              :alt="s.hero.name"
              loading="lazy"
              class="w-full h-full object-cover"
              @error="onImgError(s.hero.id)"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-[11px] font-semibold text-slate-100"
              :class="roleBg[s.role]"
            >
              {{ s.hero.name.slice(0, 2).toUpperCase() }}
            </div>
          </template>
        </div>
        <span
          class="text-[9.5px] text-slate-300 text-center truncate w-full leading-none"
          :title="s.hero?.name ?? ''"
        >
          {{ s.hero?.name ?? '' }}
        </span>
      </div>
    </div>

    <div
      class="px-3 pb-3 flex items-center gap-2 text-[10px] flex-wrap"
      aria-label="Comp archetype"
    >
      <span class="uppercase tracking-wider text-slate-500">Archetype</span>
      <span class="text-ow-orange font-semibold">{{ dominantLabel }}</span>
      <span class="text-slate-600">·</span>
      <template v-for="(r, i) in archetypeRows" :key="r.key">
        <span :class="r.dominant ? 'text-slate-100 font-semibold' : 'text-slate-400'">
          {{ r.label }} {{ r.pct }}%
        </span>
        <span
          v-if="i < archetypeRows.length - 1"
          class="text-slate-700"
          aria-hidden="true"
        >·</span>
      </template>
    </div>

    <div
      v-show="expanded"
      class="px-3 pb-3 border-t border-slate-700/50 pt-3 flex flex-col gap-3"
    >
      <div>
        <div class="panel-title mb-1.5">Strong points</div>
        <ul
          v-if="reasoning.strong.length"
          class="flex flex-col gap-1 text-xs"
        >
          <li
            v-for="(label, i) in reasoning.strong"
            :key="`s-${i}`"
            class="flex items-start gap-2"
          >
            <span
              class="mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold leading-none flex-shrink-0"
              aria-hidden="true"
            >+</span>
            <span
              class="leading-snug"
              :class="
                isArchetype(label)
                  ? 'text-amber-200'
                  : isSynergy(label)
                  ? 'text-sky-200'
                  : 'text-slate-100'
              "
            >{{ label }}</span>
          </li>
        </ul>
        <p v-else class="text-xs text-slate-500 italic">—</p>
      </div>

      <div>
        <div class="panel-title mb-1.5">Weak points</div>
        <ul
          v-if="reasoning.weak.length"
          class="flex flex-col gap-1 text-xs"
        >
          <li
            v-for="(label, i) in reasoning.weak"
            :key="`w-${i}`"
            class="flex items-start gap-2"
          >
            <span
              class="mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500/15 text-red-300 text-[10px] font-bold leading-none flex-shrink-0"
              aria-hidden="true"
            >−</span>
            <span
              class="leading-snug"
              :class="
                isArchetype(label)
                  ? 'text-amber-200/90'
                  : isSynergy(label)
                  ? 'text-sky-200/90'
                  : 'text-slate-300'
              "
            >{{ label }}</span>
          </li>
        </ul>
        <p v-else class="text-xs text-slate-500 italic">—</p>
      </div>
    </div>
  </article>
</template>
