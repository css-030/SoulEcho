<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  document.body.dataset.scene = 'garden'
})
</script>

<template>
  <main class="placeholder-view">
    <p>情绪花园会在 Phase 6 生长出来。</p>
  </main>
</template>

<style scoped>
.placeholder-view {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: var(--bg-gradient);
  color: var(--text-primary);
}
</style>
