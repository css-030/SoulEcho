import { describe, expect, it } from 'vitest'

import { analyzeMusicTaste, applyMusicTasteToQuery } from '@/services/music/MusicTasteAnalyzer'

describe('MusicTasteAnalyzer', () => {
  it('summarizes NetEase liked tracks into a compact taste profile', () => {
    const profile = analyzeMusicTaste(
      [
        { title: 'Best Part', artists: ['Daniel Caesar', 'H.E.R.'] },
        { title: 'Good Days', artists: ['SZA'] },
        { title: '普通朋友', artists: ['陶喆'] },
        { title: '特别的人', artists: ['方大同'] }
      ],
      { likedPlaylistId: 'liked-1', now: 123 }
    )

    expect(profile).toMatchObject({
      source: 'netease_liked',
      updatedAt: 123,
      sampledTrackCount: 4,
      likedPlaylistId: 'liked-1'
    })
    expect(profile.topArtists).toContain('SZA')
    expect(profile.styleTags).toContain('R&B')
    expect(profile.languageHints).toEqual(expect.arrayContaining(['中文', '英文']))
    expect(profile.searchBias).toContain('R&B')
  })

  it('adds taste bias to search queries without duplicating similar hints', () => {
    const profile = analyzeMusicTaste([{ title: 'Good Days', artists: ['SZA'] }], { now: 123 })

    expect(applyMusicTasteToQuery('relaxing live radio', profile)).toContain('SZA')
    expect(applyMusicTasteToQuery('SZA relaxing live radio', profile)).toBe('SZA relaxing live radio')
  })

  it('can apply only style hints for background music searches', () => {
    const profile = analyzeMusicTaste([{ title: 'Good Days', artists: ['SZA'] }], { now: 123 })
    const query = applyMusicTasteToQuery('relaxing live radio', profile, 'styles_only')

    expect(query).toContain('R&B')
    expect(query).toContain('Neo Soul')
    expect(query).not.toContain('SZA')
  })

  it('keeps user-requested genre searches inside the requested genre family', () => {
    const profile = analyzeMusicTaste(
      [
        { title: 'Good Days', artists: ['SZA'] },
        { title: 'Blue in Green', artists: ['Miles Davis'] },
        { title: 'lofi rain', artists: ['Lo-fi Girl'] }
      ],
      { now: 123 }
    )
    const query = applyMusicTasteToQuery('R&B live radio', profile, 'contextual_styles')

    expect(query).toContain('R&B')
    expect(query).toContain('Neo Soul')
    expect(query).not.toContain('SZA')
    expect(query).not.toContain('Jazz')
    expect(query).not.toContain('Lo-fi')
  })
})
