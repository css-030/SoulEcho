import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { musicRouter } from '@/services/music/MusicRouter'
import { favoriteRepo } from '@/services/storage/repositories/FavoriteRepo'
import type { FavoriteTrack } from '@/types/favorite'
import type { Playlist, PlayerState, Track } from '@/types/music'
import type { OrganType, WuxingType } from '@/types/wuxing'
import { createId } from '@/utils/id'

const WUXING_ORGAN_MAP: Record<WuxingType, OrganType> = {
  wood: 'liver',
  fire: 'heart',
  earth: 'spleen',
  metal: 'lung',
  water: 'kidney'
}

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
  const favoriteTracks = ref<FavoriteTrack[]>([])

  const hasTrack = computed(() => currentTrack.value !== null)
  const isCurrentFavorite = computed(() => {
    const track = currentTrack.value
    if (!track) {
      return false
    }

    return favoriteTracks.value.some((favorite) => {
      const sameYoutube = track.youtubeId && favorite.youtubeId === track.youtubeId
      const sameNetease = track.neteaseId && favorite.neteaseId === track.neteaseId
      return Boolean(sameYoutube || sameNetease)
    })
  })
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

  async function startHealingSession(wuxing: WuxingType): Promise<void> {
    isHealingMode.value = true
    currentHealingOrgan.value = WUXING_ORGAN_MAP[wuxing]
    isPlaylistEnd.value = false
    const playlist = await musicRouter.getHealingPlaylist(wuxing)
    await play(playlist)
  }

  function endHealingSession(): void {
    isHealingMode.value = false
    currentHealingOrgan.value = undefined
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

  async function initializeFavorites(): Promise<void> {
    favoriteTracks.value = await favoriteRepo.loadAll()
  }

  async function toggleFavorite(): Promise<void> {
    const track = currentTrack.value
    if (!track) {
      return
    }

    const existing = await favoriteRepo.findByTrackIds({
      youtubeId: track.youtubeId,
      neteaseId: track.neteaseId
    })

    if (existing) {
      await favoriteRepo.delete(existing.id)
      favoriteTracks.value = favoriteTracks.value.filter((favorite) => favorite.id !== existing.id)
      return
    }

    const counterpart = await musicRouter.findCounterpart(track)
    const favorite: FavoriteTrack = {
      id: createId('favorite'),
      title: track.title,
      artist: track.artist,
      youtubeId: track.youtubeId ?? counterpart?.youtubeId,
      neteaseId: track.neteaseId ?? counterpart?.neteaseId,
      thumbnailUrl: track.thumbnailUrl,
      addedAt: Date.now(),
      wuxingTag: track.wuxingTag,
      isHealingTrack: isHealingMode.value || track.source === 'netease'
    }

    await favoriteRepo.save(favorite)
    favoriteTracks.value = [favorite, ...favoriteTracks.value]
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
      currentHealingOrgan.value = WUXING_ORGAN_MAP[playableTrack.wuxingTag]
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
    favoriteTracks,
    hasTrack,
    isCurrentFavorite,
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
    initializeFavorites,
    toggleFavorite
  }
})
