import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getAppEnv } from '@/services/config/env'
import { musicRouter } from '@/services/music/MusicRouter'
import { openWeatherService, WEATHER_UNAVAILABLE } from '@/services/weather/OpenWeatherService'
import { useHealingStore } from '@/stores/healing'
import { useSettingsStore } from '@/stores/settings'
import { HEALING_ORGAN_BY_WUXING } from '@/types/healing'
import type { Playlist, PlayerState, Track } from '@/types/music'
import type { WeatherInfo } from '@/types/momo'
import type { OrganType, WuxingType } from '@/types/wuxing'

export const usePlayerStore = defineStore('player', () => {
  const state = ref<PlayerState>('idle')
  const source = ref<Track['source'] | null>(null)
  const currentTrack = ref<Track | null>(null)
  const currentPlaylist = ref<Playlist | null>(null)
  const currentIndex = ref(0)
  const progress = ref(0)
  const duration = ref(0)
  const volume = ref(0.8)
  const isTimelineAvailable = ref(false)
  const isHealingMode = ref(false)
  const currentHealingOrgan = ref<OrganType | undefined>(undefined)
  const isExpanded = ref(false)
  const isPlaylistEnd = ref(false)
  const hasTrack = computed(() => currentTrack.value !== null)
  const hasNextTrack = computed(() => {
    const playlist = currentPlaylist.value
    return playlist ? currentIndex.value < playlist.tracks.length - 1 : false
  })
  const hasPreviousTrack = computed(() => {
    return currentPlaylist.value !== null && currentIndex.value > 0
  })

  async function play(target: Track | Playlist): Promise<void> {
    state.value = 'loading'
    isPlaylistEnd.value = false
    isExpanded.value = true
    progress.value = 0
    isTimelineAvailable.value = false

    if ('tracks' in target) {
      currentPlaylist.value = target
      currentIndex.value = 0
      await setCurrentTrack(target.tracks[0] ?? null)
      return
    }

    currentPlaylist.value = null
    currentIndex.value = 0
    await setCurrentTrack(target)
  }

  async function playPlaylistById(playlistId: string): Promise<void> {
    const playlist = await musicRouter.getPlaylist(playlistId, 'youtube')
    await play(playlist)
  }

  async function playNeteaseSearch(query: string): Promise<void> {
    const tracks = await musicRouter.search({
      scenario: 'healing',
      searchQuery: query
    })
    await play(tracks[0])
  }

  async function startHealingSession(
    wuxing: WuxingType,
    contextOverride?: {
      now?: Date
      weather?: WeatherInfo
    }
  ): Promise<void> {
    const healingStore = useHealingStore()
    const settingsStore = useSettingsStore()
    const env = getAppEnv()
    isHealingMode.value = true
    currentHealingOrgan.value = HEALING_ORGAN_BY_WUXING[wuxing]
    isPlaylistEnd.value = false
    healingStore.activate(wuxing)
    const weather =
      contextOverride?.weather ??
      (await openWeatherService.getCurrentWeather({
        apiKey: settingsStore.settings.openweatherApiKey || env.openweatherApiKey,
        city: settingsStore.settings.openweatherDefaultCity || env.openweatherDefaultCity
      }))
    const playlist = await musicRouter.getHealingPlaylist(wuxing, {
      now: contextOverride?.now ?? new Date(),
      weather: weather || WEATHER_UNAVAILABLE
    })
    await play(playlist)
  }

  function endHealingSession(options: { stopPlayback?: boolean } = {}): void {
    const healingStore = useHealingStore()
    isHealingMode.value = false
    currentHealingOrgan.value = undefined
    healingStore.complete()
    if (options.stopPlayback && currentTrack.value) {
      state.value = 'paused'
    }
  }

  function pause(): void {
    if (currentTrack.value) {
      state.value = 'paused'
    }
  }

  function resume(): void {
    if (currentTrack.value) {
      state.value = 'playing'
    }
  }

  async function next(): Promise<void> {
    const playlist = currentPlaylist.value
    if (!playlist) {
      isPlaylistEnd.value = true
      state.value = 'ended'
      return
    }

    if (hasNextTrack.value) {
      currentIndex.value += 1
      progress.value = 0
      await setCurrentTrack(playlist.tracks[currentIndex.value] ?? null)
      return
    }

    isPlaylistEnd.value = true
    state.value = 'ended'
  }

  async function previous(): Promise<void> {
    const playlist = currentPlaylist.value
    if (!playlist || !hasPreviousTrack.value) {
      progress.value = 0
      return
    }

    currentIndex.value -= 1
    progress.value = 0
    await setCurrentTrack(playlist.tracks[currentIndex.value] ?? null)
  }

  function seek(seconds: number): void {
    if (!isTimelineAvailable.value) {
      return
    }

    progress.value = Math.max(0, Math.min(seconds, duration.value || seconds))
  }

  function setVolume(value: number): void {
    volume.value = Math.max(0, Math.min(value, 1))
  }

  function toggleExpanded(): void {
    isExpanded.value = !isExpanded.value
  }

  function setPlaybackState(nextState: PlayerState): void {
    state.value = nextState
  }

  function setProgress(seconds: number): void {
    progress.value = Math.max(0, seconds)
  }

  function setDuration(seconds: number): void {
    duration.value = Math.max(0, seconds)
    isTimelineAvailable.value = duration.value > 0 && duration.value <= 21600
  }

  async function handleTrackEnded(): Promise<void> {
    await next()
  }

  async function handlePlaybackError(): Promise<void> {
    state.value = 'error'
    isPlaylistEnd.value = false
  }

  async function setCurrentTrack(track: Track | null): Promise<void> {
    if (!track) {
      currentTrack.value = null
      source.value = null
      state.value = 'idle'
      return
    }

    const playableTrack = await musicRouter.getPlayableTrack(track)
    currentTrack.value = playableTrack
    source.value = playableTrack.source
    if (playableTrack.wuxingTag) {
      const nextOrgan = HEALING_ORGAN_BY_WUXING[playableTrack.wuxingTag]
      currentHealingOrgan.value = nextOrgan
      if (isHealingMode.value) {
        useHealingStore().switchOrgan(nextOrgan)
      }
    }
    duration.value = playableTrack.duration
    isTimelineAvailable.value = playableTrack.duration > 0 && playableTrack.duration <= 21600
    state.value = 'playing'
  }

  return {
    state,
    source,
    currentTrack,
    currentPlaylist,
    currentIndex,
    progress,
    duration,
    volume,
    isTimelineAvailable,
    isHealingMode,
    currentHealingOrgan,
    isExpanded,
    isPlaylistEnd,
    hasTrack,
    hasNextTrack,
    hasPreviousTrack,
    play,
    playPlaylistById,
    playNeteaseSearch,
    startHealingSession,
    endHealingSession,
    pause,
    resume,
    next,
    previous,
    seek,
    setVolume,
    toggleExpanded,
    setPlaybackState,
    setProgress,
    setDuration,
    handleTrackEnded,
    handlePlaybackError
  }
})
