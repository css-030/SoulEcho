import type { OrganType, WuxingType } from './wuxing'

export type MusicSource = 'youtube' | 'netease' | 'fallback'

export interface Track {
  id: string
  source: MusicSource
  title: string
  artist: string
  duration: number
  thumbnailUrl?: string
  youtubeId?: string
  youtubePlaylistId?: string
  neteaseId?: string
  wuxingTag?: WuxingType
  playUrl?: string
  viewCount?: number
}

export interface Playlist {
  id: string
  source: MusicSource
  title: string
  tracks: Track[]
  isHealingPlaylist?: boolean
  targetWuxing?: WuxingType
}

export interface PlaylistCandidate {
  id: string
  source: MusicSource
  title: string
  thumbnailUrl?: string
  trackCount?: number
}

export interface MusicRecommendation {
  scenario: 'daily-bgm' | 'healing' | 'user-requested'
  source: MusicSource
  primaryTrack?: Track
  playlist?: Playlist
  reason: string
  searchQuery?: string
  targetWuxing?: WuxingType
}

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'

export interface PlayerStatus {
  state: PlayerState
  source: MusicSource | null
  currentTrack: Track | null
  currentPlaylist: Playlist | null
  currentIndex: number
  progress: number
  duration: number
  volume: number
  isHealingMode: boolean
  currentHealingOrgan?: OrganType
}
