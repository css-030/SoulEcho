import { YouTubeProvider } from '@/services/music/YouTubeProvider'
import type { MusicProvider } from '@/services/music/MusicProvider'
import type { MusicRecommendation, MusicSource, Playlist, Track } from '@/types/music'

export interface PlayScenario {
  type: MusicRecommendation['scenario'] | 'fallback'
  lockedSource?: MusicSource
}

export class MusicRouter {
  private readonly youtubeProvider: MusicProvider

  constructor(opts: { youtubeProvider?: MusicProvider } = {}) {
    this.youtubeProvider = opts.youtubeProvider ?? new YouTubeProvider()
  }

  selectProvider(scenario: PlayScenario): MusicProvider {
    if (scenario.lockedSource === 'youtube') {
      return this.youtubeProvider
    }

    if (scenario.type === 'daily-bgm' || scenario.type === 'user-requested' || scenario.type === 'fallback') {
      return this.youtubeProvider
    }

    return this.youtubeProvider
  }

  async search(recommendation: Pick<MusicRecommendation, 'scenario' | 'searchQuery' | 'targetWuxing'>): Promise<Track[]> {
    const provider = this.selectProvider({ type: recommendation.scenario })
    const query = recommendation.searchQuery ?? recommendation.targetWuxing ?? 'lofi relaxing music'
    return provider.search(query)
  }

  async getPlayableTrack(track: Track): Promise<Track> {
    const provider = this.selectProvider({ type: 'daily-bgm', lockedSource: track.source })
    const playUrl = track.playUrl ?? (await provider.getPlayUrl(track.youtubeId ?? track.id))
    return { ...track, playUrl }
  }

  async getPlaylist(playlistId: string, source: MusicSource = 'youtube'): Promise<Playlist> {
    const provider = this.selectProvider({ type: 'daily-bgm', lockedSource: source })
    const tracks = await provider.getPlaylist(playlistId)
    return {
      id: playlistId,
      source,
      title: this.getPlaylistTitle(playlistId),
      tracks
    }
  }

  private getPlaylistTitle(playlistId: string): string {
    const titles: Record<string, string> = {
      daily: '日常陪伴 BGM',
      wood: '角调 · 疏肝舒展',
      fire: '徵调 · 安神养心',
      earth: '宫调 · 稳定脾土',
      metal: '商调 · 润肺宁心',
      water: '羽调 · 滋肾安神'
    }

    return titles[playlistId] ?? 'SoulEcho BGM'
  }
}

export const musicRouter = new MusicRouter()
