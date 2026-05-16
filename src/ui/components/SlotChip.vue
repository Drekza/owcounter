<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Hero, Role } from '../../domain/types';

const props = defineProps<{
  role: Role;
  hero: Hero | null;
  flash?: boolean;
}>();

const emit = defineEmits<{ (e: 'clear'): void }>();

const imgFailed = ref(false);
watch(
  () => props.hero?.id,
  () => { imgFailed.value = false; },
);

const portraitUrl = computed(() => {
  const path = props.hero?.portrait;
  if (!path) return null;
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  return base + (path.startsWith('/') ? path : '/' + path);
});

const ROLE_LABEL: Record<Role, string> = {
  tank: 'TANK',
  dps: 'DPS',
  support: 'SUPPORT',
};
const ROLE_ABBR: Record<Role, string> = { tank: 'T', dps: 'D', support: 'S' };
const roleBorder: Record<Role, string> = {
  tank: 'border-blue-500',
  dps: 'border-red-500',
  support: 'border-green-500',
};

const initials = computed(() => props.hero?.name.slice(0, 2).toUpperCase() ?? '');

function handleClick() {
  if (props.hero) emit('clear');
}
</script>

<template>
  <div
    class="aspect-square rounded-md border-2 relative flex flex-col items-center justify-center text-center overflow-hidden transition-all"
    :class="[
      roleBorder[role],
      hero
        ? 'bg-slate-panel cursor-pointer hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ow-orange'
        : 'border-dashed bg-slate-base/50 text-slate-500',
      flash ? 'animate-pulse ring-2 ring-ow-orange' : '',
    ]"
    :title="hero ? `Clear ${hero.name}` : ROLE_LABEL[role]"
    role="button"
    :tabindex="hero ? 0 : -1"
    :aria-label="hero ? `${hero.name} — click to clear` : `Empty ${ROLE_LABEL[role]} slot`"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <template v-if="hero">
      <img
        v-if="portraitUrl && !imgFailed"
        :src="portraitUrl"
        :alt="hero.name"
        loading="lazy"
        class="absolute inset-0 w-full h-full object-cover"
        @error="imgFailed = true"
      />
      <div
        v-else
        class="absolute inset-0 flex items-center justify-center text-base font-semibold text-slate-100 bg-slate-panel"
      >
        {{ initials }}
      </div>
      <span
        class="absolute inset-x-0 bottom-0 bg-slate-900/75 text-[10px] py-0.5 px-1 truncate text-slate-100"
      >
        {{ hero.name }}
      </span>
      <button
        type="button"
        class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 border border-slate-600 text-slate-300 hover:bg-red-600 hover:text-white text-xs leading-none flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ow-orange"
        :aria-label="`Clear ${hero.name}`"
        @click.stop="emit('clear')"
      >&times;</button>
    </template>
    <template v-else>
      <span class="text-xl font-bold opacity-60">{{ ROLE_ABBR[role] }}</span>
      <span class="text-[10px] uppercase tracking-wider opacity-60 mt-0.5">
        {{ ROLE_LABEL[role] }}
      </span>
    </template>
  </div>
</template>
