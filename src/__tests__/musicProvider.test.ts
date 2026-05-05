import { describe, expect, it } from 'vitest'

import { musicRouter } from '@/services/music/MusicRouter'
import { YouTubeProvider } from '@/services/music/YouTubeProvider'
import type { Track } from '@/types/music'

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
