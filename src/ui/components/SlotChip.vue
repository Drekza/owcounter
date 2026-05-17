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
  () => {
    imgFailed.value = false;
  },
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
  tank: 'border-role-tank/80',
  dps: 'border-role-dps/80',
  support: 'border-role-support/80',
};
const roleGlow: Record<Role, string> = {
  tank: 'shadow-[0_0_18px_-6px_rgba(59,130,246,0.6)]',
  dps: 'shadow-[0_0_18px_-6px_rgba(239,68,68,0.6)]',
  support: 'shadow-[0_0_18px_-6px_rgba(34,197,94,0.55)]',
};
const roleTint: Record<Role, string> = {
  tank: 'from-blue-500/10 to-slate-900/40 text-blue-300',
  dps: 'from-red-500/10 to-slate-900/40 text-red-300',
  support: 'from-green-500/10 to-slate-900/40 text-green-300',
};

const initials = computed(() => props.hero?.name.slice(0, 2).toUpperCase() ?? '');

function handleClick() {
  if (props.hero) emit('clear');
}
</script>

<template>
  <div
    class="w-16 h-16 rounded-lg border-2 relative flex flex-col items-center justify-center text-center overflow-hidden transition-all group"
    :class="[
      roleBorder[role],
      hero
        ? `bg-slate-panel cursor-pointer ${roleGlow[role]} hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ow-orange`
        : `border-dashed bg-gradient-to-b ${roleTint[role]}`,
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
        class="absolute inset-x-0 bottom-0 bg-slate-900/80 text-[10px] py-0.5 px-1 truncate text-slate-100 font-medium"
      >
        {{ hero.name }}
      </span>
      <button
        type="button"
        class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 border border-slate-600 text-slate-300 hover:bg-red-600 hover:text-white hover:border-red-500 text-xs leading-none flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ow-orange transition"
        :aria-label="`Clear ${hero.name}`"
        @click.stop="emit('clear')"
      >&times;</button>
    </template>
    <template v-else>
      <span class="text-lg font-bold leading-none opacity-80">{{ ROLE_ABBR[role] }}</span>
      <span
        class="text-[8.5px] uppercase tracking-[0.18em] opacity-70 mt-0.5 font-semibold"
      >
        {{ ROLE_LABEL[role] }}
      </span>
    </template>
  </div>
</template>
