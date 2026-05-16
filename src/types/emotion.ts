import type { WuxingType } from './wuxing'

export type GardenEmotionTag = WuxingType | 'balanced' | 'joyful'

export interface EmotionRecord {
  id: string
  date: string
  timestamp: number
  wuxingTag: GardenEmotionTag
  intensity: number
  source: 'auto' | 'manual'
  contextMessageIds?: string[]
  note?: string
}

export interface DailyEmotion {
  date: string
  dominantWuxing: GardenEmotionTag
  records: EmotionRecord[]
  iconKey: string
  iconLabel: string
}

export interface MonthlyEmotionStats {
  year: number
  month: number
  totalDays: number
  recordedDays: number
  distribution: Record<GardenEmotionTag, number>
  dominantWuxing: GardenEmotionTag
}
