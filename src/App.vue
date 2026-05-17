<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import PlayerBar from '@/components/player/PlayerBar.vue'
import { useGreeting } from '@/composables/useGreeting'
import { useChatStore } from '@/stores/chat'

const isOffline = ref(!navigator.onLine)
const chatStore = useChatStore()
const { greetOnAppOpen } = useGreeting()

function handleOnline(): void {
  isOffline.value = false
}

function handleOffline(): void {
  isOffline.value = true
}

onMounted(async () => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  await chatStore.initialize()
  await greetOnAppOpen()
})

onBeforeUnmount(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<template>
  <div v-if="isOffline" class="app-offline-banner" role="status" aria-live="polite">
    好像暂时没网了。SoulEcho 还能打开，但 momo 和在线音乐要等网络回来后才能继续。
  </div>
  <RouterView />
  <PlayerBar />
</template>

<style scoped>
.app-offline-banner {
  position: fixed;
  top: var(--space-md);
  left: 50%;
  z-index: 60;
  width: min(calc(100vw - var(--space-lg) * 2), 38rem);
  padding: 0.875rem 1rem;
  border: 1px solid color-mix(in srgb, var(--color-danger) 34%, var(--color-border));
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--bg-card) 88%, var(--color-danger));
  color: var(--text-primary);
  box-shadow: var(--shadow-card);
  text-align: center;
  transform: translateX(-50%);
  backdrop-filter: blur(10px);
}
</style>
