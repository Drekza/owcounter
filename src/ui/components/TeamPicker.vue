<script lang="ts">
export interface TeamState {
  tank: string | null;
  dps: [string | null, string | null];
  support: [string | null, string | null];
}

export const EMPTY_TEAM: TeamState = {
  tank: null,
  dps: [null, null],
  support: [null, null],
};
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import type { Hero, Role } from '../../domain/types';
import HeroGrid from './HeroGrid.vue';
import SlotChip from './SlotChip.vue';

const props = defineProps<{
  heroes: Hero[];
  bans: string[];
  label: string;
  modelValue: TeamState;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: TeamState): void;
}>();

const heroById = computed(() => new Map(props.heroes.map((h) => [h.id, h])));

const flashRole = ref<Role | null>(null);
let flashTimer: ReturnType<typeof setTimeout> | null = null;
onBeforeUnmount(() => {
  if (flashTimer !== null) clearTimeout(flashTimer);
});

function flash(role: Role) {
  flashRole.value = role;
  if (flashTimer !== null) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => {
    flashRole.value = null;
  }, 600);
}

function clone(s: TeamState): TeamState {
  return {
    tank: s.tank,
    dps: [s.dps[0], s.dps[1]],
    support: [s.support[0], s.support[1]],
  };
}

function pick(id: string) {
  const hero = heroById.value.get(id);
  if (!hero) return;
  const next = clone(props.modelValue);
  if (hero.role === 'tank') {
    if (next.tank !== null) {
      flash('tank');
      return;
    }
    next.tank = id;
  } else if (hero.role === 'dps') {
    const idx = next.dps.indexOf(null);
    if (idx === -1) {
      flash('dps');
      return;
    }
    next.dps[idx] = id;
  } else {
    const idx = next.support.indexOf(null);
    if (idx === -1) {
      flash('support');
      return;
    }
    next.support[idx] = id;
  }
  emit('update:modelValue', next);
}

function clearSlot(role: Role, idx: number) {
  const next = clone(props.modelValue);
  if (role === 'tank') next.tank = null;
  else if (role === 'dps') next.dps[idx] = null;
  else next.support[idx] = null;
  emit('update:modelValue', next);
}

function reset() {
  emit('update:modelValue', {
    tank: null,
    dps: [null, null],
    support: [null, null],
  });
}

const slots = computed(() => [
  { role: 'tank' as Role, idx: 0, heroId: props.modelValue.tank },
  { role: 'dps' as Role, idx: 0, heroId: props.modelValue.dps[0] },
  { role: 'dps' as Role, idx: 1, heroId: props.modelValue.dps[1] },
  { role: 'support' as Role, idx: 0, heroId: props.modelValue.support[0] },
  { role: 'support' as Role, idx: 1, heroId: props.modelValue.support[1] },
]);

const ownPickedIds = computed(() =>
  slots.value
    .map((s) => s.heroId)
    .filter((x): x is string => x !== null),
);
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h2 class="panel-title">{{ label }}</h2>
      <button
        type="button"
        class="text-xs text-slate-400 hover:text-ow-orange transition focus:outline-none focus:text-ow-orange"
        @click="reset"
      >
        Reset
      </button>
    </div>

    <div class="flex flex-wrap gap-2">
      <SlotChip
        v-for="(slot, i) in slots"
        :key="i"
        :role="slot.role"
        :hero="slot.heroId ? heroById.get(slot.heroId) ?? null : null"
        :flash="flashRole === slot.role"
        @clear="clearSlot(slot.role, slot.idx)"
      />
    </div>

    <HeroGrid
      :heroes="heroes"
      :disabled-ids="bans"
      :selected-ids="ownPickedIds"
      :on-pick="pick"
    />
  </div>
</template>
