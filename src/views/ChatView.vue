<script setup lang="ts">
</script>

<template>
  <main class="chat-view">
    <section class="chat-view__panel">
      <p class="chat-view__eyebrow">SoulEcho</p>
      <h1 class="chat-view__title">momo 正在准备见你</h1>
      <p class="chat-view__copy">Phase 0 环境已经启动，后续会在这里接入聊天、音乐和疗愈空间。</p>
    </section>
  </main>
</template>

<style scoped>
.chat-view {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--space-xl);
  background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary));
  color: var(--text-primary);
}

.chat-view__panel {
  width: min(100%, 32rem);
  padding: var(--space-xl);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(8px);
}

.chat-view__eyebrow {
  margin: 0 0 var(--space-sm);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 700;
}

.chat-view__title {
  margin: 0 0 var(--space-md);
  font-size: 2rem;
  line-height: 1.2;
}

.chat-view__copy {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.8;
}
</style>
