import { describe, expect, it } from 'vitest'

import { sanitizeMusicRecommendationSay } from '@/services/momo/MusicResponseCopy'
import type { MusicRecommendation } from '@/types/music'

const recommendation: MusicRecommendation = {
  scenario: 'daily-bgm',
  source: 'youtube',
  searchQuery: 'R&B soul live radio chill stream',
  reason: '偏 mellow 的 R&B 电台流。'
}

describe('MusicResponseCopy', () => {
  it('replaces self-search copy when a music card will be shown', () => {
    const say = sanitizeMusicRecommendationSay("你可以去 YouTube 上搜索 'R&B soul live radio chill stream'。", recommendation)

    expect(say).toContain('我给你放一组')
    expect(say).not.toContain('你可以去 YouTube')
  })

  it('keeps natural recommendation copy unchanged', () => {
    const say = '好，我给你挑一组偏 mellow 的 R&B，鼓点别太抢。'

    expect(sanitizeMusicRecommendationSay(say, recommendation)).toBe(say)
  })
})

