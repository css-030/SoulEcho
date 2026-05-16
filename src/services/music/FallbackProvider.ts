import { FALLBACK_LIBRARY, type FallbackTrack } from '@/data/fallback-library'
import type { MusicProvider } from '@/services/music/MusicProvider'
import type { Track } from '@/types/music'
import type { WuxingType } from '@/types/wuxing'

function toFallbackTrack(track: FallbackTrack): Track {
  return {
    id: `fallback_${track.id}`,
    source: 'fallback',
    title: track.title,
    artist: track.artist,
    duration: track.duration,
    thumbnailUrl: track.thumbnailUrl,
    youtubeId: track.youtubeId,
    youtubePlaylistId: track.youtubePlaylistId,
    wuxingTag: track.wuxingTag,
    playUrl: track.youtubeId ? `youtube://${track.youtubeId}` : undefined
  }
}

export class FallbackProvider implements MusicProvider {
  readonly type = 'fallback' as const

  async search(query: string): Promise<Track[]> {
    const normalizedQuery = query.trim().toLowerCase()
    const matches = FALLBACK_LIBRARY.youtube.filter((track) => {
      const haystack = [track.title, track.artist, ...track.tags].map((part) => part.toLowerCase())
      return haystack.some((part) => part.includes(normalizedQuery) || normalizedQuery.includes(part))
    })

    return (matches.length > 0 ? matches : FALLBACK_LIBRARY.youtube.slice(0, 1)).map(toFallbackTrack)
  }

  async getPlayUrl(trackId: string): Promise<string> {
    const track = FALLBACK_LIBRARY.youtube.find((item) => item.id === trackId || item.youtubeId === trackId || `fallback_${item.id}` === trackId)
    return `youtube://${track?.youtubeId ?? trackId.replace(/^fallback_/, '')}`
  }

  async getPlaylist(playlistId: string): Promise<Track[]> {
    const tracks = FALLBACK_LIBRARY.youtube.filter((track) => track.playlistId === playlistId)
    return (tracks.length > 0 ? tracks : FALLBACK_LIBRARY.youtube.slice(0, 1)).map(toFallbackTrack)
  }

  findSimilar(wuxing?: WuxingType): Track {
    const track = FALLBACK_LIBRARY.youtube.find((item) => item.playlistId === wuxing) ?? FALLBACK_LIBRARY.youtube[0]
    return toFallbackTrack(track)
  }
}
