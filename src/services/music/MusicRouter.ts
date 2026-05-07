import { FALLBACK_LIBRARY } from '@/data/fallback-library'
import { FallbackProvider } from '@/services/music/FallbackProvider'
import { buildHealingSearchQueries, type HealingRecommendationContext } from '@/services/music/HealingRecommendation'
import type { MusicProvider } from '@/services/music/MusicProvider'
import { applyMusicTasteToQuery } from '@/services/music/MusicTasteAnalyzer'
import { NeteaseProvider } from '@/services/music/NeteaseProvider'
import { YouTubeProvider } from '@/services/music/YouTubeProvider'
import type { MusicRecommendation, MusicSource, Playlist, Track } from '@/types/music'
import type { MusicTasteProfile, SourceLock } from '@/types/settings'
import type { WuxingType } from '@/types/wuxing'

export interface PlayScenario {
  type: MusicRecommendation['scenario'] | 'fallback'
  lockedSource?: MusicSource
  sourceLock?: SourceLock
}

export class MusicRouter {
  private youtubeProvider: MusicProvider
  private neteaseProvider: MusicProvider
  private readonly fallbackProvider: FallbackProvider
  private musicTasteProfile?: MusicTasteProfile

  constructor(opts: { youtubeProvider?: MusicProvider; neteaseProvider?: MusicProvider; fallbackProvider?: FallbackProvider } = {}) {
    this.youtubeProvider = opts.youtubeProvider ?? new YouTubeProvider()
    this.neteaseProvider = opts.neteaseProvider ?? new NeteaseProvider()
    this.fallbackProvider = opts.fallbackProvider ?? new FallbackProvider()
  }

  configureNetease(opts: { baseUrl: string; cookie?: string }): void {
    this.neteaseProvider = new NeteaseProvider(opts.baseUrl, opts.cookie)
  }

  configureYouTube(opts: { apiKey?: string }): void {
    this.youtubeProvider = new YouTubeProvider(opts.apiKey)
  }

  configureMusicTasteProfile(profile?: MusicTasteProfile): void {
    this.musicTasteProfile = profile
  }

  selectProvider(scenario: PlayScenario): MusicProvider {
    if (scenario.sourceLock === 'youtube_only') {
      return this.youtubeProvider
    }

    if (scenario.sourceLock === 'netease_only') {
      return this.neteaseProvider
    }

    if (scenario.lockedSource === 'youtube') {
      return this.youtubeProvider
    }

    if (scenario.lockedSource === 'netease') {
      return this.neteaseProvider
    }

    if (scenario.lockedSource === 'fallback' || scenario.type === 'fallback') {
      return this.fallbackProvider
    }

    if (scenario.type === 'healing') {
      return this.neteaseProvider
    }

    return this.youtubeProvider
  }

  async search(recommendation: Pick<MusicRecommendation, 'scenario' | 'searchQuery' | 'targetWuxing'> & { sourceLock?: SourceLock }): Promise<Track[]> {
    const provider = this.selectProvider({ type: recommendation.scenario, sourceLock: recommendation.sourceLock })
    const query = recommendation.searchQuery ?? recommendation.targetWuxing ?? 'lofi relaxing music'
    return this.withFallback(() => provider.search(this.applyTaste(query)), recommendation.targetWuxing)
  }

  async getPlayableTrack(track: Track): Promise<Track> {
    if (track.source === 'fallback') {
      const playUrl = track.playUrl ?? (await this.fallbackProvider.getPlayUrl(track.youtubeId ?? track.id))
      return {
        ...track,
        id: track.youtubeId ?? track.id,
        source: 'youtube',
        playUrl
      }
    }

    const provider = this.selectProvider({ type: 'daily-bgm', lockedSource: track.source })

    try {
      const playUrl = track.playUrl ?? (await provider.getPlayUrl(track.neteaseId ?? track.youtubeId ?? track.id))
      return { ...track, playUrl }
    } catch (error) {
      console.debug('[MusicRouter] primary source failed, using fallback track', error)
      const fallbackTrack = this.fallbackProvider.findSimilar(track.wuxingTag)
      const playUrl = await this.youtubeProvider.getPlayUrl(fallbackTrack.youtubeId ?? fallbackTrack.id)
      return {
        ...fallbackTrack,
        id: fallbackTrack.youtubeId ?? fallbackTrack.id,
        source: 'youtube',
        playUrl
      }
    }
  }

