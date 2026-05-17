<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<template>
  <header
    class="relative z-20 flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-800/80 bg-slate-quiet/50 backdrop-blur"
  >
    <div class="flex items-center gap-3">
      <div
        class="w-1 h-8 rounded-full bg-ow-orange shadow-glow-orange"
        aria-hidden="true"
      />
      <div class="flex items-baseline gap-3">
        <h1 class="text-xl font-bold tracking-tight text-slate-50 leading-none">
          OW <span class="text-ow-orange">Counter</span>
        </h1>
        <span class="text-[10px] uppercase tracking-[0.22em] text-slate-500">
          {{ title ?? 'Composition Suggester' }}
        </span>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <slot name="controls" />
    </div>
  </header>
</template>
