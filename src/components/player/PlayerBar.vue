<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import PlayerExpanded from '@/components/player/PlayerExpanded.vue'
import { usePlayerStore } from '@/stores/player'

const playerStore = usePlayerStore()
const route = useRoute()
const isImmersiveHealingRoute = computed(() => route.name === 'healing')
</script>

<template>
  <PlayerExpanded v-show="playerStore.isExpanded && playerStore.hasTrack && !isImmersiveHealingRoute" />

  <button
    v-show="!isImmersiveHealingRoute"
    class="player-bar"
    :class="{ 'is-playing': playerStore.state === 'playing' }"
    type="button"
    :aria-expanded="playerStore.isExpanded"
    aria-label="打开音乐播放器"
    @click="playerStore.toggleExpanded"
  >
    <span class="player-bar__icon">♪</span>
  </button>
</template>

<style scoped>
.player-bar {
  position: fixed;
  right: var(--space-lg);
  bottom: var(--space-lg);
  z-index: 31;
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--color-accent) 54%, transparent);
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  color: var(--bg-primary);
  box-shadow: 0 4px 16px color-mix(in srgb, var(--color-accent) 42%, transparent);
  cursor: pointer;
  transition:
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.player-bar:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--color-accent) 48%, transparent);
}

.player-bar__icon {
  display: inline-block;
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1;
}

.player-bar.is-playing .player-bar__icon {
  animation: player-spin 10s linear infinite;
}

@keyframes player-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .player-bar,
  .player-bar__icon {
    animation: none;
    transition: none;
  }
}

@media (max-width: 640px) {
  .player-bar {
    right: var(--space-md);
    bottom: var(--space-md);
  }
}
</style>