  async getPlaylist(playlistId: string, source: MusicSource = 'youtube'): Promise<Playlist> {
    const provider = this.selectProvider({ type: 'daily-bgm', lockedSource: source })
    const tracks = await this.withFallback(() => provider.getPlaylist(playlistId))
    return {
      id: playlistId,
      source: tracks[0]?.source ?? source,
      title: this.getPlaylistTitle(playlistId),
      tracks
    }
  }

  async getHealingPlaylist(wuxing: WuxingType, context: HealingRecommendationContext = {}): Promise<Playlist> {
    const neteasePlaylist = FALLBACK_LIBRARY.netease.find((item) => item.wuxing === wuxing)
    const playlistId = neteasePlaylist?.playlistId ?? wuxing
    const tracks = await this.withFallback(
      async () => {
        try {
          for (const query of buildHealingSearchQueries(wuxing, context)) {
            try {
              const healingTracks = await this.neteaseProvider.search(query)
              return await this.resolvePlayableNeteaseTracks(healingTracks.map((track) => ({ ...track, wuxingTag: track.wuxingTag ?? wuxing })))
            } catch (error) {
              console.debug('[MusicRouter] healing search attempt failed', { query, error })
            }
          }
        } catch (error) {
          console.debug('[MusicRouter] context-based healing search failed, using configured healing playlist', error)
        }

        const playlistTracks = await this.neteaseProvider.getPlaylist(playlistId)
        return this.resolvePlayableNeteaseTracks(playlistTracks.map((track) => ({ ...track, wuxingTag: track.wuxingTag ?? wuxing })))
      },
      wuxing
    )

    return {
      id: playlistId,
      source: tracks[0]?.source ?? 'netease',
      title: this.getPlaylistTitle(wuxing),
      tracks,
      isHealingPlaylist: true,
      targetWuxing: wuxing
    }
  }

  async playWithFallback(track: Track): Promise<Track> {
    return this.getPlayableTrack(track)
  }

  async getReliableFallbackTrack(wuxing?: WuxingType): Promise<Track> {
    const fallbackTrack = this.fallbackProvider.findSimilar(wuxing)
    const playUrl = await this.youtubeProvider.getPlayUrl(fallbackTrack.youtubeId ?? fallbackTrack.id)

    return {
      ...fallbackTrack,
      id: fallbackTrack.youtubeId ?? fallbackTrack.id,
      source: 'youtube',
      playUrl
    }
  }

  async findCounterpart(track: Track): Promise<Track | null> {
    const targetSource: MusicSource = track.source === 'youtube' ? 'netease' : 'youtube'
    const provider = this.selectProvider({ type: 'user-requested', lockedSource: targetSource })

    try {
      const results = await provider.search(`${track.title} ${track.artist}`)
      return results[0] ?? null
    } catch (error) {
      console.debug('[MusicRouter] counterpart search failed', error)
      return null
    }
  }

  private async withFallback<T>(action: () => Promise<T>, wuxing?: WuxingType): Promise<T> {
    try {
      const result = await action()
      if (Array.isArray(result) && result.length === 0) {
        throw new Error('Music provider returned no tracks')
      }

      return result
    } catch (error) {
      console.debug('[MusicRouter] provider unavailable, falling back', error)
      return [this.fallbackProvider.findSimilar(wuxing)] as T
    }
  }

  private async resolvePlayableNeteaseTracks(tracks: Track[]): Promise<Track[]> {
    const playableTracks: Track[] = []
    const targetPlayableCount = 5

    for (const track of tracks) {
      if (track.source !== 'netease') {
        playableTracks.push(track)
        if (playableTracks.length >= targetPlayableCount) {
          break
        }
        continue
      }

      try {
        const playUrl = track.playUrl ?? (await this.neteaseProvider.getPlayUrl(track.neteaseId ?? track.id))
        playableTracks.push({ ...track, playUrl })
        if (playableTracks.length >= targetPlayableCount) {
          break
        }
      } catch {
        // Skip tracks whose NetEase play URL is unavailable and keep the session on NetEase when possible.
      }
    }

    if (playableTracks.length > 0) {
      return playableTracks
    }

    throw new Error('No playable NetEase healing tracks')
  }

  private applyTaste(query: string): string {
    return applyMusicTasteToQuery(query, this.musicTasteProfile)
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
