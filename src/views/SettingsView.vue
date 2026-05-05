<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  document.body.dataset.scene = 'chat'
})
</script>

<template>
  <main class="placeholder-view">
    <p>设置页会在 Phase 7 完成。</p>
  </main>
</template>

<style scoped>
.placeholder-view {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary));
  color: var(--text-primary);
}
</style>
