import type { WuxingType } from './wuxing'

export interface FavoriteTrack {
  id: string
  title: string
  artist: string
  youtubeId?: string
  neteaseId?: string
  thumbnailUrl?: string
  addedAt: number
  wuxingTag?: WuxingType
  isHealingTrack: boolean
}
