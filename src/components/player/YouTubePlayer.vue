<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { usePlayerStore } from '@/stores/player'
import { getYouTubeVideoId } from '@/services/music/YouTubeProvider'
import { waitForYouTubeApi } from '@/services/music/youtubeApi'

const playerStore = usePlayerStore()
const containerId = `youtube-player-${Math.random().toString(36).slice(2)}`
const player = ref<YT.Player | null>(null)
const progressTimer = ref<number | null>(null)
const isReady = ref(false)
const pendingAutoplay = ref(false)
const autoplayAttempts = ref(0)
const isSyncingFromYouTube = ref(false)

const videoId = computed(() => getYouTubeVideoId(playerStore.currentTrack))

watch(
  videoId,
  async (nextVideoId) => {
    if (!nextVideoId) {
      destroyPlayer()
      return
    }

    await ensurePlayer(nextVideoId)
  },
  { immediate: true }
)

watch(
  () => playerStore.volume,
  (volume) => {
    player.value?.setVolume(Math.round(volume * 100))
  }
)

watch(
  () => playerStore.state,
  (state) => {
    if (isSyncingFromYouTube.value) {
      return
    }

    if (!isReady.value || !player.value) {
      return
    }

    if (state === 'paused') {
      pendingAutoplay.value = false
      player.value.pauseVideo()
    }

    if (state === 'playing') {
      player.value.playVideo()
    }
  }
)

watch(
  () => playerStore.progress,
  (seconds, previousSeconds) => {
    if (!player.value || Math.abs(seconds - previousSeconds) < 1.5) {
      return
    }

    player.value.seekTo(seconds, true)
  }
)

async function ensurePlayer(nextVideoId: string): Promise<void> {
  await nextTick()
  const youtube = await waitForYouTubeApi()

  if (player.value) {
    stopProgressTimer()
    playerStore.setProgress(0)
    playerStore.setPlaybackState('loading')
    player.value.loadVideoById(nextVideoId)
    queuePlaybackRequest()
    return
  }

  const playerVars: YT.PlayerVars = {
    autoplay: 1,
    controls: 1,
    modestbranding: 1,
    rel: 0
  }
  const playlistId = playerStore.currentTrack?.youtubePlaylistId
  if (playlistId) {
    playerVars.list = playlistId
  }

  player.value = new youtube.Player(containerId, {
    videoId: nextVideoId,
    width: 240,
    height: 135,
    playerVars,
    events: {
      onReady: handleReady,
      onStateChange: handleStateChange,
      onError: handleError
    }
  })
}

function handleReady(event: YT.PlayerEvent): void {
  isReady.value = true
  event.target.setVolume(Math.round(playerStore.volume * 100))
  playerStore.setDuration(event.target.getDuration())
  queuePlaybackRequest()
  startProgressTimer()
}

function handleStateChange(event: YT.OnStateChangeEvent): void {
  if (event.data === YT.PlayerState.PLAYING) {
    pendingAutoplay.value = false
    setPlaybackStateFromYouTube('playing')
    playerStore.setDuration(event.target.getDuration())
    startProgressTimer()
  }

  if (event.data === YT.PlayerState.PAUSED) {
    if (pendingAutoplay.value) {
      requestPlayback()
      return
    }

    setPlaybackStateFromYouTube('paused')
  }

  if (event.data === YT.PlayerState.BUFFERING) {
    setPlaybackStateFromYouTube('loading')
  }

  if (event.data === YT.PlayerState.CUED || event.data === YT.PlayerState.UNSTARTED) {
    requestPlayback()
  }

  if (event.data === YT.PlayerState.ENDED) {
    stopProgressTimer()
    void playerStore.handleTrackEnded()
  }
}

function handleError(): void {
  pendingAutoplay.value = false
  setPlaybackStateFromYouTube('error')
  void playerStore.handlePlaybackError()
}

function setPlaybackStateFromYouTube(state: Parameters<typeof playerStore.setPlaybackState>[0]): void {
  isSyncingFromYouTube.value = true
  playerStore.setPlaybackState(state)
  void nextTick(() => {
    isSyncingFromYouTube.value = false
  })
}

function queuePlaybackRequest(): void {
  pendingAutoplay.value = true
  autoplayAttempts.value = 0
  requestPlayback()
}

function requestPlayback(): void {
  window.setTimeout(() => {
    if (!player.value || !pendingAutoplay.value || playerStore.state === 'paused' || playerStore.state === 'error') {
      return
    }

    autoplayAttempts.value += 1
    player.value.playVideo()

    if (autoplayAttempts.value < 5) {
      window.setTimeout(() => {
        if (pendingAutoplay.value && playerStore.state !== 'playing') {
          requestPlayback()
        }
      }, 180)
    }
  }, 0)
}

function startProgressTimer(): void {
  stopProgressTimer()
  progressTimer.value = window.setInterval(() => {
    if (!player.value || !isReady.value) {
      return
    }

    playerStore.setProgress(player.value.getCurrentTime())
    playerStore.setDuration(player.value.getDuration())
  }, 1000)
}

function stopProgressTimer(): void {
  if (progressTimer.value !== null) {
    window.clearInterval(progressTimer.value)
    progressTimer.value = null
  }
}

function destroyPlayer(): void {
  stopProgressTimer()
  pendingAutoplay.value = false
  player.value?.destroy()
  player.value = null
  isReady.value = false
}

onBeforeUnmount(() => {
  destroyPlayer()
})
</script>

<template>
  <div class="youtube-player">
    <div :id="containerId" class="youtube-player__frame" />
  </div>
</template>

<style scoped>
.youtube-player {
  width: 15rem;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}

.youtube-player__frame {
  width: 100%;
  height: 100%;
}
</style>
