import { describe, expect, it } from 'vitest'

import type { EmotionRecord } from '@/types/emotion'
import { buildDailyEmotions, buildMonthlyEmotionStats, getDominantFromRecords, isFutureDate } from '@/utils/emotionGarden'

function record(opts: Partial<EmotionRecord> & Pick<EmotionRecord, 'id' | 'date' | 'wuxingTag'>): EmotionRecord {
  return {
    timestamp: new Date(`${opts.date}T10:00:00`).getTime(),
    intensity: 0.6,
    source: 'auto',
    ...opts
  }
}

describe('emotion garden aggregation', () => {
  it('uses the latest manual correction as the dominant daily emotion', () => {
    const records = [
      record({ id: 'auto_1', date: '2026-05-03', wuxingTag: 'fire' }),
      record({
        id: 'manual_1',
        date: '2026-05-03',
        wuxingTag: 'water',
        source: 'manual',
        timestamp: new Date('2026-05-03T12:00:00').getTime()
      })
    ]

    expect(getDominantFromRecords(records)).toBe('water')
  })

  it('builds daily emotions sorted by date with icon metadata', () => {
    const daily = buildDailyEmotions([
      record({ id: 'b', date: '2026-05-04', wuxingTag: 'metal' }),
      record({ id: 'a', date: '2026-05-02', wuxingTag: 'wood' })
    ])

    expect(daily.map((item) => item.date)).toEqual(['2026-05-02', '2026-05-04'])
    expect(daily[0]).toMatchObject({
      dominantWuxing: 'wood',
      iconLabel: '木 · 肝'
    })
  })

  it('counts monthly distribution by daily dominant wuxing', () => {
    const stats = buildMonthlyEmotionStats({
      year: 2026,
      month: 5,
      records: [
        record({ id: 'a', date: '2026-05-02', wuxingTag: 'wood' }),
        record({ id: 'b', date: '2026-05-03', wuxingTag: 'fire' }),
        record({
          id: 'c',
          date: '2026-05-03',
          wuxingTag: 'water',
          source: 'manual',
          timestamp: new Date('2026-05-03T12:00:00').getTime()
        })
      ]
    })

    expect(stats.totalDays).toBe(31)
    expect(stats.recordedDays).toBe(2)
    expect(stats.distribution).toMatchObject({
      wood: 1,
      water: 1,
      fire: 0
    })
  })

  it('supports balanced and joyful manual garden states', () => {
    const stats = buildMonthlyEmotionStats({
      year: 2026,
      month: 5,
      records: [
        record({ id: 'balanced', date: '2026-05-05', wuxingTag: 'balanced', source: 'manual' }),
        record({ id: 'joyful', date: '2026-05-06', wuxingTag: 'joyful', source: 'manual' })
      ]
    })

    expect(stats.recordedDays).toBe(2)
    expect(stats.distribution.balanced).toBe(1)
    expect(stats.distribution.joyful).toBe(1)
  })

  it('uses the newest manual correction when a day is corrected more than once', () => {
    const daily = buildDailyEmotions([
      record({
        id: 'first',
        date: '2026-05-07',
        wuxingTag: 'metal',
        source: 'manual',
        timestamp: new Date('2026-05-07T12:00:00').getTime()
      }),
      record({
        id: 'second',
        date: '2026-05-07',
        wuxingTag: 'joyful',
        source: 'manual',
        timestamp: new Date('2026-05-07T12:05:00').getTime()
      })
    ])

    expect(daily[0].dominantWuxing).toBe('joyful')
  })

  it('detects dates after today as future dates', () => {
    const now = new Date('2026-05-07T18:00:00+08:00')

    expect(isFutureDate('2026-05-06', now)).toBe(false)
    expect(isFutureDate('2026-05-07', now)).toBe(false)
    expect(isFutureDate('2026-05-08', now)).toBe(true)
  })
})
