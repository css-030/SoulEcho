import { afterEach, describe, expect, it, vi } from 'vitest'

import { FallbackProvider } from '@/services/music/FallbackProvider'
import { MusicRouter, musicRouter } from '@/services/music/MusicRouter'
import { NeteaseProvider } from '@/services/music/NeteaseProvider'
import { YouTubeProvider } from '@/services/music/YouTubeProvider'
import type { Track } from '@/types/music'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('YouTubeProvider', () => {
  it('returns a local fallback match by wuxing tag', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] })
    } as Response)

    const provider = new YouTubeProvider()

    const tracks = await provider.search('wood 古琴')

    expect(tracks.length).toBeGreaterThan(0)
    expect(tracks[0].source).toBe('youtube')
    expect(tracks[0].youtubeId).toBeTruthy()
  })

  it('includes daily YouTube fallback candidates', async () => {
    const provider = new YouTubeProvider()

    const tracks = await provider.getPlaylist('daily')
    const youtubeIds = tracks.map((track) => track.youtubeId)

    expect(youtubeIds).toContain('xvv44XEqcHI')
  })

  it('never returns an empty search result', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] })
    } as Response)

    const provider = new YouTubeProvider()

    const tracks = await provider.search('a query that should not exist locally')

    expect(tracks).toHaveLength(1)
    expect(tracks[0].source).toBe('youtube')
  })

  it('returns a youtube play url', async () => {
    const provider = new YouTubeProvider()

    await expect(provider.getPlayUrl('demo-video')).resolves.toBe('youtube://demo-video')
  })

  it('asks YouTube Data API for embeddable videos when an api key exists', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: { videoId: 'demo-video' },
              snippet: {
                title: 'Demo Video',
                channelTitle: 'Demo Channel',
                thumbnails: { medium: { url: 'https://example.com/thumb.jpg' } }
              }
            }
          ]
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'demo-video',
              status: {
                embeddable: true,
                privacyStatus: 'public',
                uploadStatus: 'processed'
              }
            }
          ]
        })
      } as Response)

    const provider = new YouTubeProvider()
    const tracks = await provider.search('ambient city radio without local match')
    const url = new URL(String(fetchMock.mock.calls[0][0]))

    expect(url.searchParams.get('videoEmbeddable')).toBe('true')
    expect(url.searchParams.get('videoSyndicated')).toBe('true')
    expect(new URL(String(fetchMock.mock.calls[1][0])).pathname).toBe('/youtube/v3/videos')
    expect(tracks[0]).toMatchObject({
      id: 'demo-video',
      source: 'youtube',
      title: 'Demo Video'
    })
  })

  it('biases R&B searches toward live radio before falling back', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] })
      } as Response)

    const provider = new YouTubeProvider()
    await provider.search('R&B playlist')

    const url = new URL(String(fetchMock.mock.calls[0][0]))
    expect(url.searchParams.get('q')).toBe('R&B playlist live radio chill stream')
    expect(url.searchParams.get('maxResults')).toBe('25')
  })

  it('continues YouTube search with page tokens before filtering candidates', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          nextPageToken: 'next-page',
          items: [
            {
              id: { videoId: 'first-page-video' },
              snippet: { title: 'First Page', channelTitle: 'Demo' }
            }
          ]
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: { videoId: 'second-page-video' },
              snippet: { title: 'Second Page', channelTitle: 'Demo' }
            }
          ]
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'first-page-video',
              snippet: { title: 'First Page', categoryId: '22' },
              status: { embeddable: true, privacyStatus: 'public', uploadStatus: 'processed' },
              contentDetails: { duration: 'PT1H', licensedContent: true }
            },
            {
              id: 'second-page-video',
              snippet: { title: 'Second Page', categoryId: '22' },
              status: { embeddable: true, privacyStatus: 'public', uploadStatus: 'processed' },
              contentDetails: { duration: 'PT1H', licensedContent: true }
            }
          ]
        })
      } as Response)

    const provider = new YouTubeProvider()
    const tracks = await provider.search('ambient city radio without local match')

    expect(new URL(String(fetchMock.mock.calls[1][0])).searchParams.get('pageToken')).toBe('next-page')
    expect(new URL(String(fetchMock.mock.calls[2][0])).pathname).toBe('/youtube/v3/videos')
    expect(tracks.map((track) => track.id)).toEqual(['first-page-video', 'second-page-video'])
  })

  it('filters out videos that are not embeddable after search', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: { videoId: 'blocked-video' },
              snippet: { title: 'Blocked', channelTitle: 'Demo' }
            },
            {
              id: { videoId: 'playable-video' },
              snippet: { title: 'Playable', channelTitle: 'Demo' }
            }
          ]
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'blocked-video',
              status: { embeddable: false, privacyStatus: 'public', uploadStatus: 'processed' }
            },
            {
              id: 'playable-video',
              status: { embeddable: true, privacyStatus: 'public', uploadStatus: 'processed' }
            }
          ]
        })
      } as Response)

    const provider = new YouTubeProvider()
    const tracks = await provider.search('ambient city radio without local match')

    expect(tracks).toHaveLength(1)
    expect(tracks[0].id).toBe('playable-video')
  })

  it('prefers chill embed-friendly candidates over risky music playlists', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: { videoId: 'risky-video' },
              snippet: { title: '8 HOUR R&B MIX 2025 | SZA Summer Playlist', channelTitle: 'Noise Complaints' }
            },
            {
              id: { videoId: 'smooth-video' },
              snippet: { title: 'Soulful R&B Vibes Smooth Love Songs Chill Mix', channelTitle: 'Smooth Moonlight R&B' }
            },
            {
              id: { videoId: 'blocked-region-video' },
              snippet: { title: 'R&B Live Radio', channelTitle: 'Blocked Channel' }
            }
          ]
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'risky-video',
              snippet: { title: '8 HOUR R&B MIX 2025 | SZA Summer Playlist', categoryId: '10' },
              status: { embeddable: true, privacyStatus: 'public', uploadStatus: 'processed' },
              contentDetails: { duration: 'PT7H47M49S', licensedContent: false }
            },
            {
              id: 'smooth-video',
              snippet: { title: 'Soulful R&B Vibes Smooth Love Songs Chill Mix', categoryId: '22' },
              status: { embeddable: true, privacyStatus: 'public', uploadStatus: 'processed' },
              contentDetails: { duration: 'PT2H9M59S', licensedContent: true }
            },
            {
              id: 'blocked-region-video',
              snippet: { title: 'R&B Live Radio', categoryId: '10' },
              status: { embeddable: true, privacyStatus: 'public', uploadStatus: 'processed' },
              contentDetails: { duration: 'PT2H', licensedContent: true, regionRestriction: { blocked: ['RU'] } }
            }
          ]
        })
      } as Response)

    const provider = new YouTubeProvider()
    const tracks = await provider.search('r&b live radio')

    expect(tracks.map((track) => track.id)).toEqual(['smooth-video', 'risky-video'])
    expect(tracks[0].duration).toBe(7799)
  })

  it('dedupes similar YouTube candidates from the same channel', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: { videoId: 'healing-video' },
              snippet: { title: '[R&B Soul] Healing Chill Playlist - Smooth Vibes', channelTitle: 'Chill Soul Radio' }
            },
            {
              id: { videoId: 'relaxing-video' },
              snippet: { title: '[R&B Soul] Relaxing Chill Playlist - Smooth Vibes', channelTitle: 'Chill Soul Radio' }
            },
            {
              id: { videoId: 'other-channel-video' },
              snippet: { title: '[R&B Soul] Relaxing Chill Playlist - Smooth Vibes', channelTitle: 'Night Soul Radio' }
            }
          ]
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: ['healing-video', 'relaxing-video', 'other-channel-video'].map((id) => ({
            id,
            snippet: { title: id === 'healing-video' ? '[R&B Soul] Healing Chill Playlist - Smooth Vibes' : '[R&B Soul] Relaxing Chill Playlist - Smooth Vibes', categoryId: '22' },
            status: { embeddable: true, privacyStatus: 'public', uploadStatus: 'processed' },
            contentDetails: { duration: 'PT2H', licensedContent: true }
          }))
        })
      } as Response)

    const provider = new YouTubeProvider()
    const tracks = await provider.search('r&b live radio')

    expect(tracks.map((track) => track.id)).toEqual(['healing-video', 'other-channel-video'])
  })

  it('orders equally suitable YouTube candidates by view count', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: { videoId: 'small-video' },
              snippet: { title: 'Indie R&B Radio Live', channelTitle: 'Indie Radio' }
            },
            {
              id: { videoId: 'popular-video' },
              snippet: { title: 'Neo Soul Radio Live', channelTitle: 'Neo Radio' }
            }
          ]
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'small-video',
              snippet: { title: 'Indie R&B Radio Live', categoryId: '22' },
              status: { embeddable: true, privacyStatus: 'public', uploadStatus: 'processed' },
              contentDetails: { duration: 'PT1H', licensedContent: true },
              statistics: { viewCount: '1000' }
            },
            {
              id: 'popular-video',
              snippet: { title: 'Neo Soul Radio Live', categoryId: '22' },
              status: { embeddable: true, privacyStatus: 'public', uploadStatus: 'processed' },
              contentDetails: { duration: 'PT1H', licensedContent: true },
              statistics: { viewCount: '9000' }
            }
          ]
        })
      } as Response)

    const provider = new YouTubeProvider()
    const tracks = await provider.search('r&b live radio')

    expect(tracks.map((track) => track.id)).toEqual(['popular-video', 'small-video'])
    expect(tracks[0].viewCount).toBe(9000)
  })
})

