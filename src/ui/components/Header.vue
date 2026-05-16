<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<template>
  <header
    class="relative z-20 flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-700/60 bg-slate-panel/40 backdrop-blur"
  >
    <div class="flex items-baseline gap-2">
      <h1 class="text-2xl font-semibold text-ow-orange tracking-tight">
        {{ title ?? 'OW Counter' }}
      </h1>
      <span class="text-xs uppercase tracking-widest text-slate-500">
        Composition Suggester
      </span>
    </div>
    <div class="flex items-center gap-3">
      <slot name="controls" />
    </div>
  </header>
</template>
