import { FALLBACK_LIBRARY, type FallbackTrack } from '@/data/fallback-library'
import { getAppEnv } from '@/services/config/env'
import type { MusicProvider } from '@/services/music/MusicProvider'
import type { Track } from '@/types/music'

interface YouTubeSearchItem {
  id?: { videoId?: string }
  snippet?: {
    title?: string
    channelTitle?: string
    thumbnails?: {
      default?: { url?: string }
      medium?: { url?: string }
      high?: { url?: string }
    }
  }
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[]
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

function getTrackVideoId(track: Track): string {
  return track.youtubeId ?? track.id
}

function toPlainTrack(track: FallbackTrack): Track {
  const { tags: _tags, playlistId: _playlistId, ...plainTrack } = track
  return plainTrack
}

export class YouTubeProvider implements MusicProvider {
  readonly type = 'youtube' as const

  async search(query: string): Promise<Track[]> {
    const normalizedQuery = normalizeText(query)
    const localResults = FALLBACK_LIBRARY.youtube.filter((track) => {
      const haystack = [track.title, track.artist, ...track.tags].map(normalizeText)
      return haystack.some((part) => part.includes(normalizedQuery) || normalizedQuery.includes(part))
    })

    if (localResults.length > 0) {
      return localResults.map(toPlainTrack)
    }

    const env = getAppEnv()
    if (env.youtubeApiKey) {
      const apiResults = await this.searchYouTubeDataApi(query, env.youtubeApiKey)
      if (apiResults.length > 0) {
        return apiResults
      }
    }

    return FALLBACK_LIBRARY.youtube.slice(0, 1).map(toPlainTrack)
  }

  async getPlayUrl(trackId: string): Promise<string> {
    return `youtube://${trackId}`
  }

  async getPlaylist(playlistId: string): Promise<Track[]> {
    const tracks = FALLBACK_LIBRARY.youtube.filter((track) => track.playlistId === playlistId)
    return (tracks.length > 0 ? tracks : FALLBACK_LIBRARY.youtube.slice(0, 1)).map(toPlainTrack)
  }

  private async searchYouTubeDataApi(query: string, apiKey: string): Promise<Track[]> {
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/search')
      url.searchParams.set('part', 'snippet')
      url.searchParams.set('q', query)
      url.searchParams.set('type', 'video')
      url.searchParams.set('maxResults', '5')
      url.searchParams.set('key', apiKey)

      const response = await fetch(url)
      if (!response.ok) {
        return []
      }

      const data = (await response.json()) as YouTubeSearchResponse
      return (data.items ?? [])
        .map((item): Track | null => {
          const videoId = item.id?.videoId
          const snippet = item.snippet
          if (!videoId || !snippet?.title) {
            return null
          }

          return {
            id: videoId,
            source: 'youtube',
            title: snippet.title,
            artist: snippet.channelTitle ?? 'YouTube',
            duration: 0,
            thumbnailUrl: snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? snippet.thumbnails?.high?.url,
            youtubeId: videoId
          }
        })
        .filter((track): track is Track => track !== null)
    } catch (error) {
      console.debug('[YouTubeProvider] YouTube Data API search failed, using fallback', error)
      return []
    }
  }
}

export function getYouTubeVideoId(track: Track | null): string | null {
  return track ? getTrackVideoId(track) : null
}