describe('MusicRouter', () => {
  it('selects YouTube for daily BGM', () => {
    expect(musicRouter.selectProvider({ type: 'daily-bgm' }).type).toBe('youtube')
  })

  it('selects NetEase for healing', () => {
    expect(musicRouter.selectProvider({ type: 'healing' }).type).toBe('netease')
  })

  it('falls back to the environment YouTube key when settings contain a blank key', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: { videoId: 'env-video' },
              snippet: { title: 'Env Video', channelTitle: 'Env Channel' }
            }
          ]
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'env-video',
              status: { embeddable: true, privacyStatus: 'public', uploadStatus: 'processed' }
            }
          ]
        })
      } as Response)

    const provider = new YouTubeProvider('')
    await provider.search('ambient city radio without local match')

    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('key')).toBeTruthy()
  })

  it('respects a YouTube source lock even for healing scenarios', () => {
    expect(musicRouter.selectProvider({ type: 'healing', sourceLock: 'youtube_only' }).type).toBe('youtube')
  })

  it('respects a NetEase source lock for daily recommendations', () => {
    expect(musicRouter.selectProvider({ type: 'daily-bgm', sourceLock: 'netease_only' }).type).toBe('netease')
  })

  it('configures YouTube provider with an editable api key', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: Array.from({ length: 5 }, (_, index) => ({
            id: { videoId: `configured-video-${index}` },
            snippet: { title: `Configured Video ${index}`, channelTitle: 'Configured Channel' }
          }))
        })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: Array.from({ length: 5 }, (_, index) => ({
            id: `configured-video-${index}`,
            status: { embeddable: true, privacyStatus: 'public', uploadStatus: 'processed' }
          }))
        })
      } as Response)
    const router = new MusicRouter()

    router.configureYouTube({ apiKey: 'settings-youtube-key' })
    await router.search({ scenario: 'daily-bgm', searchQuery: 'ambient city radio without local match' })

    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('key')).toBe('settings-youtube-key')
  })

  it('adds style-only music taste hints to daily provider searches', async () => {
    const searchMock = vi.fn(async (_query: string): Promise<Track[]> =>
      Array.from({ length: 5 }, (_, index) => ({
        id: `taste-track-${index}`,
        source: 'youtube' as const,
        title: `Taste Track ${index}`,
        artist: 'YouTube',
        duration: 0
      }))
    )
    const router = new MusicRouter({
      youtubeProvider: {
        type: 'youtube',
        search: searchMock,
        getPlayUrl: async (trackId: string) => `youtube://${trackId}`,
        getPlaylist: async () => []
      }
    })

    router.configureMusicTasteProfile({
      source: 'netease_liked',
      updatedAt: 123,
      sampledTrackCount: 2,
      topArtists: ['SZA'],
      styleTags: ['R&B'],
      languageHints: ['英文'],
      seedTracks: ['Good Days - SZA'],
      searchBias: 'R&B SZA 英文 songs'
    })
    await router.search({ scenario: 'daily-bgm', searchQuery: 'relaxing live radio' })

    expect(searchMock).toHaveBeenCalledWith('relaxing live radio R&B')
  })

  it('supplements sparse daily YouTube results with nearby background queries', async () => {
    const searchMock = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: 'first-track',
          source: 'youtube' as const,
          title: 'First Track',
          artist: 'YouTube',
          duration: 0
        }
      ])
      .mockResolvedValueOnce([
        {
          id: 'second-track',
          source: 'youtube' as const,
          title: 'Second Track',
          artist: 'YouTube',
          duration: 0
        },
        {
          id: 'third-track',
          source: 'youtube' as const,
          title: 'Third Track',
          artist: 'YouTube',
          duration: 0
        }
      ])
      .mockResolvedValueOnce([
        {
          id: 'fourth-track',
          source: 'youtube' as const,
          title: 'Fourth Track',
          artist: 'YouTube',
          duration: 0
        },
        {
          id: 'fifth-track',
          source: 'youtube' as const,
          title: 'Fifth Track',
          artist: 'YouTube',
          duration: 0
        }
      ])
    const router = new MusicRouter({
      youtubeProvider: {
        type: 'youtube',
        search: searchMock,
        getPlayUrl: async (trackId: string) => `youtube://${trackId}`,
        getPlaylist: async () => []
      }
    })

    const tracks = await router.search({ scenario: 'daily-bgm', searchQuery: 'R&B soul live radio chill stream' })

    expect(searchMock).toHaveBeenNthCalledWith(1, 'R&B soul live radio chill stream')
    expect(searchMock).toHaveBeenNthCalledWith(2, 'neo soul live radio chill stream')
    expect(searchMock).toHaveBeenNthCalledWith(3, 'smooth r&b live radio chill stream')
    expect(tracks.map((track) => track.id)).toEqual(['first-track', 'second-track', 'third-track', 'fourth-track', 'fifth-track'])
  })

  it('keeps user-requested searches within matching taste styles without forcing artists', async () => {
    const searchMock = vi.fn(async (_query: string): Promise<Track[]> => [
      {
        id: 'taste-track',
        source: 'youtube' as const,
        title: 'Taste Track',
        artist: 'YouTube',
        duration: 0
      }
    ])
    const router = new MusicRouter({
      youtubeProvider: {
        type: 'youtube',
        search: searchMock,
        getPlayUrl: async (trackId: string) => `youtube://${trackId}`,
        getPlaylist: async () => []
      }
    })

    router.configureMusicTasteProfile({
      source: 'netease_liked',
      updatedAt: 123,
      sampledTrackCount: 2,
      topArtists: ['SZA'],
      styleTags: ['R&B'],
      languageHints: ['英文'],
      seedTracks: ['Good Days - SZA'],
      searchBias: 'R&B SZA 英文 songs'
    })
    await router.search({ scenario: 'user-requested', searchQuery: 'relaxing live radio' })

    expect(searchMock).toHaveBeenCalledWith('relaxing live radio R&B')
  })

  it('wraps a track with a lazy play URL', async () => {
    const track: Track = {
      id: 'demo-video',
      source: 'youtube',
      title: 'Demo',
      artist: 'SoulEcho',
      duration: 0,
      youtubeId: 'demo-video'
    }

    const playableTrack = await musicRouter.getPlayableTrack(track)

    expect(playableTrack.playUrl).toBe('youtube://demo-video')
  })

  it('skips unavailable NetEase healing tracks before falling back to YouTube', async () => {
    const router = new MusicRouter({
      neteaseProvider: {
        type: 'netease',
        search: async () => [],
        searchPlaylists: async () => [],
        getPlaylist: async () => [
          {
            id: 'broken-track',
            source: 'netease',
            title: 'Broken',
            artist: 'NetEase',
            duration: 120,
            neteaseId: 'broken-track'
          },
          {
            id: 'playable-track',
            source: 'netease',
            title: 'Playable',
            artist: 'NetEase',
            duration: 120,
            neteaseId: 'playable-track'
          }
        ],
        getPlayUrl: async (trackId: string) => {
          if (trackId === 'broken-track') {
            throw new Error('unavailable')
          }

          return 'https://music.example/playable.mp3'
        }
      }
    })

    const playlist = await router.getHealingPlaylist('wood')

    expect(playlist.source).toBe('netease')
    expect(playlist.tracks).toHaveLength(1)
    expect(playlist.tracks[0]).toMatchObject({
      id: 'playable-track',
      playUrl: 'https://music.example/playable.mp3'
    })
  })

  it('uses provider-friendly playlist search terms derived from healing attributes rather than raw context or music taste', async () => {
    const searchPlaylistsMock = vi.fn(async () => [
      {
        id: 'healing-playlist',
        source: 'netease' as const,
        title: 'Healing Playlist'
      }
    ])
    const router = new MusicRouter({
      neteaseProvider: {
        type: 'netease',
        search: async () => [],
        searchPlaylists: searchPlaylistsMock,
        getPlaylist: async () => [
          {
            id: 'healing-track',
            source: 'netease' as const,
            title: 'Healing Track',
            artist: 'NetEase',
            duration: 120,
            neteaseId: 'healing-track'
          },
          {
            id: 'healing-track-2',
            source: 'netease' as const,
            title: 'Healing Track 2',
            artist: 'NetEase',
            duration: 120,
            neteaseId: 'healing-track-2'
          }
        ],
        getPlayUrl: async () => 'https://music.example/healing.mp3'
      }
    })

    router.configureMusicTasteProfile({
      source: 'netease_liked',
      updatedAt: 123,
      sampledTrackCount: 2,
      topArtists: ['SZA'],
      styleTags: ['R&B'],
      languageHints: ['英文'],
      seedTracks: ['Good Days - SZA'],
      searchBias: 'R&B SZA 英文 songs'
    })
    await router.getHealingPlaylist('fire', {
      now: new Date('2026-05-15T22:00:00+08:00'),
      weather: { description: '小雨', temperature: 31, casualSummary: '广州现在小雨' }
    })

    const query = (searchPlaylistsMock.mock.calls as unknown as Array<[string]>)[0]?.[0] ?? ''
    expect(query).toContain('古筝')
    expect(query).toContain('雨声')
    expect(query).not.toContain('徵调')
    expect(query).not.toContain('助眠')
    expect(query).not.toContain('夜晚')
    expect(query).not.toContain('SZA')
  })

  it('retries healing searches with broader queries before using the configured fallback playlist', async () => {
    const searchPlaylistsMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('rich query failed'))
      .mockResolvedValueOnce([
        {
          id: 'healing-playlist',
          source: 'netease' as const,
          title: 'Healing Playlist'
        }
      ])
    const getPlaylistMock = vi.fn(async () => [
      {
        id: 'healing-track',
        source: 'netease' as const,
        title: 'Healing Track',
        artist: 'NetEase',
        duration: 120,
        neteaseId: 'healing-track'
      },
      {
        id: 'healing-track-2',
        source: 'netease' as const,
        title: 'Healing Track 2',
        artist: 'NetEase',
        duration: 120,
        neteaseId: 'healing-track-2'
      }
    ])
    const router = new MusicRouter({
      neteaseProvider: {
        type: 'netease',
        search: async () => [],
        searchPlaylists: searchPlaylistsMock,
        getPlaylist: getPlaylistMock,
        getPlayUrl: async () => 'https://music.example/healing.mp3'
      }
    })

    const playlist = await router.getHealingPlaylist('wood', {
      now: new Date('2026-05-15T18:19:00+08:00'),
      weather: { description: '小雨', temperature: 28, casualSummary: '广州现在小雨' }
    })

    expect(searchPlaylistsMock).toHaveBeenCalledTimes(2)
    expect(searchPlaylistsMock).toHaveBeenNthCalledWith(1, '古琴 流水 雨声')
    expect(searchPlaylistsMock).toHaveBeenNthCalledWith(2, '古琴 流水')
    expect(getPlaylistMock).toHaveBeenCalledWith('healing-playlist')
    expect(playlist.tracks[0]).toMatchObject({ id: 'healing-track' })
    expect(playlist).toMatchObject({ id: 'healing-playlist', title: 'Healing Playlist' })
  })

  it('skips healing playlist candidates that do not contain enough playable tracks', async () => {
    const router = new MusicRouter({
      neteaseProvider: {
        type: 'netease',
        search: async () => [],
        searchPlaylists: async () => [
          { id: 'thin-playlist', source: 'netease', title: 'Thin Playlist' },
          { id: 'usable-playlist', source: 'netease', title: 'Usable Playlist' }
        ],
        getPlaylist: async (playlistId: string) =>
          playlistId === 'thin-playlist'
            ? [
                {
                  id: 'only-track',
                  source: 'netease',
                  title: 'Only Track',
                  artist: 'NetEase',
                  duration: 120,
                  neteaseId: 'only-track'
                }
              ]
            : [
                {
                  id: 'first-track',
                  source: 'netease',
                  title: 'First Track',
                  artist: 'NetEase',
                  duration: 120,
                  neteaseId: 'first-track'
                },
                {
                  id: 'second-track',
                  source: 'netease',
                  title: 'Second Track',
                  artist: 'NetEase',
                  duration: 120,
                  neteaseId: 'second-track'
                }
              ],
        getPlayUrl: async (trackId: string) => `https://music.example/${trackId}.mp3`
      }
    })

    const playlist = await router.getHealingPlaylist('wood')

    expect(playlist).toMatchObject({
      id: 'usable-playlist',
      title: 'Usable Playlist'
    })
    expect(playlist.tracks.map((track) => track.id)).toEqual(['first-track', 'second-track'])
  })
})

