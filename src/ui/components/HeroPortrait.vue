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
  tank: 'border-blue-500',
  dps: 'border-red-500',
  support: 'border-green-500',
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
    class="group relative w-12 h-12 rounded-md overflow-hidden border-2 transition-transform"
    :class="[
      roleBorder[hero.role],
      disabled
        ? 'opacity-40 pointer-events-none'
        : 'hover:scale-105 hover:ring-2 hover:ring-ow-orange focus:outline-none focus:ring-2 focus:ring-ow-orange',
      selected ? 'ring-2 ring-ow-orange' : '',
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
      class="w-full h-full flex items-center justify-center text-[11px] font-semibold text-slate-100"
      :class="roleBg[hero.role]"
    >
      {{ initials }}
    </div>

    <span
      v-if="selected"
      class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-ow-orange text-slate-900 text-[10px] font-bold flex items-center justify-center shadow"
      aria-hidden="true"
    >
      &check;
    </span>
  </button>
</template>
