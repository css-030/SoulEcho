<script setup lang="ts">
import { computed } from 'vue'

import NeteasePlayer from '@/components/player/NeteasePlayer.vue'
import YouTubePlayer from '@/components/player/YouTubePlayer.vue'
import { usePlayerStore } from '@/stores/player'
import type { WuxingType } from '@/types/wuxing'

const playerStore = usePlayerStore()

const trackTitle = computed(() => playerStore.currentTrack?.title ?? '还没有播放音乐')
const trackArtist = computed(() => playerStore.currentTrack?.artist ?? 'SoulEcho')
const youtubeUrl = computed(() => {
  const youtubeId = playerStore.currentTrack?.youtubeId
  return youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : null
})
const progressMax = computed(() => Math.max(playerStore.duration, playerStore.progress, 1))
const progressPercent = computed(() => Math.min((playerStore.progress / progressMax.value) * 100, 100))
const playButtonLabel = computed(() => (playerStore.state === 'playing' ? '暂停' : '播放'))
const healingButtonLabel = computed(() => '结束疗愈')
const errorMessage = computed(() =>
  playerStore.source === 'youtube' ? 'This track cannot be played inside SoulEcho.' : 'This NetEase track is temporarily unavailable.'
)
const sourceLabel = computed(() => {
  if (playerStore.source === 'netease') {
    return '疗愈中 · 网易云'
  }

  if (playerStore.source === 'fallback') {
    return '兜底陪伴'
  }

  return 'YouTube BGM'
})
const wuxingLabel = computed(() => {
  const wuxing = playerStore.currentTrack?.wuxingTag
  if (!wuxing) {
    return ''
  }

  const labels: Record<WuxingType, string> = {
    wood: '角调 · 木 · 肝',
    fire: '徵调 · 火 · 心',
    earth: '宫调 · 土 · 脾',
    metal: '商调 · 金 · 肺',
    water: '羽调 · 水 · 肾'
  }

  return labels[wuxing]
})

function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function togglePlayback(): void {
  if (playerStore.state === 'playing') {
    playerStore.pause()
    return
  }

  playerStore.resume()
}

function handleSeek(event: Event): void {
  const input = event.target as HTMLInputElement
  playerStore.seek(Number(input.value))
}

function handleVolume(event: Event): void {
  const input = event.target as HTMLInputElement
  playerStore.setVolume(Number(input.value))
}

function handleEndHealing(): void {
  playerStore.endHealingSession({ stopPlayback: true })
}

</script>

<template>
  <section class="player-expanded" aria-label="音乐播放器">
    <div v-if="playerStore.source === 'youtube'" class="player-expanded__media">
      <YouTubePlayer v-if="playerStore.source === 'youtube'" />
    </div>
    <div v-else-if="playerStore.source === 'netease'" class="player-expanded__media is-audio">
      <NeteasePlayer />
    </div>

    <div class="player-expanded__content">
      <div class="player-expanded__topline">
        <div class="player-expanded__meta">
          <span class="player-expanded__source" :title="sourceLabel">{{ sourceLabel }}</span>
          <span v-if="wuxingLabel" class="player-expanded__wuxing">{{ wuxingLabel }}</span>
        </div>
        <button
          v-if="playerStore.isHealingMode"
          class="player-expanded__healing"
          type="button"
          :disabled="!playerStore.hasTrack"
          @click="handleEndHealing"
        >
          {{ healingButtonLabel }}
        </button>
      </div>

      <div class="player-expanded__track">
        <h2 class="player-expanded__title" :title="trackTitle">{{ trackTitle }}</h2>
        <p class="player-expanded__artist" :title="trackArtist">{{ trackArtist }}</p>
      </div>

      <div v-if="playerStore.isTimelineAvailable" class="player-expanded__progress">
        <div class="player-expanded__time">
          <span>{{ formatTime(playerStore.progress) }}</span>
          <span>{{ formatTime(progressMax) }}</span>
        </div>
        <input
          class="player-expanded__range"
          type="range"
          min="0"
          :max="progressMax"
          step="1"
          :value="playerStore.progress"
          :style="{ '--progress-percent': `${progressPercent}%` }"
          aria-label="播放进度"
          @input="handleSeek"
        />
      </div>

      <div v-else class="player-expanded__live-note">
        <span class="player-expanded__live-dot" />
        <span>直播电台由 YouTube 小窗控制进度</span>
      </div>

      <div v-if="playerStore.state === 'error'" class="player-expanded__error">
        <span>{{ errorMessage }}</span>
        <a v-if="youtubeUrl" class="player-expanded__external" :href="youtubeUrl" target="_blank" rel="noreferrer">Open on YouTube</a>
      </div>

      <div class="player-expanded__controls">
        <button
          class="player-expanded__button"
          type="button"
          :disabled="!playerStore.hasPreviousTrack"
          @click="playerStore.previous"
        >
          上一首
        </button>
        <button class="player-expanded__button is-primary" type="button" :disabled="!playerStore.hasTrack" @click="togglePlayback">
          {{ playButtonLabel }}
        </button>
        <button
          class="player-expanded__button"
          type="button"
          :disabled="!playerStore.hasNextTrack"
          @click="playerStore.next"
        >
          下一首
        </button>

        <label class="player-expanded__volume">
          <span>音量</span>
          <input
            class="player-expanded__range"
            type="range"
            min="0"
            max="1"
            step="0.05"
            :value="playerStore.volume"
            aria-label="音量"
            @input="handleVolume"
          />
        </label>
      </div>
    </div>
  </section>
