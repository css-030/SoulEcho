import { afterEach, describe, expect, it, vi } from 'vitest'

import { FallbackProvider } from '@/services/music/FallbackProvider'
import { musicRouter } from '@/services/music/MusicRouter'
import { NeteaseProvider } from '@/services/music/NeteaseProvider'
import { YouTubeProvider } from '@/services/music/YouTubeProvider'
import type { Track } from '@/types/music'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('YouTubeProvider', () => {
  it('returns a local fallback match by wuxing tag', async () => {
    const provider = new YouTubeProvider()

    const tracks = await provider.search('wood 古琴')

    expect(tracks.length).toBeGreaterThan(0)
    expect(tracks[0].source).toBe('youtube')
    expect(tracks[0].youtubeId).toBeTruthy()
  })

  it('never returns an empty search result', async () => {
    const provider = new YouTubeProvider()

    const tracks = await provider.search('a query that should not exist locally')

    expect(tracks).toHaveLength(1)
    expect(tracks[0].source).toBe('youtube')
  })

  it('returns a youtube play url', async () => {
    const provider = new YouTubeProvider()

    await expect(provider.getPlayUrl('demo-video')).resolves.toBe('youtube://demo-video')
  })
})

describe('MusicRouter', () => {
  it('selects YouTube for daily BGM', () => {
    expect(musicRouter.selectProvider({ type: 'daily-bgm' }).type).toBe('youtube')
  })

  it('selects NetEase for healing', () => {
    expect(musicRouter.selectProvider({ type: 'healing' }).type).toBe('netease')
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
})

describe('FallbackProvider', () => {
  it('returns a playable ultimate fallback track', async () => {
    const provider = new FallbackProvider()
    const tracks = await provider.search('not found')

    expect(tracks[0].source).toBe('fallback')
    expect(tracks[0].youtubeId).toBeTruthy()
  })
})
