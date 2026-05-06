import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { emotionRepo } from '@/services/storage/repositories/EmotionRepo'
import type { EmotionRecord, MonthlyEmotionStats } from '@/types/emotion'
import type { WuxingType } from '@/types/wuxing'
import { createId } from '@/utils/id'

const WUXING_TYPES: WuxingType[] = ['wood', 'fire', 'earth', 'metal', 'water']

function emptyDistribution(): Record<WuxingType, number> {
  return {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0
  }
}

function getDominantWuxing(distribution: Record<WuxingType, number>): WuxingType {
  return WUXING_TYPES.reduce((best, item) => (distribution[item] > distribution[best] ? item : best), 'wood')
}

export const useEmotionStore = defineStore('emotion', () => {
  const recordsThisMonth = ref<EmotionRecord[]>([])
  const currentMonth = ref({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 })
  const monthlyReport = ref<string | null>(null)

  const monthlyStats = computed<MonthlyEmotionStats>(() => {
    const distribution = emptyDistribution()
    const daysByWuxing = new Map<string, WuxingType>()
    const grouped = new Map<string, Record<WuxingType, number>>()

    for (const record of recordsThisMonth.value) {
      const dayDistribution = grouped.get(record.date) ?? emptyDistribution()
      dayDistribution[record.wuxingTag] += 1
      grouped.set(record.date, dayDistribution)
    }

    for (const [date, dayDistribution] of grouped) {
      const dominant = getDominantWuxing(dayDistribution)
      daysByWuxing.set(date, dominant)
      distribution[dominant] += 1
    }

    return {
      year: currentMonth.value.year,
      month: currentMonth.value.month,
      totalDays: new Date(currentMonth.value.year, currentMonth.value.month, 0).getDate(),
      recordedDays: daysByWuxing.size,
      distribution,
      dominantWuxing: getDominantWuxing(distribution)
    }
  })

  async function recordEmotion(record: Omit<EmotionRecord, 'id'> & { id?: string }): Promise<void> {
    const entity: EmotionRecord = {
      ...record,
      id: record.id ?? createId('emotion')
    }

    await emotionRepo.save(entity)

    if (entity.date.startsWith(`${currentMonth.value.year}-${String(currentMonth.value.month).padStart(2, '0')}`)) {
      recordsThisMonth.value = [...recordsThisMonth.value, entity].sort((a, b) => a.timestamp - b.timestamp)
    }
  }

  async function loadMonth(year: number, month: number): Promise<void> {
    currentMonth.value = { year, month }
    recordsThisMonth.value = await emotionRepo.loadMonth(year, month)
  }

  async function updateRecord(id: string, updates: Partial<EmotionRecord>): Promise<void> {
    await emotionRepo.update(id, updates)
    recordsThisMonth.value = recordsThisMonth.value.map((record) => (record.id === id ? { ...record, ...updates } : record))
  }

  return {
    recordsThisMonth,
    currentMonth,
    monthlyStats,
    monthlyReport,
    recordEmotion,
    loadMonth,
    updateRecord
  }
})