describe('NeteaseProvider', () => {
  it('maps search results to unified tracks', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          songs: [
            {
              id: 28815013,
              name: '流水',
              artists: [{ name: '龚一' }],
              duration: 360000,
              album: { picUrl: 'https://example.com/cover.jpg' }
            }
          ]
        }
      })
    } as Response)

    const provider = new NeteaseProvider('http://localhost:3000')
    const tracks = await provider.search('流水')

    expect(tracks[0]).toMatchObject({
      id: '28815013',
      source: 'netease',
      title: '流水',
      artist: '龚一',
      duration: 360,
      neteaseId: '28815013'
    })
  })

  it('returns a NetEase play URL', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 28815013, url: 'https://music.example/track.mp3' }]
      })
    } as Response)

    const provider = new NeteaseProvider('http://localhost:3000')

    await expect(provider.getPlayUrl('28815013')).resolves.toBe('https://music.example/track.mp3')
  })

  it('uses cloudsearch for NetEase search', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ result: { songs: [] } })
    } as Response)

    const provider = new NeteaseProvider('http://localhost:3000')
    await provider.search('demo')

    expect(new URL(String(fetchMock.mock.calls[0][0])).pathname).toBe('/cloudsearch')
  })

  it('uses cloudsearch playlist mode for NetEase playlist search', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          playlists: [{ id: 123, name: '古琴疗愈', coverImgUrl: 'https://example.com/playlist.jpg', trackCount: 20 }]
        }
      })
    } as Response)

    const provider = new NeteaseProvider('http://localhost:3000')
    const playlists = await provider.searchPlaylists('古琴 流水')
    const url = new URL(String(fetchMock.mock.calls[0][0]))

    expect(url.pathname).toBe('/cloudsearch')
    expect(url.searchParams.get('type')).toBe('1000')
    expect(playlists[0]).toMatchObject({
      id: '123',
      source: 'netease',
      title: '古琴疗愈'
    })
  })

  it('requests standard bitrate NetEase play URLs', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 28815013, url: 'https://music.example/track.mp3' }]
      })
    } as Response)

    const provider = new NeteaseProvider('http://localhost:3000')
    await provider.getPlayUrl('28815013')

    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('br')).toBe('128000')
  })

  it('loads NetEase album tracks when playlist id is an album reference', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        songs: [
          {
            id: 51119601,
            name: 'Wood Healing',
            artists: [{ name: 'NetEase' }],
            duration: 120000
          }
        ]
      })
    } as Response)

    const provider = new NeteaseProvider('http://localhost:3000')
    const tracks = await provider.getPlaylist('album:511196')
    const url = new URL(String(fetchMock.mock.calls[0][0]))

    expect(url.pathname).toBe('/album')
    expect(url.searchParams.get('id')).toBe('511196')
    expect(tracks[0]).toMatchObject({
      id: '51119601',
      source: 'netease',
      title: 'Wood Healing'
    })
  })
})

describe('FallbackProvider', () => {
  it('returns a playable ultimate fallback track', async () => {
    const provider = new FallbackProvider()
    const tracks = await provider.search('not found')

    expect(tracks[0].source).toBe('fallback')
    expect(tracks[0].youtubeId).toBeTruthy()
  })
})
