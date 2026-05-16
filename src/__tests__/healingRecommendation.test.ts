import { describe, expect, it } from 'vitest'

import { buildHealingSearchQueries, buildHealingSearchQuery, createHealingRecommendation } from '@/services/music/HealingRecommendation'

describe('HealingRecommendation', () => {
  it('derives musical attributes from emotion target, time, and weather before building a query', () => {
    const context = {
      now: new Date('2026-05-15T22:00:00+08:00'),
      weather: {
        description: '小雨',
        temperature: 31,
        casualSummary: '广州现在小雨'
      }
    }
    const recommendation = createHealingRecommendation('water', context)
    const query = buildHealingSearchQuery('water', context)

    expect(recommendation).toMatchObject({
      primaryWuxing: 'water',
      mode: '羽调'
    })
    expect(recommendation.instruments).toEqual(expect.arrayContaining(['雨声', '海浪', '低频钟']))
    expect(recommendation.qualities).toEqual(expect.arrayContaining(['安神', '助眠', '极轻', '清凉', '柔和']))
    expect(query).not.toContain('羽调')
    expect(query).toContain('助眠')
    expect(query).toContain('雨声')
    expect(query).not.toContain('清凉')
    expect(query).not.toContain('夜晚')
  })

  it('creates progressively broader queries before the fixed fallback library is needed', () => {
    const queries = buildHealingSearchQueries('wood', {
      now: new Date('2026-05-15T18:19:00+08:00'),
      weather: {
        description: '小雨',
        temperature: 28,
        casualSummary: '广州现在小雨'
      }
    })

    expect(queries).toEqual([
      '古琴 流水 雨声',
      '古琴 流水',
      '古琴 轻音乐'
    ])
  })
})
