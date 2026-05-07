export type MomoStyle = 'gentle_sister' | 'lively_girl' | 'calm_doctor' | 'neutral'

export type MomoLength = 'short' | 'medium' | 'long'

export type RecommendFrequency = 'every_open' | 'once_per_day' | 'never'

export type SourceLock = 'auto' | 'youtube_only' | 'netease_only'

export interface MusicTasteProfile {
  source: 'netease_liked'
  updatedAt: number
  sampledTrackCount: number
  likedPlaylistId?: string
  topArtists: string[]
  styleTags: string[]
  languageHints: string[]
  seedTracks: string[]
  searchBias: string
}

export interface UserSettings {
  userNickname: string
  momoName: string
  momoStyle: MomoStyle
  momoLength: MomoLength
  recommendFrequency: RecommendFrequency
  sourceLock: SourceLock
  openaiApiKey?: string
  youtubeApiKey?: string
  neteaseApiUrl: string
  neteaseCookie?: string
  openweatherApiKey?: string
  openweatherDefaultCity: string
  musicTasteProfile?: MusicTasteProfile
  lastGreetedAt: number
}

export interface UserProfile {
  musicPreferences: string
  likedTrackIds: string[]
  longTermMemory: string
  longTermMemoryUpdatedAt: number
}
