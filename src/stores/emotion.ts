import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getAppEnv } from '@/services/config/env'
import { MomoService } from '@/services/momo/MomoService'
import { emotionRepo } from '@/services/storage/repositories/EmotionRepo'
import { useSettingsStore } from '@/stores/settings'
import type { DailyEmotion, EmotionRecord, GardenEmotionTag, MonthlyEmotionStats } from '@/types/emotion'
import { buildDailyEmotions, buildMonthlyEmotionStats, isFutureDate } from '@/utils/emotionGarden'
import { createId } from '@/utils/id'

function getMonthPrefix(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function createDateString(year: number, month: number, day: number): string {
  return `${getMonthPrefix(year, month)}-${String(day).padStart(2, '0')}`
}

export const useEmotionStore = defineStore('emotion', () => {
  const recordsThisMonth = ref<EmotionRecord[]>([])
  const currentMonth = ref({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 })
  const monthlyReport = ref<string | null>(null)

  const monthlyStats = computed<MonthlyEmotionStats>(() =>
    buildMonthlyEmotionStats({
      year: currentMonth.value.year,
      month: currentMonth.value.month,
      records: recordsThisMonth.value
    })
  )

  const dailyEmotions = computed<DailyEmotion[]>(() => buildDailyEmotions(recordsThisMonth.value))

  async function recordEmotion(record: Omit<EmotionRecord, 'id'> & { id?: string }): Promise<void> {
    const entity: EmotionRecord = {
      ...record,
      id: record.id ?? createId('emotion')
    }

    await emotionRepo.save(entity)

    if (entity.date.startsWith(getMonthPrefix(currentMonth.value.year, currentMonth.value.month))) {
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

  async function correctDailyEmotion(date: string, wuxingTag: GardenEmotionTag, note?: string): Promise<void> {
    if (isFutureDate(date)) {
      return
    }

    await recordEmotion({
      date,
      timestamp: Date.now(),
      wuxingTag,
      intensity: 1,
      source: 'manual',
      note
    })
  }

  async function generateMonthlyReport(): Promise<void> {
    const settingsStore = useSettingsStore()
    if (!settingsStore.isLoaded) {
      await settingsStore.initialize()
    }

    const service = new MomoService(settingsStore.settings.openaiApiKey || getAppEnv().openaiApiKey)
    monthlyReport.value = await service.generateMonthlyReport(monthlyStats.value)
  }

  function getDailyEmotion(date: string): DailyEmotion | undefined {
    return dailyEmotions.value.find((day) => day.date === date)
  }

  function getDateForDay(day: number): string {
    return createDateString(currentMonth.value.year, currentMonth.value.month, day)
  }

  return {
    recordsThisMonth,
    currentMonth,
    dailyEmotions,
    monthlyStats,
    monthlyReport,
    recordEmotion,
    loadMonth,
    updateRecord,
    correctDailyEmotion,
    generateMonthlyReport,
    getDailyEmotion,
    getDateForDay
  }
})
