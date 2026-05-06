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
  nextPageToken?: string
}

interface YouTubeVideoStatusItem {
  id?: string
  snippet?: {
    title?: string
    categoryId?: string
  }
  status?: {
    embeddable?: boolean
    privacyStatus?: string
    uploadStatus?: string
  }
  contentDetails?: {
    duration?: string
    licensedContent?: boolean
    regionRestriction?: {
      blocked?: string[]
      allowed?: string[]
    }
  }
  statistics?: {
    viewCount?: string
  }
}

interface YouTubeVideoStatusResponse {
  items?: YouTubeVideoStatusItem[]
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

function toSearchQuery(query: string): string {
  const normalizedQuery = normalizeText(query)
  const looksLikeRnb = /\br(&b|nb)\b/.test(normalizedQuery) || normalizedQuery.includes('soul')
  const alreadyRadioLike = ['radio', 'live', 'stream'].some((keyword) => normalizedQuery.includes(keyword))

  if (looksLikeRnb && !alreadyRadioLike) {
    return `${query} live radio chill stream`
  }

  return query
}

function parseIsoDurationSeconds(value: string | undefined): number {
  if (!value) {
    return 0
  }

  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value)
  if (!match) {
    return 0
  }

  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0)
}

function parseCount(value: string | undefined): number {
  return value ? Number(value) || 0 : 0
}

function scoreEmbedCandidate(track: Track, metadata: YouTubeVideoStatusItem): number {
  const title = normalizeText(metadata.snippet?.title ?? track.title)
  const duration = parseIsoDurationSeconds(metadata.contentDetails?.duration)
  let score = 0

  for (const keyword of ['live radio', 'radio', 'live', 'stream', 'chill', 'vibes', 'background', 'study', 'sleep', 'smooth', 'ambient', 'lofi', 'lo-fi']) {
    if (title.includes(keyword)) {
      score += 4
    }
  }

  for (const keyword of ['top songs', 'best songs', '8 hour', '8-hour', 'artist playlist', 'hits']) {
    if (title.includes(keyword)) {
      score -= 5
    }
  }

  if (metadata.snippet?.categoryId === '10') {
    score -= 2
  }

  if (metadata.contentDetails?.licensedContent === false) {
    score -= 1
  }

  if (duration >= 45 * 60 && duration <= 3 * 60 * 60) {
    score += 3
  } else if (duration > 4 * 60 * 60) {
    score -= 4
  }

  return score
}

function normalizeCandidateTitle(value: string): string {
  return normalizeText(value)
    .replace(/&amp;/g, '&')
    .replace(/\br(&|and)b\b/g, 'rnb')
    .replace(/\b(healing|relaxing|soulful|smooth|love|songs?|playlist|mix|radio|live|chill|vibes?|summer|background)\b/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function dedupeSimilarCandidates(tracks: Track[]): Track[] {
  const seen = new Set<string>()
  return tracks.filter((track) => {
    const fingerprint = `${normalizeText(track.artist)}::${normalizeCandidateTitle(track.title)}`
    if (seen.has(fingerprint)) {
      return false
    }

    seen.add(fingerprint)
    return true
  })
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

export class YouTubeProvider implements MusicProvider {
  readonly type = 'youtube' as const

  async search(query: string): Promise<Track[]> {
    const env = getAppEnv()
    if (env.youtubeApiKey) {
      const apiResults = await this.searchYouTubeDataApi(toSearchQuery(query), env.youtubeApiKey)
      if (apiResults.length > 0) {
        return apiResults
      }
    }

    const normalizedQuery = normalizeText(query)
    const localResults = FALLBACK_LIBRARY.youtube.filter((track) => {
      const haystack = [track.title, track.artist, ...track.tags].map(normalizeText)
      return haystack.some((part) => part.includes(normalizedQuery) || normalizedQuery.includes(part))
    })

    if (localResults.length > 0) {
      return localResults.map(toPlainTrack)
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
      const items: YouTubeSearchItem[] = []
      let pageToken: string | undefined

      for (let page = 0; page < 3; page += 1) {
        const url = new URL('https://www.googleapis.com/youtube/v3/search')
        url.searchParams.set('part', 'snippet')
        url.searchParams.set('q', query)
        url.searchParams.set('type', 'video')
        url.searchParams.set('maxResults', '25')
        url.searchParams.set('videoEmbeddable', 'true')
        url.searchParams.set('videoSyndicated', 'true')
        url.searchParams.set('key', apiKey)
        if (pageToken) {
          url.searchParams.set('pageToken', pageToken)
        }

        const response = await fetch(url)
        if (!response.ok) {
          break
        }

        const data = (await response.json()) as YouTubeSearchResponse
        items.push(...(data.items ?? []))
        pageToken = data.nextPageToken
        if (!pageToken) {
          break
        }
      }

      const candidates = items
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

      return this.filterPlayableVideos(candidates, apiKey)
    } catch (error) {
      console.debug('[YouTubeProvider] YouTube Data API search failed, using fallback', error)
      return []
    }
  }

  private async filterPlayableVideos(tracks: Track[], apiKey: string): Promise<Track[]> {
    const ids = tracks.map((track) => track.youtubeId ?? track.id).filter((id): id is string => Boolean(id))
    if (ids.length === 0) {
      return []
    }

    const metadataById = new Map<string, YouTubeVideoStatusItem>()
    for (const idChunk of chunk(ids, 50)) {
      const url = new URL('https://www.googleapis.com/youtube/v3/videos')
      url.searchParams.set('part', 'status,snippet,contentDetails,statistics')
      url.searchParams.set('id', idChunk.join(','))
      url.searchParams.set('key', apiKey)

      const response = await fetch(url)
      if (!response.ok) {
        continue
      }

      const data = (await response.json()) as YouTubeVideoStatusResponse
      for (const item of data.items ?? []) {
        if (item.id) {
          metadataById.set(item.id, item)
        }
      }
    }

    const filteredTracks = tracks
      .map((track, index) => {
        const id = track.youtubeId ?? track.id
        const metadata = metadataById.get(id)
        return {
          track: {
            ...track,
            duration: parseIsoDurationSeconds(metadata?.contentDetails?.duration) || track.duration,
            viewCount: parseCount(metadata?.statistics?.viewCount) || track.viewCount
          },
          metadata,
          index
        }
      })
      .filter(({ metadata }) => {
        const blockedRegions = metadata?.contentDetails?.regionRestriction?.blocked ?? []
        return (
          metadata?.status?.embeddable === true &&
          metadata.status.privacyStatus === 'public' &&
          metadata.status.uploadStatus === 'processed' &&
          blockedRegions.length === 0
        )
      })
      .sort((a, b) => {
        const scoreDelta = scoreEmbedCandidate(b.track, b.metadata as YouTubeVideoStatusItem) - scoreEmbedCandidate(a.track, a.metadata as YouTubeVideoStatusItem)
        if (scoreDelta !== 0) {
          return scoreDelta
        }

        const viewDelta = (b.track.viewCount ?? 0) - (a.track.viewCount ?? 0)
        return viewDelta !== 0 ? viewDelta : a.index - b.index
      })
      .map(({ track }) => track)

    return dedupeSimilarCandidates(filteredTracks)
  }
}

export function getYouTubeVideoId(track: Track | null): string | null {
  return track ? getTrackVideoId(track) : null
}
