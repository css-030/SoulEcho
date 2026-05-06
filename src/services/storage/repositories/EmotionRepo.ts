import type { EmotionRecord } from '@/types/emotion'

import { db } from '../db'

export class EmotionRepo {
  async save(record: EmotionRecord): Promise<void> {
    await db.emotions.put(record)
  }

  async loadRecent(days: number): Promise<EmotionRecord[]> {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - Math.max(0, days - 1))

    return db.emotions.where('timestamp').aboveOrEqual(start.getTime()).sortBy('timestamp')
  }

  async loadByDateRange(startDate: string, endDate: string): Promise<EmotionRecord[]> {
    return db.emotions.where('date').between(startDate, endDate, true, true).sortBy('timestamp')
  }

  async loadMonth(year: number, month: number): Promise<EmotionRecord[]> {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0)
    const end = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

    return this.loadByDateRange(start, end)
  }

  async update(id: string, updates: Partial<EmotionRecord>): Promise<void> {
    await db.emotions.update(id, updates)
  }
}

export const emotionRepo = new EmotionRepo()
