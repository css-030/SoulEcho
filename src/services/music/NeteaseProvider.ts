import { getAppEnv } from '@/services/config/env'
import type { MusicProvider } from '@/services/music/MusicProvider'
import type { Track } from '@/types/music'

interface NeteaseArtist {
  name?: string
}

interface NeteaseAlbum {
  picUrl?: string
}

interface NeteaseSong {
  id?: number | string
  name?: string
  artists?: NeteaseArtist[]
  ar?: NeteaseArtist[]
  duration?: number
  dt?: number
  album?: NeteaseAlbum
  al?: NeteaseAlbum
}

interface NeteaseSearchResponse {
  result?: {
    songs?: NeteaseSong[]
  }
}

interface NeteaseUrlResponse {
  data?: Array<{
    id?: number | string
    url?: string | null
  }>
}

interface NeteasePlaylistResponse {
  playlist?: {
    tracks?: NeteaseSong[]
  }
}

interface NeteaseAlbumResponse {
  songs?: NeteaseSong[]
}

function toSeconds(durationMs: number | undefined): number {
  return durationMs ? Math.round(durationMs / 1000) : 0
}

function getArtists(song: NeteaseSong): string {
  const artists = song.artists ?? song.ar ?? []
  const names = artists.map((artist) => artist.name).filter((name): name is string => Boolean(name))
  return names.length > 0 ? names.join(' / ') : '网易云音乐'
}

function mapSongToTrack(song: NeteaseSong): Track | null {
  if (song.id === undefined || !song.name) {
    return null
  }

  const id = String(song.id)
  return {
    id,
    source: 'netease',
    title: song.name,
    artist: getArtists(song),
    duration: toSeconds(song.duration ?? song.dt),
    thumbnailUrl: song.album?.picUrl ?? song.al?.picUrl,
    neteaseId: id
  }
}

export class NeteaseProvider implements MusicProvider {
  readonly type = 'netease' as const
  private readonly baseUrl: string
  private readonly cookie?: string

  constructor(baseUrl = getAppEnv().neteaseApiUrl, cookie?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.cookie = cookie
  }

  async search(query: string): Promise<Track[]> {
    const url = this.createUrl('/cloudsearch')
    url.searchParams.set('keywords', query)
    url.searchParams.set('limit', '10')
    url.searchParams.set('type', '1')

    const data = await this.fetchJson<NeteaseSearchResponse>(url)
    return (data.result?.songs ?? []).map(mapSongToTrack).filter((track): track is Track => track !== null)
  }

  async getPlayUrl(trackId: string): Promise<string> {
    const url = this.createUrl('/song/url')
    url.searchParams.set('id', trackId)
    url.searchParams.set('br', '128000')

    const data = await this.fetchJson<NeteaseUrlResponse>(url)
    const playUrl = data.data?.find((item) => String(item.id) === trackId || item.url)?.url
    if (!playUrl) {
      throw new Error(`NetEase play URL not available for track ${trackId}`)
    }

    return playUrl
  }

  async getPlaylist(playlistId: string): Promise<Track[]> {
    if (playlistId.startsWith('album:')) {
      return this.getAlbum(playlistId.slice('album:'.length))
    }

    const url = this.createUrl('/playlist/detail')
    url.searchParams.set('id', playlistId)

    const data = await this.fetchJson<NeteasePlaylistResponse>(url)
    return (data.playlist?.tracks ?? []).map(mapSongToTrack).filter((track): track is Track => track !== null)
  }

  private async getAlbum(albumId: string): Promise<Track[]> {
    const url = this.createUrl('/album')
    url.searchParams.set('id', albumId)

    const data = await this.fetchJson<NeteaseAlbumResponse>(url)
    return (data.songs ?? []).map(mapSongToTrack).filter((track): track is Track => track !== null)
  }

  private createUrl(path: string): URL {
    const url = new URL(`${this.baseUrl}${path}`)
    if (this.cookie) {
      url.searchParams.set('cookie', this.cookie)
    }

    return url
  }

  private async fetchJson<T>(url: URL): Promise<T> {
    const controller = new AbortController()
    const timeout = globalThis.setTimeout(() => controller.abort(), 8000)

    let response: Response
    try {
      response = await fetch(url, { signal: controller.signal })
    } finally {
      globalThis.clearTimeout(timeout)
    }

    if (!response.ok) {
      throw new Error(`NetEase request failed with ${response.status}`)
    }

    return (await response.json()) as T
  }
}
