<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Hero, Role, Suggestion, TermKind } from '../../domain/types';
import type { Reasoning } from '../../domain/reasoning';

const props = defineProps<{
  rank: number;
  suggestion: Suggestion;
  heroesById: Map<string, Hero>;
  reasoning: Reasoning;
  lockedIds?: Set<string>;
}>();

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

function toggle() {
  expanded.value = !expanded.value;
}

const roleBorder: Record<Role, string> = {
  tank: 'border-blue-500',
  dps: 'border-red-500',
  support: 'border-green-500',
};
const roleBg: Record<Role, string> = {
  tank: 'bg-blue-900/40',
  dps: 'bg-red-900/40',
  support: 'bg-green-900/40',
};

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
    class="panel border-slate-700/60 overflow-hidden"
    :aria-label="`Suggested comp ${rank}, score ${scoreLabel}`"
  >
    <button
      type="button"
      class="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-700/30 focus:outline-none focus:ring-2 focus:ring-ow-orange"
      :aria-expanded="expanded"
      @click="toggle"
    >
      <span class="text-sm font-semibold text-slate-100">Comp #{{ rank }}</span>
      <span class="text-xs text-slate-400">Score</span>
      <span class="text-base font-bold text-ow-orange tabular-nums">{{ scoreLabel }}</span>

      <span
        v-if="suggestion.weak"
        class="ml-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-red-600/80 text-white"
      >
        Weak counter
      </span>

      <span class="ml-auto flex items-center text-slate-400">
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

    <div class="px-4 pb-3 flex gap-2" aria-label="Comp roster">
      <div
        v-for="(s, i) in slots"
        :key="i"
        class="w-12 h-12 rounded-md overflow-hidden border-2 bg-slate-base relative"
        :class="[
          roleBorder[s.role],
          s.locked ? 'ring-2 ring-ow-orange ring-offset-2 ring-offset-slate-panel' : '',
        ]"
        :title="s.hero ? `${s.hero.name}${s.locked ? ' (locked)' : ''}` : ''"
      >
        <span
          v-if="s.locked"
          class="absolute top-0.5 right-0.5 z-10 inline-flex items-center justify-center w-4 h-4 rounded-full bg-ow-orange text-slate-900 text-[9px] font-bold leading-none"
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
    </div>

    <div
      v-show="expanded"
      class="px-4 pb-4 border-t border-slate-700/50 pt-3 flex flex-col gap-3"
    >
      <div>
        <div class="panel-title text-[11px] mb-1.5">Strong points</div>
        <ul
          v-if="reasoning.strong.length"
          class="flex flex-col gap-1 text-xs text-slate-100"
        >
          <li
            v-for="(label, i) in reasoning.strong"
            :key="`s-${i}`"
            class="flex items-start gap-2"
          >
            <svg
              class="w-3.5 h-3.5 mt-0.5 text-green-400 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7A1 1 0 014.7 8.3l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
                clip-rule="evenodd"
              />
            </svg>
            <span v-if="isArchetype(label)" class="flex items-start gap-1.5">
              <svg
                class="w-3.5 h-3.5 mt-0.5 text-ow-orange flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                :title="'Archetype'"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-11.5a.5.5 0 01.3.7l-2.2 5a1 1 0 01-.5.5l-5 2.2a.5.5 0 01-.7-.7l2.2-5a1 1 0 01.5-.5l5-2.2a.5.5 0 01.4 0zM10 11a1 1 0 100-2 1 1 0 000 2z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>{{ label }}</span>
            </span>
            <span v-else>{{ label }}</span>
          </li>
        </ul>
        <p v-else class="text-xs text-slate-500 italic">—</p>
      </div>

      <div>
        <div class="panel-title text-[11px] mb-1.5">Weak points</div>
        <ul
          v-if="reasoning.weak.length"
          class="flex flex-col gap-1 text-xs text-slate-300"
        >
          <li
            v-for="(label, i) in reasoning.weak"
            :key="`w-${i}`"
            class="flex items-start gap-2"
          >
            <svg
              class="w-3.5 h-3.5 mt-0.5 text-red-400 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M4.3 4.3a1 1 0 011.4 0L10 8.6l4.3-4.3a1 1 0 111.4 1.4L11.4 10l4.3 4.3a1 1 0 11-1.4 1.4L10 11.4l-4.3 4.3a1 1 0 11-1.4-1.4L8.6 10 4.3 5.7a1 1 0 010-1.4z"
                clip-rule="evenodd"
              />
            </svg>
            <span v-if="isArchetype(label)" class="flex items-start gap-1.5">
              <svg
                class="w-3.5 h-3.5 mt-0.5 text-ow-orange flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                :title="'Archetype'"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-11.5a.5.5 0 01.3.7l-2.2 5a1 1 0 01-.5.5l-5 2.2a.5.5 0 01-.7-.7l2.2-5a1 1 0 01.5-.5l5-2.2a.5.5 0 01.4 0zM10 11a1 1 0 100-2 1 1 0 000 2z"
                  clip-rule="evenodd"
                />
              </svg>
              <span>{{ label }}</span>
            </span>
            <span v-else>{{ label }}</span>
          </li>
        </ul>
        <p v-else class="text-xs text-slate-500 italic">—</p>
      </div>
    </div>
  </article>
</template>
