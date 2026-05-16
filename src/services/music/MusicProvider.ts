import type { MusicSource, PlaylistCandidate, Track } from '@/types/music'

export interface MusicProvider {
  readonly type: MusicSource

  search(query: string): Promise<Track[]>

  searchPlaylists?(query: string): Promise<PlaylistCandidate[]>

  getPlayUrl(trackId: string): Promise<string>

  getPlaylist(playlistId: string): Promise<Track[]>

  getLyrics?(trackId: string): Promise<string>
}
