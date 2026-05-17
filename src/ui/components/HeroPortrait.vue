<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Hero, Role } from '../../domain/types';

const props = defineProps<{
  hero: Hero;
  disabled?: boolean;
  selected?: boolean;
}>();

const emit = defineEmits<{ (e: 'pick', id: string): void }>();

const imgFailed = ref(false);

const portraitUrl = computed(() => {
  const path = props.hero.portrait;
  if (!path) return null;
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  const rel = path.startsWith('/') ? path : '/' + path;
  return base + rel;
});

const initials = computed(() => props.hero.name.slice(0, 2).toUpperCase());

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

function onClick() {
  if (props.disabled) return;
  emit('pick', props.hero.id);
}
</script>

<template>
  <button
    type="button"
    :title="hero.name"
    :aria-label="hero.name"
    :aria-pressed="selected || false"
    :disabled="disabled"
    class="group relative w-20 h-20 rounded-md overflow-hidden border-2 transition-all duration-150"
    :class="[
      roleBorder[hero.role],
      disabled
        ? 'opacity-40 grayscale pointer-events-none'
        : 'hover:scale-[1.06] hover:ring-2 hover:ring-ow-orange hover:z-10 hover:shadow-glow-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-ow-orange',
      selected ? 'ring-2 ring-ow-orange shadow-glow-orange' : '',
    ]"
    @click="onClick"
  >
    <img
      v-if="portraitUrl && !imgFailed"
      :src="portraitUrl"
      :alt="hero.name"
      loading="lazy"
      class="w-full h-full object-cover"
      @error="imgFailed = true"
    />
    <div
      v-else
      class="w-full h-full flex items-center justify-center text-base font-semibold text-slate-100"
      :class="roleBg[hero.role]"
    >
      {{ initials }}
    </div>

    <span
      class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent text-[10px] py-1 px-1.5 text-slate-100 font-medium text-center truncate opacity-0 group-hover:opacity-100 transition-opacity"
    >
      {{ hero.name }}
    </span>

    <span
      v-if="selected"
      class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-ow-orange text-slate-900 text-xs font-bold flex items-center justify-center shadow"
      aria-hidden="true"
    >
      &check;
    </span>
  </button>
</template>
