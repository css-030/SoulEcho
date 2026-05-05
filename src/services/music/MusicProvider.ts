import type { MusicSource, Track } from '@/types/music'

export interface MusicProvider {
  readonly type: MusicSource

  search(query: string): Promise<Track[]>

  getPlayUrl(trackId: string): Promise<string>

  getPlaylist(playlistId: string): Promise<Track[]>

  getLyrics?(trackId: string): Promise<string>
}
