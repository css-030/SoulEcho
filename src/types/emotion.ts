import type { WuxingType } from './wuxing'

export interface EmotionRecord {
  id: string
  date: string
  timestamp: number
  wuxingTag: WuxingType
  intensity: number
  source: 'auto' | 'manual'
  contextMessageIds?: string[]
  note?: string
}

export interface DailyEmotion {
  date: string
  dominantWuxing: WuxingType
  records: EmotionRecord[]
  iconKey: string
  iconLabel: string
}

export interface MonthlyEmotionStats {
  year: number
  month: number
  totalDays: number
  recordedDays: number
  distribution: Record<WuxingType, number>
  dominantWuxing: WuxingType
}
