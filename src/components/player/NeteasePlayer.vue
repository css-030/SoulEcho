<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { usePlayerStore } from '@/stores/player'

const playerStore = usePlayerStore()
const audioElement = ref<HTMLAudioElement | null>(null)
const pendingAutoplay = ref(false)
const playAttemptTimer = ref<number | null>(null)

const playUrl = computed(() => playerStore.currentTrack?.playUrl ?? '')
const coverUrl = computed(() => playerStore.currentTrack?.thumbnailUrl ?? '')

watch(
  playUrl,
  async () => {
    pendingAutoplay.value = true
    await loadAndPlay()
  },
  { immediate: true }
)

watch(
  () => playerStore.volume,
  (volume) => {
    if (audioElement.value) {
      audioElement.value.volume = volume
    }
  }
)

watch(
  () => playerStore.state,
  async (state) => {
    const audio = audioElement.value
    if (!audio) {
      return
    }

    if (state === 'paused') {
      pendingAutoplay.value = false
      audio.pause()
    }

    if (state === 'playing' && audio.paused) {
      pendingAutoplay.value = true
      await requestPlay()
    }
  }
)

watch(
  () => playerStore.progress,
  (seconds, previousSeconds) => {
    const audio = audioElement.value
    if (!audio || Math.abs(seconds - previousSeconds) < 1.5) {
      return
    }

    audio.currentTime = seconds
  }
)

async function loadAndPlay(): Promise<void> {
  const audio = audioElement.value
  if (!audio || !playUrl.value) {
    return
  }

  pendingAutoplay.value = true
  audio.volume = playerStore.volume
  audio.load()
  await requestPlay()
}

async function requestPlay(): Promise<void> {
  const audio = audioElement.value
  if (!audio || !playUrl.value) {
    return
  }

  try {
    await audio.play()
  } catch {
    schedulePlayRetry()
  }
}

function schedulePlayRetry(): void {
  if (!pendingAutoplay.value || playAttemptTimer.value !== null) {
    return
  }

  playAttemptTimer.value = window.setTimeout(() => {
    playAttemptTimer.value = null
    if (pendingAutoplay.value && audioElement.value?.paused) {
      void requestPlay()
    }
  }, 180)
}

function handleLoadedMetadata(): void {
  const audio = audioElement.value
  playerStore.setDuration(Number.isFinite(audio?.duration) ? audio?.duration ?? 0 : 0)
}

function handleTimeUpdate(): void {
  playerStore.setProgress(audioElement.value?.currentTime ?? 0)
}

function handlePlaying(): void {
  pendingAutoplay.value = false
  playerStore.setPlaybackState('playing')
}

function handleWaiting(): void {
  playerStore.setPlaybackState('loading')
}

function handleEnded(): void {
  void playerStore.handleTrackEnded()
}

function handleError(): void {
  playerStore.setPlaybackState('error')
}

onMounted(() => {
  void loadAndPlay()
})

onBeforeUnmount(() => {
  if (playAttemptTimer.value !== null) {
    window.clearTimeout(playAttemptTimer.value)
  }

  audioElement.value?.pause()
})
</script>

<template>
  <div class="netease-player">
    <img v-if="coverUrl" class="netease-player__cover" :src="coverUrl" alt="" />
    <div v-else class="netease-player__disc" aria-hidden="true">
      <span class="netease-player__note">♪</span>
    </div>
    <audio
      ref="audioElement"
      :src="playUrl"
      preload="metadata"
      @loadedmetadata="handleLoadedMetadata"
      @timeupdate="handleTimeUpdate"
      @playing="handlePlaying"
      @waiting="handleWaiting"
      @ended="handleEnded"
      @error="handleError"
    />
  </div>
</template>

<style scoped>
.netease-player {
  display: grid;
  width: 7.5rem;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--bg-card) 78%, var(--color-primary));
  box-shadow: var(--shadow-card);
}

.netease-player__cover {
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid color-mix(in srgb, var(--color-border) 78%, transparent);
  border-radius: var(--radius-md);
  object-fit: cover;
}

.netease-player__disc {
  display: grid;
  width: 4rem;
  height: 4rem;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--color-accent) 34%, transparent);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--color-accent) 18%, var(--bg-card));
  box-shadow: 0 0 0 0.75rem color-mix(in srgb, var(--color-accent) 8%, transparent);
}

.netease-player__note {
  color: var(--color-accent);
  font-size: 1.5rem;
  font-weight: 900;
}
</style>