</template>

<style scoped>
.player-expanded {
  position: fixed;
  right: var(--space-lg);
  bottom: var(--space-lg);
  z-index: 30;
  display: grid;
  grid-template-columns: auto minmax(0, 24rem);
  gap: var(--space-md);
  width: min(calc(100vw - var(--space-xl) * 2), 36rem);
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  backdrop-filter: blur(12px);
  animation: player-expand var(--duration-normal) var(--ease-out);
}

.player-expanded__media {
  position: relative;
  min-width: 15rem;
  min-height: 8.4375rem;
}

.player-expanded__media.is-audio {
  min-width: 7.5rem;
  min-height: 7.5rem;
}

.player-expanded__content {
  display: grid;
  gap: var(--space-sm);
  min-width: 0;
}

.player-expanded__topline,
.player-expanded__meta,
.player-expanded__time,
.player-expanded__controls,
.player-expanded__volume {
  display: flex;
  align-items: center;
}

.player-expanded__topline,
.player-expanded__time {
  justify-content: space-between;
  gap: var(--space-sm);
}

.player-expanded__meta {
  flex-wrap: wrap;
  gap: var(--space-xs) var(--space-sm);
  min-width: 0;
}

.player-expanded__source {
  overflow: hidden;
  max-width: 100%;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.player-expanded__track {
  min-width: 0;
  max-width: 100%;
}

.player-expanded__wuxing {
  color: var(--text-tertiary);
  font-size: 0.75rem;
  font-weight: 800;
}

.player-expanded__button {
  min-height: 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--bg-card) 72%, var(--bg-primary));
  color: var(--text-secondary);
  cursor: pointer;
  font-weight: 800;
  transition:
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    opacity var(--duration-fast) var(--ease-out);
}

.player-expanded__healing {
  min-width: 4.75rem;
  min-height: 2.25rem;
  padding: 0 var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--bg-card) 78%, var(--bg-primary));
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 900;
  transition:
    background var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    opacity var(--duration-fast) var(--ease-out);
}

.player-expanded__healing:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-primary) 32%, var(--bg-card));
  color: var(--text-primary);
}

.player-expanded__healing:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.player-expanded__healing {
  border-color: color-mix(in srgb, var(--color-wood) 58%, var(--color-border));
  background: color-mix(in srgb, var(--color-wood) 18%, var(--bg-card));
  color: var(--text-primary);
}

.player-expanded__button {
  padding: 0 var(--space-md);
}

.player-expanded__button.is-primary {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: var(--bg-primary);
}

.player-expanded__button:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-primary) 36%, var(--bg-card));
  color: var(--text-primary);
}

.player-expanded__button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.player-expanded__title {
  overflow: hidden;
  max-width: 100%;
  margin: 0;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-expanded__artist {
  overflow: hidden;
  max-width: 100%;
  margin: 0.15rem 0 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-expanded__progress {
  display: grid;
  gap: var(--space-xs);
}

.player-expanded__live-note {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-height: 2rem;
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 800;
}

.player-expanded__error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  min-height: 2rem;
  color: var(--text-secondary);
  font-size: 0.8125rem;
  font-weight: 800;
}

.player-expanded__external {
  color: var(--color-accent);
  font-weight: 900;
  text-decoration: none;
}

.player-expanded__external:hover {
  text-decoration: underline;
}

.player-expanded__live-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
  box-shadow: 0 0 0 0.25rem color-mix(in srgb, var(--color-accent) 16%, transparent);
}

.player-expanded__time {
  color: var(--text-tertiary);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.player-expanded__range {
  width: 100%;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.player-expanded__controls {
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.player-expanded__volume {
  flex: 1 1 9rem;
  gap: var(--space-sm);
  min-width: 9rem;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 800;
}

@keyframes player-expand {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .player-expanded {
    animation: none;
  }
}

@media (max-width: 760px) {
  .player-expanded {
    right: var(--space-md);
    bottom: var(--space-md);
    grid-template-columns: 1fr;
    width: calc(100vw - var(--space-md) * 2);
  }

  .player-expanded__media {
    min-width: 0;
  }

  .player-expanded__media.is-audio {
    justify-self: center;
  }
}
</style>
