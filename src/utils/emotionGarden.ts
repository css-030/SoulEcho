import { EMOTION_ICON_MAP } from '@/data/emotionIcons'
import type { DailyEmotion, EmotionRecord, GardenEmotionTag, MonthlyEmotionStats } from '@/types/emotion'

const GARDEN_EMOTION_TYPES: GardenEmotionTag[] = ['balanced', 'joyful', 'wood', 'fire', 'earth', 'metal', 'water']

export function emptyEmotionDistribution(): Record<GardenEmotionTag, number> {
  return {
    balanced: 0,
    joyful: 0,
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0
  }
}

export function getDominantWuxing(distribution: Record<GardenEmotionTag, number>): GardenEmotionTag {
  return GARDEN_EMOTION_TYPES.reduce((best, item) => (distribution[item] > distribution[best] ? item : best), 'balanced')
}

export function getDominantFromRecords(records: EmotionRecord[]): GardenEmotionTag {
  const latestManual = [...records]
    .filter((record) => record.source === 'manual')
    .sort((a, b) => b.timestamp - a.timestamp)[0]

  if (latestManual) {
    return latestManual.wuxingTag
  }

  const distribution = emptyEmotionDistribution()
  for (const record of records) {
    distribution[record.wuxingTag] += Math.max(record.intensity, 0.1)
  }

  return getDominantWuxing(distribution)
}

export function buildDailyEmotions(records: EmotionRecord[]): DailyEmotion[] {
  const grouped = new Map<string, EmotionRecord[]>()

  for (const record of records) {
    const dayRecords = grouped.get(record.date) ?? []
    dayRecords.push(record)
    grouped.set(record.date, dayRecords)
  }

  return Array.from(grouped.entries())
    .map(([date, dayRecords]) => {
      const dominantWuxing = getDominantFromRecords(dayRecords)
      const icon = EMOTION_ICON_MAP[dominantWuxing]

      return {
        date,
        dominantWuxing,
        records: [...dayRecords].sort((a, b) => a.timestamp - b.timestamp),
        iconKey: icon.icon,
        iconLabel: icon.label
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function buildMonthlyEmotionStats(opts: {
  year: number
  month: number
  records: EmotionRecord[]
}): MonthlyEmotionStats {
  const dailyEmotions = buildDailyEmotions(opts.records)
  const distribution = emptyEmotionDistribution()

  for (const day of dailyEmotions) {
    distribution[day.dominantWuxing] += 1
  }

  return {
    year: opts.year,
    month: opts.month,
    totalDays: new Date(opts.year, opts.month, 0).getDate(),
    recordedDays: dailyEmotions.length,
    distribution,
    dominantWuxing: getDominantWuxing(distribution)
  }
}

export function isFutureDate(date: string, now = new Date()): boolean {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const target = new Date(`${date}T00:00:00`)
  return target.getTime() > today.getTime()
}
